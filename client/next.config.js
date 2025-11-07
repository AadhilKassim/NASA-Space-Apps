/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';
const nextConfig = {
  // Export a fully static site into client/out for the Express server to serve
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Only use the local proxy rewrites in development
  async rewrites() {
    if (!isDev) return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;