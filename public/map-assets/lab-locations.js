// Stable experience recipes bind onto physical world locations. No scenario state.
// Markers come from the featured recipes (three per world); the retired ids stay openable by id but have no marker.
import {FEATURED} from './lab/recipes/index.js';
const marker=r=>({id:r.id,locationId:r.locationId,label:r.label,view:r.view,anchor:r.anchor,kind:'vision'});
export const LAB_LOCATIONS={
  energy:FEATURED.energy.map(marker),
  mining:FEATURED.mining.map(marker),
  retail:FEATURED.retail.map(marker),
  datacenter:FEATURED.datacenter.map(marker),
  local:FEATURED.local.map(marker),
  meeting:FEATURED.meeting.map(marker),
};
