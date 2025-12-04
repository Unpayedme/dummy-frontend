/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api',
  },
  async rewrites() {
    // Only use rewrites in development when API_URL is not set
    // In production, use NEXT_PUBLIC_API_URL environment variable
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:7000/api/:path*',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;

