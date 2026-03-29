import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const manifestPath = path.join(rootDir, "data", "curated-product-catalog.json");
const outputPath = path.join(rootDir, "tmp", "curated-product-import-report.json");

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const adminEmails = (process.env.LOADOUTS_ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

if (adminEmails.length === 0) {
  throw new Error("Missing LOADOUTS_ADMIN_EMAILS; set at least one admin email");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const curatedProducts = manifest.products ?? [];
const report = [];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const manualOverrides = {
  "airpods-max": {
    description:
      "AirPods Max are Apple's over-ear headphones with active noise cancellation, transparency mode, spatial audio, and a premium closed-back design for focused listening.",
  },
  "apple-studio-display": {
    description:
      "Studio Display is Apple's 27-inch 5K monitor with a built-in camera, speakers, and Thunderbolt connectivity for desk setups, editing, and review workflows.",
  },
  "mac-mini-m4": {
    description:
      "Mac mini packs Apple silicon performance into a compact desktop for coding, editing, streaming, and creator workstation setups.",
  },
  "logitech-mx-keys-s": {
    description:
      "MX Keys S is Logitech's full-size low-profile keyboard with smart illumination, multi-device pairing, and a clean layout for daily desk work.",
  },
  "logitech-brio-500": {
    description:
      "Brio 500 is a Full HD webcam with auto light correction, noise-reducing mics, and framing tools for calls, streams, and creator desks.",
    imageUrl:
      "https://resource.logitech.com/c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/webcams/brio-500/gallery/brio-500-gallery-graphite-1.png",
  },
  "keychron-q1-max": {
    description:
      "Q1 Max is Keychron's aluminum wireless mechanical keyboard with QMK/VIA support, hot-swappable switches, and a denser 75% layout.",
    imageUrl:
      "https://www.keychron.com/cdn/shop/files/Q1-Max-Iconic-Features.jpg?crop=center&height=1200&v=1754276986&width=1200",
  },
  "elgato-stream-deck-mk2": {
    description:
      "Stream Deck MK.2 gives creators programmable keys for live control, shortcuts, and workflow automation across recording, editing, and streaming setups.",
    imageUrl:
      "https://images.ctfassets.net/h50kqpe25yx1/7Cwo01eNtXbhr1fsum2248/28c5f862966fa0c48353d3a80ff33c99/Stream-Deck-Social-Graph.jpg",
  },
  "elgato-wave-3": {
    description:
      "Wave:3 is a USB condenser microphone tuned for streaming, voiceover, and desk recordings, with onboard control and Elgato Wave Link integration.",
  },
  "elgato-cam-link-4k": {
    description:
      "Cam Link 4K turns a camera into a clean webcam or stream source, making higher-end capture easy for video calls, live shows, and tutorials.",
  },
  "rode-podmic-usb": {
    description:
      "PodMic USB is a dynamic broadcast microphone with both XLR and USB connectivity for flexible podcast, stream, and creator setups.",
  },
  "shure-mv7-plus": {
    description:
      "MV7+ is Shure's hybrid XLR/USB dynamic microphone for podcasters, streamers, and voice work, with onboard DSP and strong speech presence.",
    imageUrl:
      "https://products.shureweb.eu/shure_product_db/product_main_images/files/0a5/4f1/be-/setcard/fe71d068e73acc951e1c9a0458a7093c.jpeg",
  },
  "focusrite-scarlett-solo-4th-gen": {
    description:
      "Scarlett Solo 4th Gen is a compact 2-in/2-out interface for vocals, instruments, and desk recording with Focusrite's updated preamp design.",
  },
  "samsung-t9-portable-ssd": {
    description:
      "Portable SSD T9 is a fast external SSD for offloading footage, editing from external storage, and keeping creator files portable across devices.",
  },
  "sony-zv-e1": {
    description:
      "ZV-E1 is Sony's full-frame creator camera tuned for solo shooting, autofocus-heavy video, and compact studio or travel production.",
    imageUrl:
      "https://d1ncau8tqf99kp.cloudfront.net/converted/102462_original_local_1200x1050_v3_converted.webp",
  },
  "sony-fe-24-70-gm-ii": {
    description:
      "FE 24-70mm F2.8 GM II is Sony's flagship standard zoom for hybrid shooters who need one fast lens across studio, event, and travel work.",
    imageUrl:
      "https://d1ncau8tqf99kp.cloudfront.net/converted/102462_original_local_1200x1050_v3_converted.webp",
  },
  "dji-mini-4-pro": {
    description:
      "Mini 4 Pro is DJI's lightweight drone with obstacle sensing and stabilized 4K capture for travel, property, and creator aerial work.",
  },
  "dji-mic-2": {
    description:
      "DJI Mic 2 is a compact wireless microphone system with onboard recording, intelligent noise reduction, and reliable two-person capture for interviews and creator video kits.",
  },
  "dji-osmo-pocket-3": {
    description:
      "Osmo Pocket 3 is DJI's stabilized pocket camera with a 1-inch sensor, rotating touchscreen, and fast start-up for vlogging, travel, and handheld b-roll capture.",
  },
  "boox-palma-2": {
    description:
      "BOOX Palma 2 is a compact ePaper device for reading, annotation, and distraction-light research while keeping a phone-sized form factor.",
    imageUrl:
      "https://shop.boox.com/cdn/shop/files/01_d2c58899-ae0c-489e-a94f-fc3417b8834b_grande.jpg?v=1729236534",
  },
  "blackmagic-pocket-cinema-camera-6k-pro": {
    description:
      "Pocket Cinema Camera 6K Pro is Blackmagic's Super 35 cinema camera with internal ND filters and RAW capture for more deliberate video production.",
    imageUrl:
      "https://images.blackmagicdesign.com/images/products/blackmagicpocketcinemacamera/product-grid/blackmagic-pocket-cinema-camera-6k-pro.jpg?_v=1709252069",
  },
  "davinci-resolve": {
    description:
      "DaVinci Resolve brings editing, color, audio, motion graphics, and collaboration into one post-production application.",
    imageUrl:
      "https://images.blackmagicdesign.com/images/products/davinciresolve/product-grid/davinci-resolve-studio.jpg?_v=1712728177",
  },
  "adobe-lightroom": {
    description:
      "Lightroom is Adobe's photo workflow app for organizing, editing, syncing, and delivering still images across desktop and mobile.",
    imageUrl:
      "https://www.adobe.com/products/media_1e459da212cbda34dbab87b26a733fff0de666ad0.jpg?format=jpg&optimize=medium&width=750",
  },
  "raycast": {
    description:
      "Raycast is a keyboard-first launcher for command execution, search, snippets, clipboard history, and workflow extensions on macOS.",
  },
  "framer": {
    description:
      "Framer is a site builder and prototyping platform for publishing interactive marketing pages and product experiences quickly.",
  },
  "ableton-live-12": {
    description:
      "Ableton Live 12 is music production software built for composition, performance, and sound design workflows.",
  },
  "aputure-mc-pro": {
    description:
      "MC Pro is Aputure's compact RGBWW light for practical accents, mobile kits, and color control in tighter production environments.",
  },
  "benq-pd3225u": {
    description:
      "PD3225U is BenQ's 32-inch 4K monitor for creative work, with Thunderbolt connectivity, wide-gamut color, and display tuning aimed at video, photo, and design workflows.",
  },
  "caldigit-ts4": {
    description:
      "The CalDigit TS4 Thunderbolt 4 Dock adds 18 ports of connectivity, 98W laptop charging, dual display connectivity, and 2.5GbE via a single cable.",
    imageUrl:
      "https://www.caldigit.com/wp-content/uploads/2021/12/TS4_Thunderbolt-4-Dock_S2V1_D_1920px_Updated.jpg",
  },
  "elgato-facecam-pro": {
    description:
      "Facecam Pro is Elgato's flagship 4K webcam with a larger Sony sensor, manual controls, and high-detail capture for creator desks, remote production, and streaming.",
  },
  "fujifilm-x100vi": {
    description:
      "X100VI is Fujifilm's premium fixed-lens compact camera, pairing a 40MP APS-C sensor with classic controls and in-body stabilization for everyday carry photography.",
    imageUrl:
      "https://www.fujifilm-x.com/products-cameras-static/x100vi/assets/images/top/sageabe_device_img_03.png",
  },
  "kobo-libra-colour": {
    description:
      "Kobo Libra Colour is a 7-inch color E Ink reader built for reading, markup, and note-taking with physical page buttons and stylus support.",
  },
  "logitech-litra-glow": {
    description:
      "Litra Glow is Logitech's compact desktop light for video calls, streams, and desk setups, built to deliver soft front light without taking up much space.",
    imageUrl:
      "https://resource.logitech.com/c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/lighting/litra-glow/gallery/litra-glow-streaming-light-front-view-graphite.png",
  },
  "owc-envoy-pro-fx": {
    description:
      "Envoy Pro FX is OWC's rugged Thunderbolt and USB-C SSD, built for fast offloads, portable editing, and creator travel workflows across Mac and PC.",
  },
  "rode-wireless-pro": {
    description:
      "Wireless PRO is RODE's pro-grade compact wireless system with 32-bit float onboard recording, timecode, and dual-transmitter capture for serious video kits.",
  },
  "samsung-t9-portable-ssd": {
    description:
      "Portable SSD T9 is Samsung's high-speed external SSD for large media transfers, edit-from-drive workflows, and reliable portable storage on creator desks and travel kits.",
    imageUrl:
      "https://images.samsung.com/is/image/samsung/p6pim/us/mu-pg1t0b-am/gallery/us-portable-ssd-t9-mu-pg1t0b-am-550971186?$product-details-jpg$",
    productUrl:
      "https://www.samsung.com/us/memory-storage/portable-ssd/portable-ssd-t9-usb-3-2-1tb-black-sku-mu-pg1t0b-am/",
    sourceUrl:
      "https://www.samsung.com/us/memory-storage/portable-ssd/portable-ssd-t9-usb-3-2-1tb-black-sku-mu-pg1t0b-am/",
  },
  "sony-fx3": {
    description:
      "FX3 is Sony's compact full-frame Cinema Line camera, designed for handheld filmmaking with strong low-light performance, 4K capture, and pro video controls.",
    imageUrl:
      "https://d1ncau8tqf99kp.cloudfront.net/converted/128744_original_local_1200x1050_v3_converted.webp",
    productUrl:
      "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilmefx3a",
    sourceUrl:
      "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilmefx3a",
  },
};

function hasUsableImageUrl(url) {
  if (!url) return false;

  return !(
    url.startsWith("http://") ||
    url === "http://0.1.172.3/" ||
    url.includes("logitech-global-og-image") ||
    url.includes("samsung-logo")
  );
}

function hasUsableSourceUrl(url) {
  return Boolean(url && !url.includes("/errors/404"));
}

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
  return execFileSync(
    "curl",
    ["-L", "--http1.1", "--max-time", "20", "-A", "Mozilla/5.0", url],
    {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 16,
      stdio: ["ignore", "pipe", "ignore"],
    }
  );
}

function resolveUrl(value, baseUrl) {
  if (!value) return null;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function extractMetadata(url) {
  const html = fetchHtml(url);

  return {
    description: matchFirst(html, [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
      /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i,
    ]),
    imageUrl: resolveUrl(
      matchFirst(html, [
        /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i,
        /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
      ]),
      url
    ),
    canonical: resolveUrl(
      matchFirst(html, [
        /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
        /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
      ]),
      url
    ),
  };
}

function trimDescription(value) {
  if (!value) return null;
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length <= 220 ? compact : `${compact.slice(0, 217).trimEnd()}...`;
}

function getPrimaryAdminEmail() {
  return adminEmails[0] ?? null;
}

async function getAdminUserId() {
  const targetEmail = getPrimaryAdminEmail();

  if (!targetEmail) {
    throw new Error("No admin email available");
  }

  let page = 1;

  while (page < 5) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });

    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === targetEmail
    );

    if (match) {
      return match.id;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  throw new Error(`Admin user not found for ${targetEmail}`);
}

