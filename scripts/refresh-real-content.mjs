import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "tmp");

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const manualProductOverrides = {
  "airpods-pro-2": {
    description:
      "AirPods Pro deliver active noise cancellation, transparency mode, and a compact in-ear form factor for monitoring, calls, and everyday listening.",
    imageUrl:
      "https://www.apple.com/v/airpods-pro/r/images/meta/og__c0ceegchesom_overview.png?202603242312",
    productUrl: "https://www.apple.com/airpods-pro/",
    sourceUrl: "https://www.apple.com/airpods-pro/",
    imageSourceUrl: "https://www.apple.com/airpods-pro/",
  },
  "amaran-200x-s": {
    description:
      "The amaran 200x S is a 200W bi-color Bowens Mount point source light with upgraded high-SSI LEDs, improved spectral quality, and app-controlled output for creator and studio setups.",
    imageUrl:
      "https://cdn.sanity.io/images/7n7ckclh/production/5522e3fb4c78212adedd9ff4ea9dfbb2e4c5a8aa-400x400.jpg",
    productUrl: "https://amarancreators.com/products/amaran-200x-s",
    sourceUrl: "https://amarancreators.com/products/amaran-200x-s",
    imageSourceUrl: "https://amarancreators.com/products/amaran-200x-s",
  },
  "canon-r6-mark-ii": {
    description:
      "The EOS R6 Mark II is Canon's full-frame mirrorless camera built for hybrid creators, with fast autofocus, strong low-light performance, and high-end still and video capture.",
    imageUrl:
      "https://s7d1.scene7.com/is/image/canon/5666C002_eos_r6_mark_ii_body_primary?fmt=webp-alpha&wid=1335",
    productUrl: "https://www.usa.canon.com/shop/p/eos-r6-mark-ii?color=Black&type=New",
    sourceUrl: "https://www.usa.canon.com/shop/p/eos-r6-mark-ii?color=Black&type=New",
    imageSourceUrl: "https://www.usa.canon.com/shop/p/eos-r6-mark-ii?color=Black&type=New",
  },
  "dell-u2723qe": {
    description:
      "Dell's UltraSharp U2723QE is a 27-inch 4K USB-C hub monitor with IPS Black technology, sharp color, and dock-style connectivity for desk setups and editing workstations.",
    imageUrl:
      "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/u-series/u2723qe/media-gallery/monitor-u2723qe-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=872&qlt=100,1&resMode=sharp2&size=872,804&chrss=full",
    productUrl:
      "https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories",
    sourceUrl:
      "https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories",
    imageSourceUrl:
      "https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories",
  },
  "gopro-hero12": {
    description:
      "HERO12 Black is GoPro's flagship action camera with rugged waterproof hardware, HyperSmooth stabilization, and long-form capture for POV and travel workflows.",
    imageUrl:
      "https://static.gopro.com/assets/blta2b8522e5372af40/blt3e1d69abee0b4203/6659dac7d036b23b240097f8/01-pdp-h12b-gallery-v2-1920.jpg?width=3840&quality=80&auto=webp&disable=upscale",
    productUrl: "https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html",
    sourceUrl: "https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html",
    imageSourceUrl: "https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html",
  },
  "insta360-link-2": {
    description:
      "Insta360 Link 2 is a 4K AI webcam with intelligent framing, strong low-light performance, and pro-level audio aimed at streaming, calls, and creator desks.",
    imageUrl: "https://res.insta360.com/static/4e0d93be46a8714eead3c5478287a033/KV_@1440.jpg",
    productUrl: "https://www.insta360.com/product/insta360-link2",
    sourceUrl: "https://www.insta360.com/product/insta360-link2",
    imageSourceUrl: "https://www.insta360.com/product/insta360-link2",
  },
  "mx-master-3s": {
    description:
      "MX Master 3S is Logitech's flagship productivity mouse with quiet clicks, MagSpeed scrolling, and precision tracking for multi-device desk workflows.",
    imageUrl:
      "https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/2025-update/mx-master-3s-bluetooth-edition-top-view-black-new-1.png",
    productUrl: "https://www.logitech.com/en-us/shop/p/mx-master-3s",
    sourceUrl: "https://www.logitech.com/en-us/shop/p/mx-master-3s",
    imageSourceUrl: "https://www.logitech.com/en-us/shop/p/mx-master-3s",
  },
  "obs-studio": {
    description:
      "OBS Studio is free, open-source software for recording and live streaming, with scene control, audio routing, and broadcaster-grade output workflows.",
    imageUrl: "https://obsproject.com/assets/images/features-new/hero.png",
    productUrl: "https://obsproject.com/",
    sourceUrl: "https://obsproject.com/",
    imageSourceUrl: "https://obsproject.com/",
  },
  "premiere-pro": {
    description:
      "Adobe Premiere is professional video editing software for cutting footage, color work, audio mixing, and polished post-production across creator and studio workflows.",
    imageUrl:
      "https://www.adobe.com/cc-shared/fragments/products/premiere/media_13231f4af57fd65bb780d691fc842fe044a428c23.png?width=2000&format=webply&optimize=medium",
    productUrl: "https://www.adobe.com/products/premiere.html",
    sourceUrl: "https://www.adobe.com/products/premiere.html",
    imageSourceUrl: "https://www.adobe.com/products/premiere.html",
  },
  "sandisk-extreme-ssd": {
    description:
      "The SanDisk Extreme Portable SSD is a compact external SSD built for fast file movement, on-the-go editing, and rugged creator workflows across devices.",
    imageUrl:
      "https://www.sandisk.com/content/dam/store/en-us/assets/products/usb-flash-drives/extreme-usb-3-2-ssd/gallery/extreme-usb-3-2-ssd-front.png.wdthumb.1280.1280.webp",
    productUrl:
      "https://www.sandisk.com/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-500G-G25",
    sourceUrl:
      "https://www.sandisk.com/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-500G-G25",
    imageSourceUrl:
      "https://www.sandisk.com/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-500G-G25",
  },
  "sigma-24-70-f28": {
    description:
      "Sigma's 24-70mm F2.8 DG DN Art is a fast standard zoom lens for full-frame mirrorless systems, built for versatile shooting across portrait, event, and video work.",
    imageUrl: "https://www.sigma-global.com/lenses/a019_24_70_28_product_img01.png",
    productUrl: "https://www.sigma-global.com/en/lenses/a019_24_70_28/",
    sourceUrl: "https://www.sigma-global.com/en/lenses/a019_24_70_28/",
    imageSourceUrl: "https://www.sigma-global.com/en/lenses/a019_24_70_28/",
  },
  "sony-a7iv": {
    description:
      "Sony's Alpha 7 IV is a full-frame hybrid camera that balances high-resolution stills, strong autofocus, and 4K video for modern creator workflows.",
    imageUrl:
      "https://d1ncau8tqf99kp.cloudfront.net/converted/92650_original_local_1200x1050_v3_converted.webp",
    productUrl:
      "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7m4-b",
    sourceUrl:
      "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7m4-b",
    imageSourceUrl:
      "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7m4-b",
  },
  "sony-wh1000xm5": {
    description:
      "Sony's WH-1000XM5 headphones combine premium noise cancellation, strong call quality, and long battery life for focused work and travel listening.",
    imageUrl:
      "https://d1ncau8tqf99kp.cloudfront.net/converted/103364_original_local_1200x1050_v3_converted.webp",
    productUrl: "https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b",
    sourceUrl: "https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b",
    imageSourceUrl: "https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b",
  },
};

