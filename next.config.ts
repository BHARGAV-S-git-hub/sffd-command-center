import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // THE FIX: Tell Next.js NOT to bundle the Databricks SQL driver
  serverExternalPackages: ["@databricks/sql"],
};

export default nextConfig;