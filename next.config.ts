import type { NextConfig } from "next";

const forGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(forGithubPages
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {
        cacheComponents: true,
        partialPrefetching: true,
      }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