const loadoutOverrides = {
  "creator-desk-kit": {
    description:
      "A focused desk setup for writing, design reviews, planning, and shipping content without clutter.",
    coverCategorySlug: "cat-013",
  },
  "video-starter-kit": {
    description:
      "A practical starter video setup built around one camera, clean audio, and simple lighting for fast production.",
    coverCategorySlug: "cat-009",
  },
  "demo-social-flow": {
    description:
      "A shared demo loadout used to verify follows, saves, likes, comments, and notification flows across the app.",
  },
};

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function cleanHtmlValue(value) {
  if (!value) return null;
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function matchFirst(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return cleanHtmlValue(match[1]);
    }
  }
  return null;
}

function fetchHtml(url) {
  return execFileSync("curl", ["-L", "--http1.1", "-A", "Mozilla/5.0", url], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 16,
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function autoExtractMetadata(url) {
  const html = fetchHtml(url);
  return {
    title: matchFirst(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]),
    description: matchFirst(html, [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"]*)["']/i,
      /<meta[^>]+content=["']([^"]*)["'][^>]+name=["']description["']/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"]*)["']/i,
      /<meta[^>]+content=["']([^"]*)["'][^>]+property=["']og:description["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=['"]([^'"]+)['"]/i,
    ]),
    imageUrl: matchFirst(html, [
      /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i,
      /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i,
    ]),
    canonical: matchFirst(html, [
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
    ]),
  };
}

function trimDescription(value) {
  if (!value) return null;
  return value.length <= 220 ? value : `${value.slice(0, 217).trimEnd()}...`;
}

function normalizeUrl(value) {
  if (!value) return null;
  return value.startsWith("http://") ? `https://${value.slice("http://".length)}` : value;
}

function pickDescription(current, extracted) {
  return trimDescription(extracted?.description) ?? current.description;
}

