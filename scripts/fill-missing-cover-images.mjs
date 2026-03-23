#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PEXELS_SEARCH_ENDPOINT = "https://api.pexels.com/v1/search";
const DEFAULT_REPORT = "supabase/fill-missing-cover-images-report.json";

const COLLECTION_QUERY_OVERRIDES = {
  "demo-social-flow": ["creator desk setup", "desk setup"],
  "my-audio-setup-307vkw": ["podcasting desk setup", "audio gear setup"],
};

function parseCliArgs(argv) {
  const parsed = {
    scope: "both",
    dryRun: false,
    report: DEFAULT_REPORT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--scope" && argv[index + 1]) {
      parsed.scope = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--report" && argv[index + 1]) {
      parsed.report = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--dry-run") {
      parsed.dryRun = true;
    }
  }

  return parsed;
}

function isBlank(value) {
  return value == null || String(value).trim() === "";
}

function unique(values) {
  return Array.from(new Set(values.filter((value) => !isBlank(value))));
}

function normalizeSearchValue(value) {
  return value
    .replace(/&/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeImageUrl(photo) {
  return (
    photo?.src?.landscape ??
    photo?.src?.large2x ??
    photo?.src?.large ??
    photo?.src?.original ??
    null
  );
}

function buildSearchParams(query) {
  const params = new URLSearchParams();
  params.set("query", query);
  params.set("per_page", "1");
  params.set("orientation", "landscape");
  params.set("size", "large");
  params.set("locale", "en-US");
  return params;
}

async function searchPexelsPhoto({ apiKey, query }) {
  const searchUrl = `${PEXELS_SEARCH_ENDPOINT}?${buildSearchParams(query).toString()}`;

  const response = await fetch(searchUrl, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Pexels request failed for "${query}" (${response.status}): ${body}`
    );
  }

  const payload = await response.json();
  return payload?.photos?.[0] ?? null;
}

function buildCategoryQueries(category) {
  const normalizedTitle = normalizeSearchValue(category.title);
  const firstWord = normalizedTitle.split(" ")[0] ?? normalizedTitle;

  return unique([category.title, normalizedTitle, firstWord]);
}

function buildCollectionQueries(collection) {
  const overrides = COLLECTION_QUERY_OVERRIDES[collection.slug] ?? [];
  const normalizedTitle = normalizeSearchValue(collection.title);
  const normalizedCategory = normalizeSearchValue(collection.categoryTitle ?? "");
  const slugWords = normalizeSearchValue(collection.slug.replace(/-/g, " "));
  const description = normalizeSearchValue(collection.description ?? "");

  return unique([
    ...overrides,
    normalizedCategory ? `${normalizedCategory} setup` : "",
    normalizedCategory ? `${normalizedCategory} gear` : "",
    normalizedTitle,
    slugWords,
    description,
    normalizedCategory,
  ]);
}

async function resolveImage({ apiKey, record, type }) {
  const queries =
    type === "category"
      ? buildCategoryQueries(record)
      : buildCollectionQueries(record);

  for (const query of queries) {
    const photo = await searchPexelsPhoto({
      apiKey,
      query,
    });

    const imageUrl = normalizeImageUrl(photo);

    if (imageUrl) {
      return {
        imageUrl,
        sourceUrl: photo?.url ?? "https://www.pexels.com/",
        matchedQuery: query,
      };
    }
  }

  return null;
}

async function loadMissingCategories(supabase) {
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,title")
    .eq("is_active", true)
    .or("cover_image_url.is.null,cover_image_url.eq.")
    .order("slug");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function loadMissingCollections(supabase) {
  const { data, error } = await supabase
    .from("collections")
    .select(
      "id,slug,title,description,kind,category_id,categories:category_id(title,slug)"
    )
    .or("cover_image_url.is.null,cover_image_url.eq.")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    kind: row.kind,
    categoryId: row.category_id,
    categoryTitle: row.categories?.title ?? "",
    categorySlug: row.categories?.slug ?? "",
  }));
}

async function applyCategoryUpdate(supabase, row) {
  const { error } = await supabase
    .from("categories")
    .update({
      cover_image_url: row.imageUrl,
      cover_image_source_url: row.sourceUrl,
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(error.message);
  }
}

async function applyCollectionUpdate(supabase, row) {
  const { error } = await supabase
    .from("collections")
    .update({
      cover_image_url: row.imageUrl,
      cover_image_source_url: row.sourceUrl,
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(error.message);
  }
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const pexelsApiKey = process.env.PEXELS_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase envs. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!pexelsApiKey) {
    throw new Error("Missing PEXELS_API_KEY.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const includeCategories = args.scope === "both" || args.scope === "categories";
  const includeCollections = args.scope === "both" || args.scope === "collections";

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    scope: args.scope,
    categories: {
      scanned: 0,
      updated: 0,
      unresolved: [],
      rows: [],
    },
    collections: {
      scanned: 0,
      updated: 0,
      unresolved: [],
      rows: [],
    },
  };

  if (includeCategories) {
    const categories = await loadMissingCategories(supabase);
    report.categories.scanned = categories.length;

    for (const category of categories) {
      const resolved = await resolveImage({
        apiKey: pexelsApiKey,
        record: category,
        type: "category",
      });

      if (!resolved) {
        report.categories.unresolved.push({
          slug: category.slug,
          title: category.title,
        });
        continue;
      }

      const row = {
        id: category.id,
        slug: category.slug,
        title: category.title,
        ...resolved,
      };

      if (!args.dryRun) {
        await applyCategoryUpdate(supabase, row);
      }

      report.categories.updated += 1;
      report.categories.rows.push(row);
    }
  }

  if (includeCollections) {
    const collections = await loadMissingCollections(supabase);
    report.collections.scanned = collections.length;

    for (const collection of collections) {
      const resolved = await resolveImage({
        apiKey: pexelsApiKey,
        record: collection,
        type: "collection",
      });

      if (!resolved) {
        report.collections.unresolved.push({
          slug: collection.slug,
          title: collection.title,
        });
        continue;
      }

      const row = {
        id: collection.id,
        slug: collection.slug,
        title: collection.title,
        categoryTitle: collection.categoryTitle,
        ...resolved,
      };

      if (!args.dryRun) {
        await applyCollectionUpdate(supabase, row);
      }

      report.collections.updated += 1;
      report.collections.rows.push(row);
    }
  }

  const reportPath = resolve(process.cwd(), args.report);
  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        reportPath: args.report,
        categories: {
          scanned: report.categories.scanned,
          updated: report.categories.updated,
          unresolved: report.categories.unresolved.length,
        },
        collections: {
          scanned: report.collections.scanned,
          updated: report.collections.updated,
          unresolved: report.collections.unresolved.length,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
