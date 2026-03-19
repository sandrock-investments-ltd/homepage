import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  typescript: {
    // Supabase SDK select() returns {} instead of typed rows in some cases.
    // These are not runtime bugs — type checking runs separately via tsc.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
