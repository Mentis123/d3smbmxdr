import WorldExplorer from '../_worlds/WorldExplorer';

const INTRO = {eyebrow: 'OUTSIDE → INSIDE → CONNECTED', title: 'One connected datacentre world.', text: 'Explore the facility, fly into the Data#3 showcase cage, then follow a workload through it. Tap a pin in the world, or choose a story.'};

export default function Page() { return <WorldExplorer world="nextdc" brand={{title: 'Showcase concept', small: 'ONE CONNECTED DATACENTRE'}} intro={INTRO}/>; }
