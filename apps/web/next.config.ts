import type { NextConfig } from "next";

const apiTarget = process.env.API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://api:3000');

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: '/docs',
        destination: `${apiTarget}/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `${apiTarget}/docs/:path*`,
      },
    ];
  },
};

export default nextConfig;
