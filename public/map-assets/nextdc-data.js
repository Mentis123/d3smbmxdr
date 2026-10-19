// NEXTDC showcase world: the Data#3 partner collaboration showcase, inside a NEXTDC facility. Words, statuses and
// stories, written once. The owner's direction (19 Oct 2026): the page is about the partner showcase; the facility
// and the connected sites are context, not subjects.
// The 3D world (nextdc-scene.js) reads ids from here; the d3smbmxdr /nextdc side panel imports this file at runtime.
// No Three.js import, so a plain page can load it. Brief: docs/NEXTDC-DESIGN.md.
//
// Statuses are not sourced yet. Showcase equipment is 'planned' and the facility is 'illustrative' until the owner
// confirms otherwise. Which partner supplies which component is a placeholder marked "to confirm".

export const STATUSES = {
  planned: {label: 'Planned', note: 'Intended for the showcase; not installed yet.', color: '#78dcff'},
  installed: {label: 'Installed', note: 'In the cage now.', color: '#5dff6a'},
  'demo-ready': {label: 'Demo-ready', note: 'Installed and ready to demonstrate.', color: '#ffd166'},
  illustrative: {label: 'Illustrative', note: 'Conceptual only; not an actual site, layout or deployment.', color: '#9d9fa2'},
};

export const INTRO = {
  eyebrow: 'DATA#3 × PARTNERS · AT NEXTDC',
  title: 'The Data#3 partner showcase.',
  text: 'One cage where Data#3 and its technology partners show their platforms working together as one solution: network, compute, storage, AI, protection and operations. Tap a rack, or choose a story.',
};

// Every pin. 'pin' is a shorter label for the 3D marker where six racks share a frame. scope 'near' pins show when the camera is at the cage, 'far' pins only from outside, 'any' always.
export const ITEMS = [
  {id: 'cage', label: 'Partner showcase', scope: 'far', status: 'planned',
    what: 'A Data#3 cage where partner platforms run side by side, integrated and supported by Data#3.',
    why: 'Customers rarely buy one vendor. Seeing the partners\' platforms working as one solution answers the integration question a datasheet cannot.',
    demo: 'Walk one customer workload across every partner in the cage: network, compute, storage, AI, protection and operations.',
    next: 'Book a showcase session for your team with Data#3 and the partners you care about.'},
  {id: 'net', label: 'Network and security', pin: 'Network', scope: 'near', status: 'planned',
    what: 'Switching and firewalls that join the partner platforms to each other, to customer sites and to clouds.',
    why: 'The network is where partners meet. Every workload and every security control passes through it.',
    demo: 'Show a segmented, protected path from a customer site to the partner platforms.',
    next: 'Review how your sites reach your workloads today.',
    vendor: 'Partner: Cisco (to confirm). Model and configuration to confirm.'},
  {id: 'compute', label: 'Compute', scope: 'near', status: 'planned',
    what: 'Partner servers running virtual machines and containers for everyday workloads.',
    why: 'Modern platforms run more work in less space and power than ageing servers, and Data#3 integrates them with the rest of the stack.',
    demo: 'Land a customer workload on modern compute and show it using the partners\' storage and network.',
    next: 'Pick one workload to modernise first.',
    vendor: 'Partner: HPE (to confirm). Model and configuration to confirm.'},
  {id: 'storage', label: 'Storage', scope: 'near', status: 'planned',
    what: 'Shared storage holding the data the compute and AI platforms use.',
    why: 'Data placement drives performance, protection and cost, and every other partner platform depends on it.',
    demo: 'Show one data set serving compute, AI and backup at once.',
    next: 'Estimate the data your first workloads need to bring.',
    vendor: 'Partner: to confirm. Model and configuration to confirm.'},
  {id: 'gpu', label: 'Private AI', scope: 'near', status: 'planned',
    what: 'GPU servers for running AI models next to the data, on private infrastructure.',
    why: 'Sensitive or steady AI work can be cheaper and safer to run privately. It needs network, storage and protection partners to work with it.',
    demo: 'Run an AI request on private GPUs fed by the showcase storage, then compare it with the cloud.',
    next: 'Decide which AI workloads must stay close to your data.',
    vendor: 'Partner: Dell (to confirm). Model and configuration to confirm.'},
  {id: 'backup', label: 'Backup and recovery', pin: 'Recovery', scope: 'near', status: 'planned',
    what: 'Protected copies of the showcase workloads and data, kept separate from production.',
    why: 'Recovery is where integration is tested: compute, storage and protection have to work together under pressure.',
    demo: 'Recover a workload after a simulated incident, across the partner platforms.',
    next: 'Test how long your most important workload takes to recover.',
    vendor: 'Partner: to confirm. Model and configuration to confirm.'},
  {id: 'ops', label: 'Operations', scope: 'near', status: 'planned',
    what: 'One view across every partner platform, run by Data#3, turning alerts into actions.',
    why: 'A multi-partner solution is only as reliable as the way it is run as one.',
    demo: 'Walk through an illustrative alert from detection to fix, across partners.',
    next: 'Map who is alerted today, and what happens next.',
    vendor: 'Tooling to confirm.'},
  {id: 'facility', label: 'NEXTDC facility', scope: 'far', status: 'illustrative',
    what: 'The datacentre the showcase sits in: power, cooling, connectivity and physical security.',
    why: 'The partner platforms rely on the facility for resilient power, cooling and on-ramps to sites and clouds.',
    demo: 'Show how power, cooling and fibre reach the showcase racks.',
    next: 'Compare your power, cooling and connectivity needs with what the facility provides.'},
];

