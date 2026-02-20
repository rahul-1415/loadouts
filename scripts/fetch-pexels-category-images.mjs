#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const DEFAULT_INPUT = "supabase/seed-100-categories.sql";
const DEFAULT_OUTPUT = "supabase/seed-100-category-images.sql";
const DEFAULT_REPORT = "supabase/seed-100-category-images-report.json";
const PEXELS_SEARCH_ENDPOINT = "https://api.pexels.com/v1/search";
const FALLBACK_IMAGE_URL =
  "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=1600";
const FALLBACK_SOURCE_URL = "https://www.pexels.com/";

function parseCliArgs(argv) {
  const parsed = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    report: DEFAULT_REPORT,
    perPage: 3,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--input" && argv[index + 1]) {
      parsed.input = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--output" && argv[index + 1]) {
      parsed.output = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--report" && argv[index + 1]) {
      parsed.report = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--per-page" && argv[index + 1]) {
      const parsedValue = Number(argv[index + 1]);
      if (Number.isFinite(parsedValue) && parsedValue > 0 && parsedValue <= 15) {
        parsed.perPage = parsedValue;
      }
      index += 1;
    }
  }

  return parsed;
}

function extractCategories(sqlText) {
  const categoryRegex = /\('([^']+)'\s*,\s*'((?:''|[^'])*)'\s*,\s*'((?:''|[^'])*)'\)/g;
  const categories = [];
  let match;

  while ((match = categoryRegex.exec(sqlText)) !== null) {
    const slug = match[1];
    const title = match[2].replace(/''/g, "'");
    categories.push({ slug, title });
  }

  return categories;
}

function toSqlString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function buildSearchParams(query, perPage) {
  const params = new URLSearchParams();
  params.set("query", query);
  params.set("per_page", String(perPage));
  params.set("orientation", "landscape");
  params.set("size", "large");
  params.set("locale", "en-US");
  return params;
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

function normalizeSourceUrl(photo) {
  return photo?.url ?? FALLBACK_SOURCE_URL;
}

async function searchPexelsPhoto({ apiKey, query, perPage }) {
  const searchUrl = `${PEXELS_SEARCH_ENDPOINT}?${buildSearchParams(
    query,
    perPage
  ).toString()}`;

  const response = await fetch(searchUrl, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Pexels request failed for "${query}" (${response.status}): ${responseBody}`
    );
  }

  const payload = await response.json();
  const photo = payload?.photos?.[0] ?? null;

  return photo;
}

function alternateQueries(title) {
  const normalized = title
    .replace(/&/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const firstWord = normalized.split(" ")[0] ?? normalized;

  const queries = [title];
  if (normalized && normalized.toLowerCase() !== title.toLowerCase()) {
    queries.push(normalized);
  }

  if (firstWord && !queries.includes(firstWord)) {
    queries.push(firstWord);
  }

  return queries;
}

async function resolveCategoryImage({ apiKey, title, perPage }) {
  const candidates = alternateQueries(title);

  for (const query of candidates) {
    const photo = await searchPexelsPhoto({
      apiKey,
      query,
      perPage,
    });

    const imageUrl = normalizeImageUrl(photo);
    if (imageUrl) {
      return {
        imageUrl,
        sourceUrl: normalizeSourceUrl(photo),
        matchedQuery: query,
        fallbackUsed: false,
      };
    }
  }

  return {
    imageUrl: FALLBACK_IMAGE_URL,
    sourceUrl: FALLBACK_SOURCE_URL,
    matchedQuery: null,
    fallbackUsed: true,
  };
}

function buildUpdateSql(rows) {
  const valuesSql = rows
    .map(
      (row) =>
        `    (${toSqlString(row.slug)}, ${toSqlString(
          row.imageUrl
        )}, ${toSqlString(row.sourceUrl)})`
    )
    .join(",\n");

  return `begin;

with rows(slug, cover_image_url, cover_image_source_url) as (
  values
${valuesSql}
)
update public.categories as c
set
  cover_image_url = rows.cover_image_url,
  cover_image_source_url = rows.cover_image_source_url
from rows
where c.slug = rows.slug
  and c.is_active = true;

commit;
`;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const pexelsApiKey = process.env.PEXELS_API_KEY;

  if (!pexelsApiKey) {
    throw new Error(
      "PEXELS_API_KEY is missing. Export it before running this script."
    );
  }

  const inputPath = resolve(process.cwd(), args.input);
  const outputPath = resolve(process.cwd(), args.output);
  const reportPath = resolve(process.cwd(), args.report);

  const inputSql = await readFile(inputPath, "utf8");
  const categories = extractCategories(inputSql);

  if (categories.length === 0) {
    throw new Error(`No categories found in ${args.input}`);
  }

  const rows = [];
  const reportRows = [];

  for (const category of categories) {
    const resolvedImage = await resolveCategoryImage({
      apiKey: pexelsApiKey,
      title: category.title,
      perPage: args.perPage,
    });

    rows.push({
      slug: category.slug,
      imageUrl: resolvedImage.imageUrl,
      sourceUrl: resolvedImage.sourceUrl,
    });

    reportRows.push({
      slug: category.slug,
      title: category.title,
      imageUrl: resolvedImage.imageUrl,
      sourceUrl: resolvedImage.sourceUrl,
      matchedQuery: resolvedImage.matchedQuery,
      fallbackUsed: resolvedImage.fallbackUsed,
    });
  }

  const sql = buildUpdateSql(rows);
  const fallbackCount = reportRows.filter((row) => row.fallbackUsed).length;

  await writeFile(outputPath, sql, "utf8");
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        categoryCount: reportRows.length,
        fallbackCount,
        rows: reportRows,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  process.stdout.write(
    `Generated ${args.output} and ${args.report} for ${reportRows.length} categories (fallbacks: ${fallbackCount}).\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
