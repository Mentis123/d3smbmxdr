/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/examcp',
        destination: '/examcp.html',
      },
      {
        source: '/customer-pnl',
        destination: '/customer-virtual-pnl.html',
      },
    ]
  },
}

module.exports = nextConfig
