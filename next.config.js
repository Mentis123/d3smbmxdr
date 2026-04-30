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
        destination: '/scott-pillar-v03.html',
      },
      {
        source: '/scott-pillar-v01',
        destination: '/scott-pillar-v01.html',
      },
      {
        source: '/scott-pillar-v02',
        destination: '/scott-pillar-v02.html',
      },
      {
        source: '/scott-pillar-v03',
        destination: '/scott-pillar-v03.html',
      },
      {
        source: '/suzanne-pillar',
        destination: '/suzanne-pillar-v01.html',
      },
      {
        source: '/knowledge-centre/links',
        destination: '/knowledge-centre/links.html',
      },
      {
        source: '/knowledge-centre/scott-pillar',
        destination: '/scott-pillar-v03.html',
      },
      {
        source: '/knowledge-centre/suzanne-pillar',
        destination: '/suzanne-pillar-v01.html',
      },
      {
        source: '/knowledge-centre/adam-crucible',
        destination: '/knowledge-centre/adam-crucible-v01.html',
      },
      {
        source: '/knowledge-centre/adam-wrap',
        destination: '/knowledge-centre/adam-wrap-v01.html',
      },
    ]
  },
}

module.exports = nextConfig
