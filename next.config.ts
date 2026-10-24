import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow verification builds without overwriting a running dev server's cache.
  distDir: process.env.VT_BUILD_DIR || ".next",
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
