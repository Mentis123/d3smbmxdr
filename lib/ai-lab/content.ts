export type LabIndustry = 'energy' | 'mining' | 'retail' | 'datacenter' | 'local' | 'meeting' | 'splunk';

export type LabConditions = {
  lighting: 'day' | 'low';
  occlusion: boolean;
  connected: boolean;
  condition: boolean;
};

export type LabState = {
  status: 'clear' | 'review' | 'attention';
  headline: string;
  detail: string;
  local: string;
  cloud: string;
};

export type LabDefinition = {
  title: string;
  subtitle: string;
  locationId: string;
  view: 'intake' | 'conveyor' | 'workshop' | 'control' | 'tank-detail' | 'tanks' | 'scales' | 'hero' | 'cpu';
  poster: '/map-assets/poster.jpg' | '/map-assets/mining-poster.jpg' | '/map-assets/retail-poster.jpg' | '/map-assets/datacenter-poster.jpg' | '/map-assets/local-poster.jpg' | '/map-assets/meeting-poster.jpg' | '/map-assets/splunk-poster.jpg';
  observation: string;
  interpretation: string;
  compute: string;
  response: string;
  verification: string;
  benefit: string;
  limitation: string;
};

/** Scripted educational examples; these are not live model detections. */
export const LABS: Record<LabIndustry, LabDefinition> = {
  energy: {
    title: 'Dam intake blockage',
    subtitle: 'A camera view of a fictional water and energy site',
    locationId: 'energy.dam.intake',
    view: 'intake',
    poster: '/map-assets/poster.jpg',
    observation: 'A fixed camera provides images of the fictional dam intake and nearby water surface.',
    interpretation: 'In this scripted example, visible debris at the intake is flagged as a possible blockage; the display is an advisory, not a verified condition.',
    compute: 'A site edge device could analyse images locally. This demonstration uses fixed scripted outputs and does not run inference.',
    response: 'An authorised operator checks the camera and site indicators, then decides whether to inspect or clear the intake under site procedures and permits.',
    verification: 'The operator records what was physically checked and whether the intake is restricted; the scripted display cannot confirm clearance.',
    benefit: 'A local visual prompt could help direct an operator to an intake that needs checking.',
    limitation: 'Glare, darkness, spray or occlusion can hide debris or resemble it, so uncertain visibility requires manual review.',
  },
  mining: {
    title: 'Conveyor spillage',
    subtitle: 'A camera view of a fictional processing site',
    locationId: 'mining.processing.conveyor',
    view: 'conveyor',
    poster: '/map-assets/mining-poster.jpg',
    observation: 'A fixed camera provides images of a conveyor transfer area at the fictional processing site.',
    interpretation: 'In this scripted example, material beside the belt is flagged for review; the display does not establish a fault.',
    compute: 'A site edge device could analyse images locally. This demonstration uses fixed scripted outputs and does not run inference.',
    response: 'An authorised operator checks the area and relevant equipment indications, then decides any response under site procedures and permits.',
    verification: 'The operator checks the equipment and transfer area, records the observed condition and confirms any action through approved site processes.',
    benefit: 'A local visual prompt could help an operator find a transfer area that merits inspection.',
    limitation: 'Dust, lighting, material variation and blocked views can obscure the belt, so uncertain visibility requires manual review.',
  },
  retail: {
    title: 'Produce at the self-serve scale',
    subtitle: 'A camera view of a fictional neighbourhood supermarket',
    locationId: 'retail.produce.scales',
    view: 'scales',
    poster: '/map-assets/retail-poster.jpg',
    observation: 'A small camera above the self-serve scale provides images of the produce on the plate.',
    interpretation: 'In this scripted example, the produce is offered as a suggestion on the screen; the shopper confirms or picks another item.',
    compute: 'A store GPU could analyse images locally. This demonstration uses fixed scripted outputs and does not run inference.',
    response: 'The shopper confirms the suggestion; store colleagues act on any staff prompt under store procedures.',
    verification: 'The scale supplies the weight and the product list supplies the price; the camera only suggests what the produce is.',
    benefit: 'A local visual suggestion could save searching through produce menus.',
    limitation: 'Bags, mixed items and glare can make the camera unsure, so a person always confirms.',
  },
  // Fourth hub tile (after retail); also served at /datacenter.
  datacenter: {
    title: 'AI-ready datacenter',
    subtitle: 'An illustrative datacenter: power, cooling and structure before the GPUs arrive',
    locationId: 'datacenter.hungry',
    view: 'hero',
    poster: '/map-assets/datacenter-poster.jpg',
    observation: 'Three platforms show why a traditional hall is not ready for a modern AI rack: power density, cooling and floor loading.',
    interpretation: 'Each exhibit compares the assumption with the reality check; the figures are the infographic ranges, not a site assessment.',
    compute: 'Illustrative scenes only. No facility data is read or modelled.',
    response: 'An engineer assesses the real site: power per rack, cooling strategy and structural capacity.',
    verification: 'A site assessment, not this illustration, confirms whether a facility can host AI racks.',
    benefit: 'See the three reality checks behind an AI-ready datacenter.',
    limitation: 'Ranges are typical industry figures; every facility differs.',
  },
  // Fifth hub tile: one laptop, three engines (CPU, GPU, NPU), nothing leaves the desk.
  local: {
    title: 'Local AI on your laptop',
    subtitle: 'An illustrative desk: three AI jobs running on the laptop itself',
    locationId: 'local.cpu',
    view: 'cpu',
    poster: '/map-assets/local-poster.jpg',
    observation: 'A laptop on a desk does three everyday jobs: meeting notes, a long web form and a question about local files.',
    interpretation: 'Each exhibit shows which engine does the work (CPU, GPU or NPU) and that the data stays on the device.',
    compute: 'Illustrative scenes only. No model runs in this page; the chip layout is artistic licence, not a teardown.',
    response: 'The person checks the notes, presses Submit or opens the cited source themselves.',
    verification: 'The person, not the model, confirms names, amounts and the clause before anything is sent.',
    benefit: 'See what a laptop can do with AI on its own: private, no tokens to pay for, no wait on a server, and it works offline.',
    limitation: 'Local models are smaller and slower than cloud ones, and which chip Windows uses depends on the device.',
  },
  // Sixth hub tile: the Town Hall room, three Cisco Pro room devices, one cable each into the room engine.
  meeting: {
    title: 'The Town Hall room',
    subtitle: 'An illustrative meeting room: Cisco Pro cameras, ceiling microphones and ceiling speakers',
    locationId: 'meeting.ceiling.mic',
    view: 'hero',
    poster: '/map-assets/meeting-poster.jpg',
    observation: 'A presenter, a full table and two rows behind, with two Room Vision PTZ cameras, two Ceiling Microphone Pros and four Ceiling Speaker Pros.',
    interpretation: 'Each exhibit shows the AI inside one device: head detection in the camera, adaptive beams in the microphone, self-calibration in the speaker.',
    compute: 'Illustrative scenes only. Devices are drawn from Cisco data sheet sizes; no device runs in this page.',
    response: 'The presenter, the people in the room and the people on the call simply carry on; nobody steers a camera or a microphone.',
    verification: 'A room design in Cisco Workspace Designer and a site survey, not this illustration, confirm what a real room needs.',
    benefit: 'See how three Cisco Pro devices, one cable each, make a big room work for the people on the call.',
    limitation: 'Roadmap features (speaker tracking on this camera, voice lift) are shown as roadmap; the room’s own acoustics still matter.',
  },
  // Seventh hub tile: inside the network with Splunk (28 Oct 2026): SAP forecast, alert storm, "It's not us".
  splunk: {
    title: 'The outage that never happened',
    subtitle: 'An illustrative network: a campus, two branch sites, North and South data centres and SaaS apps',
    locationId: 'splunk.dc-south.sap',
    view: 'hero',
    poster: '/map-assets/splunk-poster.jpg',
    observation: 'Splunk watches the campus, both data centres and the SaaS apps, with ThousandEyes testing every path between them.',
    interpretation: 'Each exhibit shows where the AI helps: a forecast an hour out, forty alerts grouped into one cause, a slowdown placed outside the network.',
    compute: 'Illustrative scenes only. Sites, numbers and the clock are made up; no Splunk instance runs in this page.',
    response: 'The network team approves the change, and the load balancers move one small site to the North data centre.',
    verification: 'The network team, not the agent, approves the change, through the load balancers’ own change process.',
    benefit: 'See an outage stopped an hour before it happens: a forecast, a cause and a fix in one message, and a person says yes.',
    limitation: 'The AI suggests causes and next steps; people approve changes. Some agent workspaces in Splunk were in alpha in October 2026.',
  },
};

