import CollectionCard from "../../components/CollectionCard";
import { getCategoryImageMapBySlugs } from "../../lib/data/collections";

interface StaticCategory {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl?: string | null;
}

const categories: StaticCategory[] = [
  {
    id: "cat-001",
    title: "Audio Gear",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-002",
    title: "AI Assistants",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-003",
    title: "Automation Tools",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-004",
    title: "Analog Synths",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-005",
    title: "Backpacks",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-006",
    title: "Batteries & Power",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-007",
    title: "Blogging Tools",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-008",
    title: "Bluetooth Speakers",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-009",
    title: "Cameras",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-010",
    title: "Creative Suites",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-011",
    title: "Coding IDEs",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-012",
    title: "Cloud Storage",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-013",
    title: "Desk Setups",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-014",
    title: "Drones",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-015",
    title: "Drawing Tablets",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-016",
    title: "DevOps Tools",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-017",
    title: "Editing Suites",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-018",
    title: "E-commerce Tools",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-019",
    title: "Ergonomic Chairs",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-020",
    title: "eReaders",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-021",
    title: "Filmmaking Gear",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-022",
    title: "Fitness Tech",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-023",
    title: "Focus Apps",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-024",
    title: "Field Recorders",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-025",
    title: "Gaming PCs",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-026",
    title: "Graphic Design",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-027",
    title: "Guitars & FX",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-028",
    title: "Green Screens",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-029",
    title: "Home Studios",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-030",
    title: "Headphones",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-031",
    title: "Home Networking",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-032",
    title: "Hardware Kits",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-033",
    title: "iOS Apps",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-034",
    title: "Illustration Tools",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-035",
    title: "Imaging Lenses",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-036",
    title: "IoT Devices",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-037",
    title: "Journaling Apps",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-038",
    title: "Jogging Gear",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-039",
    title: "JavaScript Tooling",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-040",
    title: "Jazz Instruments",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-041",
    title: "Kitchen Tech",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-042",
    title: "Keyboards",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-043",
    title: "Knowledge Bases",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-044",
    title: "KVM Switches",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-045",
    title: "Lighting Kits",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-046",
    title: "Live Streaming",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-047",
    title: "Laptops",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-048",
    title: "Language Tools",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-049",
    title: "Microphones",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-050",
    title: "Mobile Editing",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-051",
    title: "Mechanical Keyboards",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-052",
    title: "Monitors",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-053",
    title: "Noise Reduction",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-054",
    title: "Notetaking Apps",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-055",
    title: "NAS Storage",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-056",
    title: "Networking Tools",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-057",
    title: "Office Essentials",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-058",
    title: "Open Source Kits",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-059",
    title: "On-camera Lighting",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-060",
    title: "Outdoor Audio",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-061",
    title: "Photography",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-062",
    title: "PC Builds",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-063",
    title: "Podcasting",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-064",
    title: "Productivity Suites",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-065",
    title: "Quick Chargers",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-066",
    title: "Quantum Laptops",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-067",
    title: "QA Tooling",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-068",
    title: "Recording Interfaces",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-069",
    title: "Render Farms",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-070",
    title: "Remote Work",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-071",
    title: "Router Setups",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-072",
    title: "Studio Desks",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-073",
    title: "Smart Home",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-074",
    title: "Security Tools",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-075",
    title: "Sound Design",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-076",
    title: "Tech Tools",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-077",
    title: "Tablets",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-078",
    title: "Travel Gear",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-079",
    title: "Typography Kits",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-080",
    title: "USB Accessories",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-081",
    title: "UI Kits",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-082",
    title: "Ultrabooks",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-083",
    title: "UPS Backup",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-084",
    title: "Video Editing",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-085",
    title: "VR Headsets",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-086",
    title: "Voice Assistants",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-087",
    title: "Virtual Studios",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-088",
    title: "Web Apps",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-089",
    title: "Wearables",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-090",
    title: "Wireless Mics",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-091",
    title: "Workspace Decor",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-092",
    title: "XLR Gear",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-093",
    title: "Xcode Tooling",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-094",
    title: "XR Devices",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-095",
    title: "YouTube Kits",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-096",
    title: "Yarn Tooling",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-097",
    title: "Yoga Tech",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-098",
    title: "Zoom Rooms",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-099",
    title: "Zippers & Cases",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
  {
    id: "cat-100",
    title: "Zen Workflows",
    author: "CATEGORY",
    description: "Curated category placeholder.",
  },
];

const featuredNames = new Set([
  "Audio Gear",
  "PC Builds",
  "Kitchen Tech",
  "Photography",
  "Tech Tools",
]);

export default async function CategoriesPage() {
  const imageBySlug = await getCategoryImageMapBySlugs(
    categories.map((category) => category.id)
  );

  const categoriesWithImages = categories.map((category) => {
    const imageFields = imageBySlug.get(category.id.toLowerCase());

    return {
      ...category,
      coverImageUrl: imageFields?.coverImageUrl ?? null,
    };
  });

  const featuredCategories = categoriesWithImages.filter((category) =>
    featuredNames.has(category.title)
  );
  const remainingCategories = categoriesWithImages.filter(
    (category) => !featuredNames.has(category.title)
  );

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
            Categories
          </p>
          <h1 className="text-[clamp(2.1rem,4vw,3.4rem)] font-semibold text-ink">
            Explore curated categories
          </h1>
        </div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-ink/40">
          Fixed set: 100
        </span>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
            Featured Categories
          </p>
          <span className="text-[11px] uppercase tracking-[0.3em] text-ink/40">
            5 featured
          </span>
        </div>
        <p className="text-sm text-ink/70">
          100 categories from A to Z covering audio, PC builds, kitchen tech,
          photography, and more.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {featuredCategories.map((category) => (
            <CollectionCard key={category.id} {...category} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
              All Categories
            </p>
            <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold text-ink">
              100 Categories
            </h2>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-2 text-[11px] uppercase tracking-[0.3em] text-ink/50">
              <input
                placeholder="Search"
                className="w-full bg-transparent text-[11px] uppercase tracking-[0.25em] text-ink placeholder:text-ink/40 focus:outline-none"
                aria-label="Search categories"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {remainingCategories.map((category) => (
            <CollectionCard key={category.id} {...category} />
          ))}
        </div>
      </section>
    </div>
  );
}
