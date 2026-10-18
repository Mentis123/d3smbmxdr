// One physical close-up distance for wheel, buttons, keyboard and touch pinch.
export const MIN_ZOOM=.85,MIN_ORBIT_DISTANCE=3;
export function orbitDistance(width,height){const aspect=width/Math.max(1,height);return Math.max(height<400&&width>height?39:36,44/Math.max(.25,aspect));}
export function clampZoom(value,width,height){return Math.max(MIN_ZOOM,Math.min(orbitDistance(width,height)/MIN_ORBIT_DISTANCE,Number.isFinite(value)?value:1));}