/** Deterministic demonstration state, separate from any verified physical condition. */
export function deriveLabState(_industry: LabIndustry, conditions: LabConditions): LabState {
  const degraded = conditions.lighting === 'low' || conditions.occlusion;
  const status = degraded ? 'review' : conditions.condition ? 'attention' : 'clear';
  const headline = degraded
    ? 'Visibility reduced — request manual review'
    : conditions.condition
      ? 'Scripted advisory — check this location'
      : 'No scripted advisory in this view';
  const detail = degraded
    ? 'The demonstration marks the observation as uncertain. Reduced visibility does not establish that the equipment is clear or affected.'
    : conditions.condition
      ? 'A fixed educational output marks a possible issue. An authorised operator must verify the physical condition; no measurement or confidence score is available.'
      : 'This scripted example has no issue flag for the selected conditions. It does not prove that the physical location is clear.';
  const local = degraded
    ? 'Local display: observation uncertain; manual review requested.'
    : conditions.condition
      ? 'Local display: scripted advisory available for operator review.'
      : 'Local display: no scripted advisory; this is not a clearance.';
  const cloud = conditions.connected
    ? 'Connected in the illustration: cloud hand-off is available. No observation data is transmitted.'
    : 'Offline in the illustration: local advisory continues; cloud transfer is shown as queued. No observation data is transmitted.';

  return { status, headline, detail, local, cloud };
}

