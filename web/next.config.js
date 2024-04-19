/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

module.exports = nextConfig
