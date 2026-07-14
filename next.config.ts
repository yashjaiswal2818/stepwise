import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next warns that it inferred the workspace root from a stray package-lock.json
  // in the home directory. Point it at this project instead. Dev-only cosmetics.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
