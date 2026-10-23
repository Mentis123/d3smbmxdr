import * as THREE from 'three';
import {buildWorkflow} from './exhibit-workflows.js';
import {RECIPES,LEGACY_IDS} from './lab/recipes/index.js';
import {runRecipe} from './lab/exhibit-runner.js';

const PHASE_SECONDS=6,CYCLE_SECONDS=PHASE_SECONDS*3;

// Shared exhibit stage: scene, lights, plinth and the resource-owning kit helpers. Every geometry, material and
// texture made through these helpers is disposed with the exhibit.
function createStage(){
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x071322);
  scene.fog=new THREE.Fog(0x071322,18,38);
  const root=new THREE.Group();scene.add(root);
  const camera=new THREE.PerspectiveCamera(38,1,.05,60);
  const materials=[],geometries=[],textures=[];
  const mat=(color,opts={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.65,...opts});materials.push(m);return m;};
  const steel=mat(0x8899a3,{metalness:.75,roughness:.32}),dark=mat(0x223540,{metalness:.6}),yellow=mat(0xdca644),cyan=mat(0x32c9f2,{emissive:0x008cb0,emissiveIntensity:.45}),amber=mat(0xffc36b,{emissive:0xd77517,emissiveIntensity:.5});
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const n=Math.sin(x*127.1+y*311.7)*43758.5453,v=115+Math.floor((n-Math.floor(n))*35);ctx.fillStyle=`rgb(${v},${v+3},${v+4})`;ctx.fillRect(x,y,1,1);}
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
  const concrete=mat(0xb5bec1,{map:texture,roughness:.96});
  function mesh(g,m,x=0,y=0,z=0){geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
  const box=(w,h,d,m,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const cylinder=(r,len,m,x,y,z)=>mesh(new THREE.CylinderGeometry(r,r,len,16),m,x,y,z);
  function bar(a,b,r,m){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),o=cylinder(r,av.distanceTo(bv),m,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o;}
  // Register any other resource (canvas textures, shader materials, geometries made outside mesh()).
  function track(r){if(r?.isTexture)textures.push(r);else if(r?.isMaterial)materials.push(r);else if(r?.isBufferGeometry)geometries.push(r);return r;}
  scene.add(new THREE.HemisphereLight(0xbfe8ff,0x354156,2.3));
  const key=new THREE.DirectionalLight(0xffe5c0,3.6);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:20});key.shadow.normalBias=.025;scene.add(key);
  const rim=new THREE.DirectionalLight(0x37baff,2);rim.position.set(4,3,-4);scene.add(rim);
  box(7,.3,4.4,mat(0x132c3d,{metalness:.5}),0,-.2,0);
  box(6.85,.045,4.25,concrete,0,-.025,0);
  for(const z of [-2.16,2.16])box(6.8,.025,.025,cyan,0,-.06,z);
  return{scene,root,camera,key,rim,k:{THREE,root,box,cylinder,bar,mesh,mat,steel,dark,yellow,cyan,amber,concrete,track},
    dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());key.shadow.map?.dispose();}};
}

// Isolated, deterministic museum exhibits. Shares the world's WebGL renderer, never its resources.
// Recipe exhibits (lab/recipes) run the four-chapter grammar; the four retired ids keep the three-phase workflow path.
export function createExhibit(id, host, notify) {
  if(Object.hasOwn(RECIPES,id))return runRecipe(RECIPES[id],createStage(),host,notify);
  if(!LEGACY_IDS.includes(id))throw Error('Unsupported exhibit');
  return createLegacyExhibit(id,createStage(),host,notify);
}

