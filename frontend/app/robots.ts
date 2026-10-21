import type { MetadataRoute } from "next";

import { siteUrl } from "../lib/site-url";

// output: export では Route Handler を静的と明示する必要がある
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
