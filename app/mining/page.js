import MiningHome from '../page'
import {redirect} from 'next/navigation'

export const metadata = {
  title: 'Mining experiences | Data#3',
  description: 'Explore the Mining Lab, Mining AI Lab and Agent 0 Decision Room.',
  alternates: {canonical: '/mining'},
}

export default function MiningLanding({searchParams}) {
  // Keep previously shared activation links opening the intended story.
  const site = searchParams?.site
  if (['operations', 'engineering', 'terminal'].includes(site)) {
    redirect(`/mining/lab?site=${site}`)
  }
  return <MiningHome />
}
