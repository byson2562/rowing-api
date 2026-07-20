import type { MetadataRoute } from "next";

import { siteUrl } from "../lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // JSON APIはインデックス不要のためクロール予算を節約する
      disallow: "/api/"
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
