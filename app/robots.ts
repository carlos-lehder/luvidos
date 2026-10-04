import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup", "/opengraph-image.png"],
      disallow: ["/album/", "/media/", "/dashboard/", "/auth/", "/_next/", "/api/"],
      crawlDelay: 1,
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
