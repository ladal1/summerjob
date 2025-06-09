import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone',
  distDir: 'build',
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
    return [{
      source: '/:path*',
      headers: [
        {
          key: 'X-Clacks-Overhead',
          value: 'GNU Terry Pratchett',
        },
      ],
    }]
  },
}

export default nextConfig;