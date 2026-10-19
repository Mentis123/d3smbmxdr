// Fly-through kernel: a camera SHOT is data, evaluated deterministically by scene time.
// No DOM. Needs only three's math (Vector3, CatmullRomCurve3, MathUtils).
//
// A shot is a list of keyframes in miniature-local space (the turntable's frame, so the
// path stays valid whatever yaw the table is shown at):
//   {t, pos, look, fov?, ease?}
// pos/look are REFS, resolved every frame against the live scene:
//   [x,y,z]                                   fixed point
//   {view:'hero'}                             where the orbit camera sits for that preset (viewport-aware)
//   {object:'dam-pier', offset:[x,y,z]}       a named Object3D's local position plus an offset
//   {actor:'dam-service-van', offset:[a,u,s]} a moving actor; offset is in the actor's frame:
//                                             a = along its heading, u = up, s = to its right... see actorFrame
// `fade` is an optional list of [t, amount] pairs (0 = clear, 1 = black), smoothstepped between
// points, drawn in the WebGL frame so recordings carry it. e.g. fade:[[0,1],[3,0],[56,0],[60,1]].
// `clock` pins the shot to the scene's animation clock so moving things are where the shot needs them:
//   {sceneTime: 12}                                           start at this scene time
//   {actor:'dam-service-van', phase:'outbound', progress:.15, atShotTime:8}
//                                                             solve the start so the actor is 15% through
//                                                             its outbound leg when the shot reaches t=8
// Between keyframes the camera rides a centripetal Catmull-Rom spline through the resolved
// points; the spline parameter is keyframe-indexed, so key i is reached exactly at t_i. `ease`
// shapes time inside the segment that ENDS at that key ('linear' default, 'in', 'out', 'inOut').
import * as THREE from 'three';

export const EASE={
  linear:u=>u,
  in:u=>u*u,
  out:u=>1-(1-u)*(1-u),
  inOut:u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,
  smooth:u=>u*u*(3-2*u),
};

// Actor frame: heading rotates +x (forward) about +y. offset=[along, up, side], side = +z when heading 0.
export function actorFrame(position,heading,offset=[0,0,0]){
  const [a,u,s]=offset,c=Math.cos(heading),sn=Math.sin(heading);
  // rotation.y=heading maps local +x to (cos h, 0, -sin h) and local +z to (sin h, 0, cos h)
  return [position[0]+a*c+s*sn,position[1]+u,position[2]-a*sn+s*c];
}

export function solveStartSceneTime(clock,actors){
  if(!clock)return 0;
  if(typeof clock.sceneTime==='number')return clock.sceneTime;
  const actor=actors?.[clock.actor];
  if(!actor)throw Error(`clock: unknown actor ${clock.actor}`);
  const phase=actor.phases.find(p=>p.name===clock.phase);
  if(!phase)throw Error(`clock: actor ${clock.actor} has no phase ${clock.phase}; has ${actor.phases.map(p=>p.name).join(', ')}`);
  const progress=THREE.MathUtils.clamp(clock.progress??0,0,1),at=clock.atShotTime??0;
  const cyclePoint=phase.start+progress*phase.length;
  let start=cyclePoint-at;
  while(start<0)start+=actor.cycle;
  return start;
}

function resolveRef(ref,sceneTime,ctx){
  if(Array.isArray(ref))return ref.slice(0,3);
  if(ref&&typeof ref==='object'){
    if(ref.view){const p=ctx.viewPosition?.(ref.view);if(!p)throw Error(`unknown view ${ref.view}`);return p;}
    if(ref.object){const p=ctx.objectPosition?.(ref.object);if(!p)throw Error(`unknown object ${ref.object}`);const o=ref.offset||[0,0,0];return [p[0]+o[0],p[1]+o[1],p[2]+o[2]];}
    if(ref.actor){const a=ctx.actors?.[ref.actor];if(!a)throw Error(`unknown actor ${ref.actor}`);const s=a.stateAt(sceneTime);return actorFrame(s.position,s.heading,ref.offset);}
  }
  throw Error('unresolvable ref '+JSON.stringify(ref));
}

