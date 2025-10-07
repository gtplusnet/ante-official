import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during production builds  
    ignoreBuildErrors: true,
  },
  // Force dynamic rendering for all pages during Docker build
  ...(process.env.NEXT_DISABLE_STRAPI === 'true' && {
    trailingSlash: false,
    generateBuildId: () => 'multibook-build',
  }),
  images: {
    // Disable image optimization for external URLs to bypass restrictions
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'multibook-admin.geertest.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'multibook-admin.geertest.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'ante.sgp1.digitaloceanspaces.com',
        pathname: '/**',
      },
    ],
    // Legacy domains configuration for better compatibility
    domains: ['ante.sgp1.digitaloceanspaces.com', 'multibook-admin.geertest.com'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
};

export default nextConfig;
