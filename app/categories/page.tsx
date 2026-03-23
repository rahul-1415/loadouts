import CollectionCard from "../../components/CollectionCard";
import CategorySearchGrid from "../../components/CategorySearchGrid";
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
    author: "",
    description: "",
  },
  {
    id: "cat-002",
    title: "AI Assistants",
    author: "",
    description: "",
  },
  {
    id: "cat-003",
    title: "Automation Tools",
    author: "",
    description: "",
  },
  {
    id: "cat-004",
    title: "Analog Synths",
    author: "",
    description: "",
  },
  {
    id: "cat-005",
    title: "Backpacks",
    author: "",
    description: "",
  },
  {
    id: "cat-006",
    title: "Batteries & Power",
    author: "",
    description: "",
  },
  {
    id: "cat-007",
    title: "Blogging Tools",
    author: "",
    description: "",
  },
  {
    id: "cat-008",
    title: "Bluetooth Speakers",
    author: "",
    description: "",
  },
  {
    id: "cat-009",
    title: "Cameras",
    author: "",
    description: "",
  },
  {
    id: "cat-010",
    title: "Creative Suites",
    author: "",
    description: "",
  },
  {
    id: "cat-011",
    title: "Coding IDEs",
    author: "",
    description: "",
  },
  {
    id: "cat-012",
    title: "Cloud Storage",
    author: "",
    description: "",
  },
  {
    id: "cat-013",
    title: "Desk Setups",
    author: "",
    description: "",
  },
  {
    id: "cat-014",
    title: "Drones",
    author: "",
    description: "",
  },
  {
    id: "cat-015",
    title: "Drawing Tablets",
    author: "",
    description: "",
  },
  {
    id: "cat-016",
    title: "DevOps Tools",
    author: "",
    description: "",
  },
  {
    id: "cat-017",
    title: "Editing Suites",
    author: "",
    description: "",
  },
  {
    id: "cat-018",
    title: "E-commerce Tools",
    author: "",
    description: "",
  },
  {
    id: "cat-019",
    title: "Ergonomic Chairs",
    author: "",
    description: "",
  },
  {
    id: "cat-020",
    title: "eReaders",
    author: "",
    description: "",
  },
  {
    id: "cat-021",
    title: "Filmmaking Gear",
    author: "",
    description: "",
  },
  {
    id: "cat-022",
    title: "Fitness Tech",
    author: "",
    description: "",
  },
  {
    id: "cat-023",
    title: "Focus Apps",
    author: "",
    description: "",
  },
  {
    id: "cat-024",
    title: "Field Recorders",
    author: "",
    description: "",
  },
  {
    id: "cat-025",
    title: "Gaming PCs",
    author: "",
    description: "",
  },
  {
    id: "cat-026",
    title: "Graphic Design",
    author: "",
    description: "",
  },
  {
    id: "cat-027",
    title: "Guitars & FX",
    author: "",
    description: "",
  },
  {
    id: "cat-028",
    title: "Green Screens",
    author: "",
    description: "",
  },
  {
    id: "cat-029",
    title: "Home Studios",
    author: "",
    description: "",
  },
  {
    id: "cat-030",
    title: "Headphones",
    author: "",
    description: "",
  },
  {
    id: "cat-031",
    title: "Home Networking",
    author: "",
    description: "",
  },
  {
    id: "cat-032",
    title: "Hardware Kits",
    author: "",
    description: "",
  },
  {
    id: "cat-033",
    title: "iOS Apps",
    author: "",
    description: "",
  },
  {
    id: "cat-034",
    title: "Illustration Tools",
    author: "",
    description: "",
  },
  {
    id: "cat-035",
    title: "Imaging Lenses",
    author: "",
    description: "",
  },
  {
    id: "cat-036",
    title: "IoT Devices",
    author: "",
    description: "",
  },
  {
    id: "cat-037",
    title: "Journaling Apps",
    author: "",
    description: "",
  },
  {
    id: "cat-038",
    title: "Jogging Gear",
    author: "",
    description: "",
  },
  {
    id: "cat-039",
    title: "JavaScript Tooling",
    author: "",
    description: "",
  },
  {
    id: "cat-040",
    title: "Jazz Instruments",
    author: "",
    description: "",
  },
  {
    id: "cat-041",
    title: "Kitchen Tech",
    author: "",
    description: "",
  },
  {
    id: "cat-042",
    title: "Keyboards",
    author: "",
    description: "",
  },
  {
    id: "cat-043",
    title: "Knowledge Bases",
    author: "",
    description: "",
  },
  {
    id: "cat-044",
    title: "KVM Switches",
    author: "",
    description: "",
  },
  {
    id: "cat-045",
    title: "Lighting Kits",
    author: "",
    description: "",
  },
  {
    id: "cat-046",
    title: "Live Streaming",
    author: "",
    description: "",
  },
  {
    id: "cat-047",
    title: "Laptops",
    author: "",
    description: "",
  },
  {
    id: "cat-048",
    title: "Language Tools",
    author: "",
    description: "",
  },
  {
    id: "cat-049",
    title: "Microphones",
    author: "",
    description: "",
  },
  {
    id: "cat-050",
    title: "Mobile Editing",
    author: "",
    description: "",
  },
  {
    id: "cat-051",
    title: "Mechanical Keyboards",
    author: "",
    description: "",
  },
  {
    id: "cat-052",
    title: "Monitors",
    author: "",
    description: "",
  },
  {
    id: "cat-053",
    title: "Noise Reduction",
    author: "",
    description: "",
  },
  {
    id: "cat-054",
    title: "Notetaking Apps",
    author: "",
    description: "",
  },
  {
    id: "cat-055",
    title: "NAS Storage",
    author: "",
    description: "",
  },
  {
    id: "cat-056",
    title: "Networking Tools",
    author: "",
    description: "",
  },
  {
    id: "cat-057",
    title: "Office Essentials",
    author: "",
    description: "",
  },
  {
    id: "cat-058",
    title: "Open Source Kits",
    author: "",
    description: "",
  },
  {
    id: "cat-059",
    title: "On-camera Lighting",
    author: "",
    description: "",
  },
  {
    id: "cat-060",
    title: "Outdoor Audio",
    author: "",
    description: "",
  },
  {
    id: "cat-061",
    title: "Photography",
    author: "",
    description: "",
  },
  {
    id: "cat-062",
    title: "PC Builds",
    author: "",
    description: "",
  },
  {
    id: "cat-063",
    title: "Podcasting",
    author: "",
    description: "",
  },
  {
    id: "cat-064",
    title: "Productivity Suites",
    author: "",
    description: "",
  },
  {
    id: "cat-065",
    title: "Quick Chargers",
    author: "",
    description: "",
  },
  {
    id: "cat-066",
    title: "Quantum Laptops",
    author: "",
    description: "",
  },
  {
    id: "cat-067",
    title: "QA Tooling",
    author: "",
    description: "",
  },
  {
    id: "cat-068",
    title: "Recording Interfaces",
    author: "",
    description: "",
  },
  {
    id: "cat-069",
    title: "Render Farms",
    author: "",
    description: "",
  },
  {
    id: "cat-070",
    title: "Remote Work",
    author: "",
    description: "",
  },
  {
    id: "cat-071",
    title: "Router Setups",
    author: "",
    description: "",
  },
  {
    id: "cat-072",
    title: "Studio Desks",
    author: "",
    description: "",
  },
  {
    id: "cat-073",
    title: "Smart Home",
    author: "",
    description: "",
  },
  {
    id: "cat-074",
    title: "Security Tools",
    author: "",
    description: "",
  },
  {
    id: "cat-075",
    title: "Sound Design",
    author: "",
    description: "",
  },
  {
    id: "cat-076",
    title: "Tech Tools",
    author: "",
    description: "",
  },
  {
    id: "cat-077",
    title: "Tablets",
    author: "",
    description: "",
  },
  {
    id: "cat-078",
    title: "Travel Gear",
    author: "",
    description: "",
  },
  {
    id: "cat-079",
    title: "Typography Kits",
    author: "",
    description: "",
  },
  {
    id: "cat-080",
    title: "USB Accessories",
    author: "",
    description: "",
  },
  {
    id: "cat-081",
    title: "UI Kits",
    author: "",
    description: "",
  },
  {
    id: "cat-082",
    title: "Ultrabooks",
    author: "",
    description: "",
  },
  {
    id: "cat-083",
    title: "UPS Backup",
    author: "",
    description: "",
  },
  {
    id: "cat-084",
    title: "Video Editing",
    author: "",
    description: "",
  },
  {
    id: "cat-085",
    title: "VR Headsets",
    author: "",
    description: "",
  },
  {
    id: "cat-086",
    title: "Voice Assistants",
    author: "",
    description: "",
  },
  {
    id: "cat-087",
    title: "Virtual Studios",
    author: "",
    description: "",
  },
  {
    id: "cat-088",
    title: "Web Apps",
    author: "",
    description: "",
  },
  {
    id: "cat-089",
    title: "Wearables",
    author: "",
    description: "",
  },
  {
    id: "cat-090",
    title: "Wireless Mics",
    author: "",
    description: "",
  },
  {
    id: "cat-091",
    title: "Workspace Decor",
    author: "",
    description: "",
  },
  {
    id: "cat-092",
    title: "XLR Gear",
    author: "",
    description: "",
  },
  {
    id: "cat-093",
    title: "Xcode Tooling",
    author: "",
    description: "",
  },
  {
    id: "cat-094",
    title: "XR Devices",
    author: "",
    description: "",
  },
  {
    id: "cat-095",
    title: "YouTube Kits",
    author: "",
    description: "",
  },
  {
    id: "cat-096",
    title: "Yarn Tooling",
    author: "",
    description: "",
  },
  {
    id: "cat-097",
    title: "Yoga Tech",
    author: "",
    description: "",
  },
  {
    id: "cat-098",
    title: "Zoom Rooms",
    author: "",
    description: "",
  },
  {
    id: "cat-099",
    title: "Zippers & Cases",
    author: "",
    description: "",
  },
  {
    id: "cat-100",
    title: "Zen Workflows",
    author: "",
    description: "",
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
          <h1 className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold text-ink">
            Featured Categories
          </h1>
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {featuredCategories.map((category) => (
            <CollectionCard key={category.id} {...category} />
          ))}
        </div>
      </section>

      <CategorySearchGrid categories={remainingCategories} />
    </div>
  );
}
