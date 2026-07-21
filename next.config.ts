import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next warns that it inferred the workspace root from a stray package-lock.json
  // in the home directory. Point it at this project instead. Dev-only cosmetics.
  turbopack: {
    root: __dirname,
  },

  images: {
    // GitHub is the only OAuth provider, so avatars only ever come from here —
    // Better Auth stores the provider's `avatar_url` on user.image.
    //
    // `search` is deliberately left unset (Next implies `**`): GitHub appends a
    // cache-busting query it owns, `?v=4` today and `?s=<n>&v=4` when a size is
    // requested, so pinning an exact query string would 400 every avatar. The
    // pathname is pinned to /u/** instead, which is the user-avatar namespace,
    // and AuthButton falls back to an icon if the optimizer rejects a URL anyway.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/u/**",
      },
    ],
  },
};

export default nextConfig;
