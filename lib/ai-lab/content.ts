export type LabIndustry = 'energy' | 'mining';

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
  view: 'intake' | 'conveyor' | 'workshop' | 'control' | 'tank-detail' | 'tanks';
  poster: '/map-assets/poster.jpg' | '/map-assets/mining-poster.jpg';
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
