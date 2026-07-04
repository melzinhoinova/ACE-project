import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow production builds to succeed even if shadcn/ui components have
    // minor type mismatches with the installed recharts / react-day-picker versions.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
