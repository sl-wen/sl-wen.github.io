/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      { source: '/shici', destination: '/shici.html' },
      { source: '/caipiao', destination: '/caipiao.html' },
    ]
  },
}

module.exports = nextConfig