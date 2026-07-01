/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      { source: '/shici', destination: '/shici.html' },
      { source: '/lottery', destination: '/lottery.html' },
    ]
  },
}

module.exports = nextConfig