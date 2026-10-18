// Miniature-local model units: Y up, +Z towards reference viewer. Back faces inferred.
import {rearZ} from './hydro-profile.js';
export const LAYOUT={
  tanks:[{id:'west',x:2.1,z:1.25,r:1.08},{id:'north',x:4.1,z:-.65,r:1.06},{id:'south',x:4.8,z:3.15,r:1.18}],
  yard:{x:7.3,z:-.65,w:3.65,d:3.7,y:1.9},
  town:{x:1.2,z:rearZ(-5.05)},
  service:{x:7.2,z:4.35},
  bridge:{x:6.8,z:rearZ(-4.75),length:4.5,width:.65},
  // Levelled, paved terrace the town stands on (top just under the 2.0 building datum).
  // Streets run between the three building rows; scatter passes keep grass, shrubs and trees off it.
  townTerrace:{x0:-.45,x1:4.25,z0:-8.42,z1:-5.78,top:1.995,streets:[-7.415,-6.595]},
};
export function onTownTerrace(x,z,margin=0){const t=LAYOUT.townTerrace;return x>t.x0-margin&&x<t.x1+margin&&z>t.z0-margin&&z<t.z1+margin;}
