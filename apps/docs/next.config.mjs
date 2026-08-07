import { createMDX } from "fumadocs-mdx/next";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["@tokens/ui"],
  experimental: {
    externalDir: true,
    optimizePackageImports: ["@tokens/ui"],
  },
};

const withMDX = createMDX();

export default withMDX(config);

