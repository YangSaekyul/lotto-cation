import type { MetadataRoute } from "next";
import { getDbMeta, getSitemapStores } from "@/lib/db";

const SITE_URL = "https://lotto-ri.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const meta = getDbMeta();
  const lastModified = new Date(meta.generated_at);
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/draw/latest`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/stats`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/stores/ranking`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/report`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
  const storePages: MetadataRoute.Sitemap = getSitemapStores().map((store) => ({
    url: `${SITE_URL}/store/${encodeURIComponent(store.id)}`,
    lastModified,
    changeFrequency: "weekly",
    priority: store.latestDraw === meta.latest_draw ? 0.7 : 0.5,
  }));
  return [...staticPages, ...storePages];
}
