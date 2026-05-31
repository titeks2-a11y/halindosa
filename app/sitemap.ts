import type { MetadataRoute } from "next";
import { mockDeals } from "@/data/mockDeals";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halindosa.com";
  const updatedAt = new Date();

  const staticPages: MetadataRoute.Sitemap = ["/", "/guide", "/support", "/terms", "/privacy", "/admin", "/reports", "/commercialization"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: updatedAt,
    changeFrequency: path === "/" ? "hourly" : "monthly",
    priority: path === "/" ? 1 : path === "/guide" || path === "/support" ? 0.6 : path === "/admin" || path === "/commercialization" ? 0.2 : 0.4
  }));

  const dealPages = mockDeals.map((deal) => ({
    url: `${baseUrl}/deals/${deal.id}`,
    lastModified: new Date(deal.createdAt),
    changeFrequency: "hourly" as const,
    priority: deal.isHot ? 0.9 : 0.7
  }));

  return [...staticPages, ...dealPages];
}