export function compileShot(spec,ctx={}){
  const keys=spec.keys;
  if(!keys||keys.length<2)throw Error('a shot needs at least two keyframes');
  for(let i=1;i<keys.length;i++)if(!(keys[i].t>keys[i-1].t))throw Error(`keyframe ${i} is not later than keyframe ${i-1}`);
  if(keys[0].t!==0)throw Error('first keyframe must be at t=0');
  const duration=keys[keys.length-1].t,startSceneTime=solveStartSceneTime(spec.clock,ctx.actors);
  const fades=(spec.fade||[]).map(([t,v])=>[+t,THREE.MathUtils.clamp(+v,0,1)]);
  for(let i=1;i<fades.length;i++)if(!(fades[i][0]>fades[i-1][0]))throw Error(`fade point ${i} is not later than fade point ${i-1}`);
  const fadeAt=t=>{if(!fades.length)return 0;if(t<=fades[0][0])return fades[0][1];for(let i=1;i<fades.length;i++){if(t<=fades[i][0]){const [t0,v0]=fades[i-1],[t1,v1]=fades[i];return THREE.MathUtils.lerp(v0,v1,EASE.smooth((t-t0)/(t1-t0)));}}return fades[fades.length-1][1];};
  const n=keys.length,posCurve=new THREE.CatmullRomCurve3([],false,'centripetal'),lookCurve=new THREE.CatmullRomCurve3([],false,'centripetal');
  const sample=(t)=>{
    t=THREE.MathUtils.clamp(t,0,duration);const sceneTime=startSceneTime+t;
    posCurve.points=keys.map(k=>new THREE.Vector3(...resolveRef(k.pos,sceneTime,ctx)));
    lookCurve.points=keys.map(k=>new THREE.Vector3(...resolveRef(k.look,sceneTime,ctx)));
    let i=0;while(i<n-2&&t>=keys[i+1].t)i++;
    const k0=keys[i],k1=keys[i+1],local=(t-k0.t)/(k1.t-k0.t),ease=EASE[k1.ease||'linear']||EASE.linear,u=(i+ease(local))/(n-1);
    const fov0=k0.fov??spec.fov??42,fov1=k1.fov??spec.fov??42;
    return {t,sceneTime,position:posCurve.getPoint(u),lookAt:lookCurve.getPoint(u),fov:THREE.MathUtils.lerp(fov0,fov1,ease(local)),segment:i,fade:fadeAt(t)};
  };
  return {spec,name:spec.name,title:spec.title||spec.name,yaw:spec.yaw||0,duration,startSceneTime,sample};
}

// Walks the compiled shot and reports what a bad path looks like before anyone records it.
// A shot may relax or tighten the guards for itself via spec.audit ({maxSpeed, minClearance}); the
// values in force are echoed in each check so a relaxed limit is visible wherever the audit is read.
export function auditShot(compiled,{height,waterLevel,step=.1,minClearance,maxSpeed,actors}={}){
  const limits={minClearance:.25,maxSpeed:12,...(compiled.spec.audit||{})};
  if(minClearance!==undefined)limits.minClearance=minClearance;if(maxSpeed!==undefined)limits.maxSpeed=maxSpeed;
  minClearance=limits.minClearance;maxSpeed=limits.maxSpeed;
  const checks=[],push=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
  let minClear=Infinity,minClearAt=0,maxV=0,maxVAt=0,minLook=Infinity,nan=false,prev=null,n=0;
  for(let t=0;t<=compiled.duration+1e-9;t+=step){
    const s=compiled.sample(t),p=s.position,l=s.lookAt;n++;
    if(![p.x,p.y,p.z,l.x,l.y,l.z,s.fov].every(Number.isFinite))nan=true;
    const clear=Math.min(height?p.y-height(p.x,p.z):Infinity,waterLevel?p.y-waterLevel(p.x,p.z):Infinity);if(clear<minClear){minClear=clear;minClearAt=t;}
    minLook=Math.min(minLook,p.distanceTo(l));
    if(prev){const v=p.distanceTo(prev)/step;if(v>maxV){maxV=v;maxVAt=t;}}
    prev=p.clone();
  }
  push('duration positive',compiled.duration>0,compiled.duration);
  push('every sample finite',!nan,n);
  push('camera stays above terrain and water',minClear>=minClearance,{minClearance:+minClear.toFixed(3),required:minClearance,at:+minClearAt.toFixed(2)});
  push('camera speed bounded',maxV<=maxSpeed,{maxUnitsPerSecond:+maxV.toFixed(2),limit:maxSpeed,at:+maxVAt.toFixed(2)});
  push('camera never looks at itself',minLook>=.3,{minLookDistance:+minLook.toFixed(3)});
  const clock=compiled.spec.clock;
  if(clock?.actor&&actors?.[clock.actor]){
    const s=actors[clock.actor].stateAt(compiled.startSceneTime+(clock.atShotTime??0));
    push(`clock: ${clock.actor} is in ${clock.phase} at t=${clock.atShotTime??0}`,s.phase===clock.phase,s);
  }
  return {pass:checks.every(c=>c.pass),checks,samples:n,limits};
}
