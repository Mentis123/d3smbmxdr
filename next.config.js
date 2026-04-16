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
      {
        source: '/links',
        destination: '/index-page.html',
      },
      {
        source: '/ai-practice/squads',
        destination: '/ai-practice-squads.html',
      },
    ]
  },
}

module.exports = nextConfig
