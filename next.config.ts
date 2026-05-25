import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: { unoptimized: true },
  assetPrefix: "/omni-reader-app",
  basePath: "/omni-reader-app",
};

export default nextConfig;