async function fetchCurrentData() {
  const [{ data: products, error: productError }, { data: categories, error: categoryError }, { data: loadouts, error: loadoutError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id,slug,name,brand,description,image_url,image_source_url,product_url,source_url")
        .order("slug"),
      supabase
        .from("categories")
        .select("slug,cover_image_url,cover_image_source_url")
        .in("slug", ["cat-009", "cat-013"]),
      supabase
        .from("collections")
        .select("id,slug,title,description,cover_image_url,cover_image_source_url")
        .in("slug", Object.keys(loadoutOverrides)),
    ]);

  if (productError) throw productError;
  if (categoryError) throw categoryError;
  if (loadoutError) throw loadoutError;

  return {
    products: products ?? [],
    categories: categories ?? [],
    loadouts: loadouts ?? [],
  };
}

async function buildProductUpdates(products) {
  const updates = [];

  for (const product of products) {
    let next = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      description: product.description,
      image_url: product.image_url,
      image_source_url: product.image_source_url,
      product_url: product.product_url,
      source_url: product.source_url,
      strategy: "unchanged",
    };

    if (manualProductOverrides[product.slug]) {
      const override = manualProductOverrides[product.slug];
      next = {
        ...next,
        description: override.description,
        image_url: override.imageUrl,
        image_source_url: override.imageSourceUrl,
        product_url: override.productUrl,
        source_url: override.sourceUrl,
        strategy: "manual",
      };
    } else {
      try {
        const extracted = autoExtractMetadata(product.product_url);
        next = {
          ...next,
          description: pickDescription(product, extracted),
          image_url: normalizeUrl(extracted.imageUrl ?? product.image_url),
          image_source_url: extracted.imageUrl
            ? normalizeUrl(extracted.canonical ?? product.product_url)
            : normalizeUrl(product.image_source_url),
          product_url: normalizeUrl(extracted.canonical ?? product.product_url),
          source_url: normalizeUrl(extracted.canonical ?? product.source_url ?? product.product_url),
          strategy: "auto",
        };
      } catch (error) {
        next = {
          ...next,
          strategy: `fallback:${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    updates.push(next);
  }

  return updates;
}

function buildLoadoutUpdates(loadouts, categories) {
  const categoryMap = new Map(categories.map((row) => [row.slug, row]));
  return loadouts.map((loadout) => {
    const override = loadoutOverrides[loadout.slug];
    const cover = override.coverCategorySlug ? categoryMap.get(override.coverCategorySlug) : null;

    return {
      id: loadout.id,
      slug: loadout.slug,
      description: override.description ?? loadout.description,
      cover_image_url: cover?.cover_image_url ?? loadout.cover_image_url,
      cover_image_source_url: cover?.cover_image_source_url ?? loadout.cover_image_source_url,
    };
  });
}

async function applyUpdates(productUpdates, loadoutUpdates) {
  for (const row of productUpdates) {
    const { error } = await supabase
      .from("products")
      .update({
        description: row.description,
        image_url: row.image_url,
        image_source_url: row.image_source_url,
        product_url: row.product_url,
        source_url: row.source_url,
      })
      .eq("id", row.id);

    if (error) throw error;
  }

  for (const row of loadoutUpdates) {
    const { error } = await supabase
      .from("collections")
      .update({
        description: row.description,
        cover_image_url: row.cover_image_url,
        cover_image_source_url: row.cover_image_source_url,
      })
      .eq("id", row.id);

    if (error) throw error;
  }
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const shouldApply = process.argv.includes("--apply");
  const current = await fetchCurrentData();
  const productUpdates = await buildProductUpdates(current.products);
  const loadoutUpdates = buildLoadoutUpdates(current.loadouts, current.categories);

  const report = {
    generatedAt: new Date().toISOString(),
    applied: shouldApply,
    productUpdates: productUpdates.map((row) => ({
      slug: row.slug,
      strategy: row.strategy,
      description: row.description,
      image_url: row.image_url,
      image_source_url: row.image_source_url,
      product_url: row.product_url,
      source_url: row.source_url,
    })),
    loadoutUpdates,
  };

  fs.writeFileSync(
    path.join(outputDir, "refresh-real-content-report.json"),
    JSON.stringify(report, null, 2),
  );

  if (shouldApply) {
    await applyUpdates(productUpdates, loadoutUpdates);
  }

  console.log(
    JSON.stringify(
      {
        applied: shouldApply,
        products: productUpdates.length,
        loadouts: loadoutUpdates.length,
        manualProductOverrides: productUpdates.filter((row) => row.strategy === "manual").length,
        autoProductUpdates: productUpdates.filter((row) => row.strategy === "auto").length,
        fallbackProducts: productUpdates.filter((row) => row.strategy.startsWith("fallback:")).map((row) => row.slug),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
