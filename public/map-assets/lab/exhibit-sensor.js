import * as THREE from 'three';
import {OVERLAY_COLOURS} from './exhibit-overlay.js';

// Sensor view: the same renderer draws the exhibit through a sensor camera, with a material swap on the scene.
// thermal = targets hot, everything else cool greys; mask = fill on targets in the overlay's state colour
// (white while scanning, amber noticed, red for review), the rest dimmed. Unclear: no confident mask at all.
// A target subtree marked userData.unmasked (e.g. debris still drifting) is drawn as the rest.
// Only the swap is new; nothing is rendered twice. Replacement materials are cached and disposed with the view.
const HOT=new THREE.Color(0xffd166),COOL=new THREE.Color(0x1d2a4a),CYAN=new THREE.Color(0x19d3ff),GREY=new THREE.Color(0x9aa5ad);

export function createSensorView(scene,root){
  const cache=new Map(),swapped=[];let current='';
  const background=scene.background?.clone?.()||null,fog=scene.fog?{color:scene.fog.color.clone(),near:scene.fog.near,far:scene.fog.far}:null;
  function replacement(material,role,mode,state){
    const key=material.uuid+'|'+role+'|'+mode+'|'+state;
    if(cache.has(key))return cache.get(key);
    let m=null;
    if(material.isMeshStandardMaterial||material.isMeshBasicMaterial||material.isMeshLambertMaterial){
      const base=material.color?material.color.clone():new THREE.Color(0x888888),lum=base.r*.3+base.g*.55+base.b*.15;
      if(mode==='thermal'){
        m=role==='target'?new THREE.MeshBasicMaterial({color:state==='unclear'?GREY.clone().lerp(HOT,.35):HOT.clone().lerp(new THREE.Color(0xffffff),.2),toneMapped:false})
          :new THREE.MeshStandardMaterial({color:COOL.clone().lerp(new THREE.Color(0x6e7aa8),Math.min(1,lum*1.4)),roughness:1,metalness:0,transparent:material.transparent,opacity:material.opacity});
      }else{
        if(role==='target'){const c=new THREE.Color(OVERLAY_COLOURS[state]||OVERLAY_COLOURS.neutral);
          m=new THREE.MeshStandardMaterial({color:base.clone().lerp(c,.6),emissive:c,emissiveIntensity:.26,roughness:.75,side:material.side,transparent:material.transparent,opacity:material.opacity});}
        else{const grey=new THREE.Color(lum,lum,lum).lerp(base,.25).multiplyScalar(.42);m=new THREE.MeshStandardMaterial({color:grey,roughness:.95,metalness:0,transparent:material.transparent,opacity:material.opacity*(material.transparent?.8:1),depthWrite:material.depthWrite,side:material.side,map:material.map||null});}
      }
    }
    cache.set(key,m);return m;
  }
  function restore(){for(const [o,m] of swapped)o.material=m;swapped.length=0;if(background)scene.background=background;if(fog&&scene.fog){scene.fog.color.copy(fog.color);scene.fog.near=fog.near;scene.fog.far=fog.far;}current='';}
  // sensor: {mode, targets} or null. state: 'noticed'|'review'|'unclear'|'neutral'.
  function apply(sensorId,sensor,state='neutral'){
    const key=sensor&&sensor.mode!=='normal'?sensorId+'|'+state+'|'+(sensor.key?.()??''):sensor?sensorId+'|normal':'';
    if(key===current)return;restore();current=key;if(!sensor)return;
    scene.background=new THREE.Color(sensor.mode==='thermal'?0x0b0f22:0x05090e);
    if(scene.fog){scene.fog.color.set(sensor.mode==='thermal'?0x0b0f22:0x05090e);}
    if(sensor.mode==='normal')return;
    const targets=new Set(),add=o=>{if(o.userData.unmasked)return;targets.add(o);o.children.forEach(add);};
    if(!(sensor.mode==='mask'&&state==='unclear'))for(const t of sensor.targets||[])add(t);
    root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.userData.sensorKeep)return;const m=replacement(o.material,targets.has(o)?'target':'rest',sensor.mode,state);if(m){swapped.push([o,o.material]);o.material=m;}});
  }
  return{apply,restore,get active(){return current!=='';},dispose(){restore();cache.forEach(m=>m?.dispose());cache.clear();}};
}

// Keep a sensor camera's view of the subject on tall, narrow canvases by widening its vertical field of view.
export function fitSensorCamera(camera,aspect){
  const base=camera.userData.baseFov??(camera.userData.baseFov=camera.fov);
  const tanV=Math.tan(THREE.MathUtils.degToRad(base/2)),needH=tanV*(camera.userData.portraitWidth??1);
  const fov=aspect<1.25?THREE.MathUtils.radToDeg(2*Math.atan(Math.max(tanV,needH/aspect)*.92)):base;
  if(Math.abs(camera.fov-fov)>1e-6||Math.abs(camera.aspect-aspect)>1e-6){camera.fov=fov;camera.aspect=aspect;camera.updateProjectionMatrix();}
}
