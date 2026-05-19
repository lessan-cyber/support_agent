import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options */
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
};

export default nextConfig;