/** Display copy per Lab world. Add a world here (and to LabIndustry) and the hub tiles and explorer headings follow. */
export const LAB_WORLDS: Record<LabIndustry, { name: string; eyebrow: string; frame: string; alt: string; tile: string; tags: string[]; places?: number; bareEyebrow?: boolean; offHub?: boolean; intro?: string; back?: { href: string; label: string } }> = {
  energy: {
    name: 'Water and energy',
    eyebrow: 'WATER AND ENERGY',
    frame: 'Energy',
    alt: '3D water and energy miniature with dam and infrastructure',
    tile: 'Watch debris gather on a dam intake, a robot find a warm connection in the substation and a drone pick the span to inspect first.',
    tags: ['3D exploration', 'Camera, robot + drone', 'A person decides'],
  },
  mining: {
    name: 'Mining operations',
    eyebrow: 'MINING',
    frame: 'Mining',
    alt: '3D open-pit mining miniature with haulage and processing plant',
    tile: 'Catch a growing build-up at a conveyor chute, a robot find a new wet area by a pump and see around the loading-bay corner.',
    tags: ['3D exploration', 'Camera + robot', 'A person decides'],
  },
  retail: {
    name: 'Retail and supermarkets',
    eyebrow: 'RETAIL',
    frame: 'Retail',
    alt: '3D roof-off supermarket miniature with produce, deli and checkouts',
    tile: 'Recognise produce, help a waiting customer, keep displays stocked.',
    tags: ['3D exploration', 'Store cameras', 'A person decides'],
  },
  // Fourth hub tile, after retail (next to it on desktop, under it on phones). Also served at /datacenter.
  datacenter: {
    name: 'AI-ready datacenter',
    eyebrow: 'AI-READY INFRASTRUCTURE',
    frame: 'Datacenter',
    alt: '3D datacenter miniature: power, cooling and structure platforms',
    tile: 'Too hungry, too hot, too heavy: the reality checks before the GPUs arrive.',
    tags: ['3D exploration', 'Power, cooling + structure', 'An engineer decides'],
    bareEyebrow: true,
    intro: 'Too hungry, too hot, too heavy: select a marker to see the reality check behind each.',
  },
  // Fifth hub tile: a Surface Laptop Ultra-style desk.
  local: {
    name: 'Local AI on your laptop',
    eyebrow: 'LOCAL AI',
    frame: 'Laptop',
    alt: '3D desk miniature with an open laptop and its CPU, GPU and NPU shown through a glass deck',
    tile: 'Three jobs, three engines, nothing leaves the desk: meeting notes on the CPU, a browser agent on the GPU, your own files on the NPU.',
    tags: ['3D exploration', 'Private, no tokens', 'CPU, GPU + NPU'],
    bareEyebrow: true,
    intro: 'Three jobs on one laptop: select a chip to see what it does and what stays on the device.',
  },
  // Sixth hub tile: the Town Hall room (Cisco Room Vision PTZ, Ceiling Microphone Pro, Ceiling Speaker Pro).
  meeting: {
    name: 'Meeting rooms',
    eyebrow: 'MEETING ROOMS',
    frame: 'Meeting room',
    alt: '3D meeting room miniature with a presenter, a boardroom table, two audience rows and Cisco room devices hanging from an open cable tray',
    tile: 'A room that sees who is talking, hears only the voices and sounds the same in every seat: three Cisco Pro devices, one cable each, no amplifier rack.',
    tags: ['3D exploration', 'Camera, microphone + speaker', 'One cable each, no amplifier'],
    bareEyebrow: true,
    intro: 'Three Cisco Pro devices, each with AI inside: select one to see what it does for the people on the call.',
  },
  // Seventh hub tile: Splunk, inside the network (three exhibits since 28 Oct 2026).
  splunk: {
    name: 'Inside the network',
    eyebrow: 'SPLUNK',
    frame: 'Network',
    alt: '3D glowing network miniature: a campus, two branch sites, North and South data centres, load balancers, a SaaS cloud and the Splunk ring above',
    tile: 'Splunk sees the whole network, campus to data centre to SaaS. Stop an SAP outage before it happens, turn forty alerts into one cause, and prove a slowdown isn’t you.',
    tags: ['3D exploration', 'Splunk + ThousandEyes', 'The team approves'],
    bareEyebrow: true,
    intro: 'Campus to data centre to SaaS in one view: select a marker to see where Splunk’s AI helps the network team.'
  },
};

/** The worlds shown as tiles on the /ai-lab hub. */
export const HUB_WORLDS = (Object.keys(LAB_WORLDS) as LabIndustry[]).filter(id => !LAB_WORLDS[id].offHub);
