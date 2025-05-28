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
};

export default nextConfig;