async function main() {
  fs.mkdirSync(path.join(rootDir, "tmp"), { recursive: true });

  const ownerId = await getAdminUserId();

  const { data: existingProducts, error: existingError } = await supabase
    .from("products")
    .select("id,slug,description,image_url,product_url,source_url,created_by");

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingBySlug = new Map((existingProducts ?? []).map((row) => [row.slug, row]));
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const entry of curatedProducts) {
    console.log(`Scraping ${entry.slug}`);
    const existing = existingBySlug.get(entry.slug) ?? null;
    const override = manualOverrides[entry.slug] ?? {};
    const hasOverride = Boolean(
      override.description ||
        override.imageUrl ||
        override.productUrl ||
        override.sourceUrl ||
        override.imageSourceUrl
    );
    const shouldSkip =
      existing &&
      existing.description &&
      hasUsableImageUrl(existing.image_url) &&
      existing.product_url &&
      hasUsableSourceUrl(existing.source_url) &&
      !hasOverride;

    if (shouldSkip) {
      skippedCount += 1;
      report.push({ slug: entry.slug, status: "skipped-existing" });
      continue;
    }
    let scraped = { description: null, imageUrl: null, canonical: null };

    try {
      scraped = extractMetadata(entry.productUrl);
    } catch (error) {
      if (!override.description && !override.imageUrl) {
        report.push({
          slug: entry.slug,
          status: "scrape-failed",
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      report.push({
        slug: entry.slug,
        status: "scrape-failed-used-override",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const payload = {
      slug: entry.slug,
      name: entry.name,
      brand: entry.brand,
      description: trimDescription(override.description ?? scraped.description),
      image_url: override.imageUrl ?? scraped.imageUrl,
      image_source_url: override.imageSourceUrl ?? entry.productUrl,
      product_url: override.productUrl ?? entry.productUrl,
      source_url: override.sourceUrl ?? scraped.canonical ?? entry.productUrl,
      created_by: existing?.created_by ?? ownerId,
    };

    const { error } = await supabase
      .from("products")
      .upsert(payload, { onConflict: "slug" });

    if (error) {
      report.push({ slug: entry.slug, status: "upsert-failed", error: error.message });
      continue;
    }

    if (existing) {
      updatedCount += 1;
      report.push({ slug: entry.slug, status: "updated", imageUrl: payload.image_url });
    } else {
      insertedCount += 1;
      report.push({ slug: entry.slug, status: "inserted", imageUrl: payload.image_url });
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        insertedCount,
        updatedCount,
        skippedCount,
        reportPath: path.relative(rootDir, outputPath),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
