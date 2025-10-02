/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Creates minimal production build
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Exclude backend folder from frontend build
    config.module.rules.push({
      test: /\/backend\/.*/i,
      loader: 'ignore-loader',
    });
    
    return config;
  },
  // Configure headers for better caching
  async headers() {
    return [
      {
        // Apply immutable cache to static assets
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Don't cache HTML pages
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Don't cache API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  // Generate build ID based on timestamp for cache busting
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
}

module.exports = nextConfig