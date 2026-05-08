import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Use environment variable if available, otherwise default to Docker service name
        destination: `${process.env.API_URL || 'http://api:3000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
