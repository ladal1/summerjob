/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    appDir: true,
  },
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
}

module.exports = nextConfig
