import type { NextConfig } from "next";

const apiUrl = process.env.API_URL || "http://localhost:4000";

// In production the browser calls /api/... on this site and Next forwards it to the API,
// so login cookies stay same-site (Safari blocks cross-site cookies).
const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: apiUrl + "/api/:path*" }];
  },
};

export default nextConfig;