function createLegacyExhibit(id,stage,host,notify){
  const {scene,root,camera,k}=stage,target=new THREE.Vector3(0,1,0);
  const workflow=buildWorkflow(id,k);
  let time=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,angle=.55,elevation=.42,distance=10.8,lastPhase=-1;
  // Fit actual mesh corners, rather than a conservative empty bounding box or fixed distance.
  root.updateMatrixWorld(true);
  const frameBox=new THREE.Box3().setFromObject(root);frameBox.getCenter(target);const frameCenter=target.clone();
  const framePoints=[];
  root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++)framePoints.push(new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).sub(frameCenter));});
  const outward=new THREE.Vector3(),right=new THREE.Vector3(),screenUp=new THREE.Vector3(),vertical=new THREE.Vector3(0,1,0);
  let fittedDistance=10.8,frameKey='';
  const points=new Map();let gesture=null;
  function pose(){
    const w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();
    const nextKey=[w,h,angle,elevation].join(':');
    if(nextKey!==frameKey){
      frameKey=nextKey;outward.set(Math.sin(angle)*Math.cos(elevation),Math.sin(elevation),Math.cos(angle)*Math.cos(elevation));right.crossVectors(vertical,outward).normalize();screenUp.crossVectors(outward,right).normalize();
      const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect,coords=framePoints.map(p=>({x:p.dot(right),y:p.dot(screenUp),z:p.dot(outward)}));
      let sx=0,sy=0,fit=0;
      for(let iteration=0;iteration<4;iteration++){
        fit=0;for(const p of coords)fit=Math.max(fit,p.z+Math.abs(p.x-sx)/tanH,p.z+Math.abs(p.y-sy)/tanV);
        if(iteration===3)break;
        let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
        for(const p of coords){const depth=fit-p.z;minX=Math.min(minX,(p.x-sx)/depth);maxX=Math.max(maxX,(p.x-sx)/depth);minY=Math.min(minY,(p.y-sy)/depth);maxY=Math.max(maxY,(p.y-sy)/depth);}
        sx+=(minX+maxX)*.5*fit;sy+=(minY+maxY)*.5*fit;
      }
      fittedDistance=fit*1.08;target.copy(frameCenter).addScaledVector(right,sx).addScaledVector(screenUp,sy);
    }
    camera.position.copy(outward).multiplyScalar(fittedDistance*(distance/10.8)).add(target);camera.lookAt(target);camera.updateMatrixWorld();
  }
  function framing(){const bounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};for(const p of framePoints){const v=p.clone().add(frameCenter).project(camera);bounds.minX=Math.min(bounds.minX,v.x);bounds.maxX=Math.max(bounds.maxX,v.x);bounds.minY=Math.min(bounds.minY,v.y);bounds.maxY=Math.max(bounds.maxY,v.y);}return bounds;}

  function update(dt){if(playing)time+=dt;const t=time%CYCLE_SECONDS,phase=Math.floor(t/PHASE_SECONDS);
    workflow.update(t,phase);
    if(phase!==lastPhase){lastPhase=phase;notify({phase,playing,time:t});}pose();
  }
  const stop=e=>{e.stopImmediatePropagation();};
  function down(e){stop(e);if(e.button!==0)return;host.focus({preventScroll:true});points.set(e.pointerId,{x:e.clientX,y:e.clientY});host.setPointerCapture(e.pointerId);gesture=null;e.preventDefault();}
  function move(e){if(!points.has(e.pointerId))return;stop(e);const old=points.get(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===2){const [a,b]=[...points.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(gesture)distance=THREE.MathUtils.clamp(distance*gesture/d,6.5,16);gesture=d;}else{angle-=(e.clientX-old.x)*.007;elevation=THREE.MathUtils.clamp(elevation+(e.clientY-old.y)*.005,.08,1.2);}pose();}
  function up(e){if(!points.has(e.pointerId))return;stop(e);points.delete(e.pointerId);gesture=null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);}
  function wheel(e){stop(e);e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),6.5,16);pose();}
  function keydown(e){if(e.key==='Escape'){stop(e);e.preventDefault();notify({close:true});return;}if(e.target!==host)return;if(e.code==='KeyF'||e.key==='Home'){stop(e);e.preventDefault();if(e.key==='Home'){angle=.55;elevation=.42;distance=10.8;pose();}return;}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-',' '].includes(e.key)){stop(e);e.preventDefault();if(e.key==='ArrowLeft')angle-=.15;if(e.key==='ArrowRight')angle+=.15;if(e.key==='ArrowUp')elevation=Math.min(1.2,elevation+.1);if(e.key==='ArrowDown')elevation=Math.max(.08,elevation-.1);if(e.key==='+')distance=Math.max(6.5,distance/1.1);if(e.key==='-')distance=Math.min(16,distance*1.1);if(e.key===' ')playing=!playing;pose();notify({phase:lastPhase,playing,time:time%CYCLE_SECONDS});}}
  const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['wheel',wheel]];
  listeners.forEach(([n,f])=>host.addEventListener(n,f,{capture:true,passive:false}));document.addEventListener('keydown',keydown,true);
  update(0);
  return{scene,camera,update,command(action){if(action==='pause')playing=!playing;if(action==='next'){time=((lastPhase+1)%3)*PHASE_SECONDS;playing=false;update(0);}if(action==='replay'){time=0;playing=true;}if(action==='reset'){angle=.55;elevation=.42;distance=10.8;}notify({phase:lastPhase,playing,time:time%CYCLE_SECONDS});},setTime(t){time=t;playing=false;update(0);},metrics:()=>({id,time:time%CYCLE_SECONDS,playing,phase:lastPhase,angle,elevation,distance,fittedDistance,framing:framing(),workflow:workflow?.metrics()}),dispose(){listeners.forEach(([n,f])=>host.removeEventListener(n,f,true));document.removeEventListener('keydown',keydown,true);points.clear();stage.dispose();}};
}
