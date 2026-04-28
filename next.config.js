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
      {
        source: '/ai-squad',
        destination: '/ai-squad.html',
      },
      {
        source: '/knowledge-centre-rain',
        destination: '/knowledge-centre-rain.html',
      },
      {
        source: '/boring-ai',
        destination: '/knowledge-centre-rain.html',
      },
      {
        source: '/scott-pillar',
        destination: '/scott-pillar-v01.html',
      },
    ]
  },
}

module.exports = nextConfig
