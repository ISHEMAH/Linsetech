import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  transpilePackages: ["three"],
  // static media (clips, gradients, covers, HDRI) are not content-hashed: a week of caching, revalidated in the background
  async headers() {
    const media = "public, max-age=604800, stale-while-revalidate=86400";
    return ["/clips/:path*", "/bg/:path*", "/work/:path*", "/hdr/:path*", "/brand/:path*"].map((source) => ({ source, headers: [{ key: "Cache-Control", value: media }] }));
  },
  // app/global-not-found.tsx: branded 404 for URLs outside the [locale] tree
  experimental: { globalNotFound: true },
  turbopack: {
    rules: {
      // Tailwind only on plain stylesheets: CSS modules must stay modules (Turbopack handles them natively)
      "*.css": {
        condition: { all: [{ not: "foreign" }, { not: { path: /\.module\.css$/ } }] },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
