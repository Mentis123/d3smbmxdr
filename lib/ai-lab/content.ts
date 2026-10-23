export type LabIndustry = 'energy' | 'mining' | 'retail' | 'datacenter';

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
  view: 'intake' | 'conveyor' | 'workshop' | 'control' | 'tank-detail' | 'tanks' | 'scales' | 'hero';
  poster: '/map-assets/poster.jpg' | '/map-assets/mining-poster.jpg' | '/map-assets/retail-poster.jpg';
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
  // Reached from /datacenter, not the hub. No datacenter poster exists yet, so the loading backdrop reuses the energy one.
  datacenter: {
    title: 'AI-ready datacenter',
    subtitle: 'An illustrative datacenter: power, cooling and structure before the GPUs arrive',
    locationId: 'datacenter.hungry',
    view: 'hero',
    poster: '/map-assets/poster.jpg',
    observation: 'Three platforms show why a traditional hall is not ready for a modern AI rack: power density, cooling and floor loading.',
    interpretation: 'Each exhibit compares the assumption with the reality check; the figures are the infographic ranges, not a site assessment.',
    compute: 'Illustrative scenes only. No facility data is read or modelled.',
    response: 'An engineer assesses the real site: power per rack, cooling strategy and structural capacity.',
    verification: 'A site assessment, not this illustration, confirms whether a facility can host AI racks.',
    benefit: 'See the three reality checks behind an AI-ready datacenter.',
    limitation: 'Ranges are typical industry figures; every facility differs.',
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
export const LAB_WORLDS: Record<LabIndustry, { name: string; eyebrow: string; frame: string; alt: string; tile: string; tags: string[]; offHub?: boolean; intro?: string; back?: { href: string; label: string } }> = {
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
  // Served at /datacenter (and /ai-lab/datacenter); offHub keeps it off the /ai-lab tiles and counts.
  datacenter: {
    name: 'AI-ready datacenter',
    eyebrow: 'AI-READY INFRASTRUCTURE',
    frame: 'Datacenter',
    alt: '3D datacenter miniature: power, cooling and structure platforms',
    tile: 'Too hungry, too hot, too heavy: the reality checks before the GPUs arrive.',
    tags: ['3D exploration', 'Power, cooling + structure', 'An engineer decides'],
    offHub: true,
    intro: 'Too hungry, too hot, too heavy: select a marker to see the reality check behind each.',
    back: { href: '/links', label: '← All resources' },
  },
};

/** The worlds shown as tiles on the /ai-lab hub. */
export const HUB_WORLDS = (Object.keys(LAB_WORLDS) as LabIndustry[]).filter(id => !LAB_WORLDS[id].offHub);
