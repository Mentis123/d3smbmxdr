import WorldExplorer from '../_worlds/WorldExplorer';

// The words (intro, pins, stories) live in /map-assets/nextdc-data.js, synced from adamrappaport.
export default function Page() { return <WorldExplorer world="nextdc" brand={{title: 'Partner showcase', small: 'DATA#3 AT NEXTDC'}}/>; }
