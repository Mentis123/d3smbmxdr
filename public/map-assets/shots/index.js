// Registry of fly-through shots. Add a file under shots/ and list it here; the viewer, the
// headless recorder (scripts/map-flythrough.mjs) and the tests all read this one list.
import damDrone from './dam-drone.js';
import riverbendOverview from './riverbend-overview.js';
import ironvaleOverview from './ironvale-overview.js';
import valeDescent from './vale-descent.js';
export const SHOTS={[damDrone.name]:damDrone,[riverbendOverview.name]:riverbendOverview,[ironvaleOverview.name]:ironvaleOverview,[valeDescent.name]:valeDescent};
export function getShot(name){const s=SHOTS[name];if(!s)throw Error(`unknown shot ${name}; have ${Object.keys(SHOTS).join(', ')}`);return s;}
