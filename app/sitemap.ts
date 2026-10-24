import type { MetadataRoute } from "next";
import { areas } from "@/lib/areas";
import { guides } from "@/lib/guides";

const routes = [
  "",
  "/free-quote",
  "/projects",
  "/materials",
  "/how-it-works",
  "/services/built-in-wardrobes",
  "/services/walk-in-wardrobes",
  "/services/wardrobe-interiors",
  "/services/sliding-doors",
  "/wardrobe-planner",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const modified = new Date();
  const staticRoutes: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `https://vtwardrobes.com.au${route}`,
    lastModified: modified,
    changeFrequency: route === "" ? "weekly" as const : "monthly" as const,
    priority: route === "" ? 1 : route === "/free-quote" ? 0.9 : 0.7,
  }));
  const areaRoutes = areas.map((area) => ({url:`https://vtwardrobes.com.au/areas/${area.slug}`,lastModified:modified,changeFrequency:"monthly" as const,priority:0.75}));
  const guideRoutes = guides.map((guide) => ({url:`https://vtwardrobes.com.au/guides/${guide.slug}`,lastModified:modified,changeFrequency:"monthly" as const,priority:0.72}));
  return [...staticRoutes,...areaRoutes,...guideRoutes];
}
