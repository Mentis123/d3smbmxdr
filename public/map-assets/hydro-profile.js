// Shared, deterministic land/water contract. Model units; X right, +Z downstream.
// Keep the dam mouth fixed while opening the lake and breaking the outlet contour.
export function channelBend(z){const t=Math.max(0,Math.min(1,(z-1)/6));return 3.2*t*t*(3-2*t);}
export function rearZ(z){const t=Math.max(0,Math.min(1,(-z-2.8)/1.4));return z-2*t*t*(3-2*t);}
export function riverCenter(z){return -5.6+.42*Math.sin(z*.72)+channelBend(z);}
export function riverHalfWidth(z){return 2.42+.23*Math.sin(z*.7)+.32*Math.exp(-(((z-4.8)/1.65)**2));}
export function riverEnd(u){return 7.35+.18*Math.sin(u*4.1+.4)+.07*Math.sin(u*9.3);}
export const reservoirOutline=[[-8.55,-.62],[-.65,-.62],[-.75,-3.4],[-1.25,-4.6],[-2.2,-5.4],[-4.1,-6.25],[-6.6,-6.45],[-8.35,-5.75],[-8.9,-4.15],[-8.8,-2.2]].map(([x,z])=>[x,rearZ(z)]);
export const hydroGLSL=`
float channelBend(float z){return 3.2*smoothstep(1.,7.,z);}
float riverCenter(float z){return -5.6+.42*sin(z*.72)+channelBend(z);}
float riverHalfWidth(float z){return 2.42+.23*sin(z*.7)+.32*exp(-pow((z-4.8)/1.65,2.));}
`;
export function terrainPoint(x,z){
  // Boundary displacements vanish in the interior, preserving facility anchors.
  return [x+.12*Math.sin(z*1.41+.8)*Math.pow(Math.abs(x)/10,10),z+.08*Math.sin(x*.92+.3)*Math.pow(Math.abs(z+1)/8,12)];
}
