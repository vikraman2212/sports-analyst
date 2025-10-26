import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // API proxy configuration (for development)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://localhost:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
