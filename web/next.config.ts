import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone',
  distDir: 'build',
  images: {
    qualities: [25, 50, 98, 100],
    unoptimized: false,
    loader: 'default',
    domains: [],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, 'fs/promises': false };

    return config;
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/my-plan',
        permanent: true,
      },
    ]
  },
  // on all path return x-clacks-overhead header
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Clacks-Overhead',
            value: 'GNU Terry Pratchett',
          },
        ],
      },
    ]
  },
}

export default nextConfig