// Stories change the same world. Each step names a view to glide to, a caption for the panel, and the world state:
// lit = connections or traces to light, focus = items to ring, dim = items taken offline, alert = item flashing red,
// token = a workload path to animate, overlay 'monitor' = beacons over the equipment.
const ALL_RACKS = ['net', 'compute', 'storage', 'gpu', 'backup', 'ops'];
export const STORIES = [
  {id: 'tour', title: 'Start here: meet the partners', summary: 'The facility, into the cage, then each partner platform in turn.', steps: [
    {view: 'facility', caption: 'Inside a NEXTDC facility sits the Data#3 partner showcase.', state: {focus: ['cage'], lit: ['power-trace', 'cooling-trace', 'fibre-trace']}},
    {view: 'hero', caption: 'The roof comes away. One cage, several technology partners, integrated by Data#3.', state: {focus: ['cage']}},
    {view: 'net', caption: 'Network and security: where the partners meet, and where every path is protected.', state: {focus: ['net'], lit: ['fibre-trace']}},
    {view: 'compute', caption: 'Compute and storage: the platforms everyday workloads run on.', state: {focus: ['compute', 'storage']}},
    {view: 'gpu', caption: 'Private AI: GPUs next to the data, fed by the same storage and network.', state: {focus: ['gpu', 'storage']}},
    {view: 'backup', caption: 'Backup, recovery and operations: protected and run as one.', state: {focus: ['backup', 'ops'], overlay: 'monitor'}},
    {view: 'hero', caption: 'Every partner, one solution. That is what the showcase is for.', state: {focus: ALL_RACKS}},
  ]},
  {id: 'together', title: 'One workload, every partner', summary: 'Follow a customer workload across all the partner platforms.', steps: [
    {view: 'hero', caption: 'A customer workload arrives through the partner network.', state: {focus: ['net'], lit: ['office-dc', 'fibre-trace'], token: 'office-to-compute'}},
    {view: 'compute', caption: 'It runs on partner compute, using partner storage.', state: {focus: ['compute', 'storage'], token: 'office-to-compute'}},
    {view: 'backup', caption: 'It is protected by the backup platform.', state: {focus: ['backup']}},
    {view: 'ops', caption: 'And watched by one operations view across every partner.', state: {focus: ['ops'], overlay: 'monitor'}},
  ]},
  {id: 'ai', title: 'Private AI, proven together', summary: 'An AI request on private GPUs, with the data and the network around it.', steps: [
    {view: 'gpu', caption: 'Private AI runs on partner GPUs in the cage.', state: {focus: ['gpu']}},
    {view: 'hero', caption: 'A request arrives over the partner network and uses data on partner storage.', state: {focus: ['net', 'storage', 'gpu'], lit: ['branch-dc', 'fibre-trace'], token: 'branch-ai-private'}},
    {view: 'facility', caption: 'When the cloud fits better, it is one connection away through the facility.', state: {focus: ['cloud'], lit: ['dc-cloud'], token: 'compute-to-cloud'}},
  ]},
  {id: 'recover', title: 'Recover together', summary: 'A simulated incident, recovered across the partner platforms.', steps: [
    {view: 'compute', caption: 'A simulated incident takes a workload offline.', state: {alert: 'compute'}},
    {view: 'backup', caption: 'Protected copies sit on the backup platform, separate from production.', state: {alert: 'compute', focus: ['backup']}},
    {view: 'hero', caption: 'Recovery runs across storage, compute and network back to the customer.', state: {focus: ['backup', 'storage', 'compute', 'net'], lit: ['fibre-trace', 'office-dc'], token: 'backup-restore'}},
  ]},
  {id: 'ops', title: 'Run it as one', summary: 'Monitoring across every partner and an illustrative alert-to-action sequence.', steps: [
    {view: 'hero', caption: 'Monitoring covers every partner platform in the cage.', state: {overlay: 'monitor', focus: ['ops']}},
    {view: 'storage', caption: 'An illustrative alert: storage latency rises.', state: {overlay: 'monitor', alert: 'storage'}},
    {view: 'hero', caption: 'Operations traces the alert and acts on it, whichever partner it belongs to.', state: {overlay: 'monitor', alert: 'storage', focus: ['ops'], token: 'ops-fix'}},
    {view: 'hero', caption: 'Resolved. The alert clears and the action is recorded.', state: {overlay: 'monitor', focus: ['storage']}},
  ]},
];

export const DISCLAIMER = 'Conceptual world. The facility is illustrative, not NEXTDC\'s actual site or secure layout. Partners, statuses and equipment are placeholders until confirmed.';
