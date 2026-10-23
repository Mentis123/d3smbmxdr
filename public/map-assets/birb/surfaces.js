import * as THREE from 'three';

// Contact queries use the rendered geometry, including animated instance transforms.
// Decorative spray, ore grains and invisible helper meshes are not solid perches.
export function createSurfaces(root){
  const meshes=[],ray=new THREE.Raycaster(),normalMatrix=new THREE.Matrix3(),matrix=new THREE.Matrix4(),instance=new THREE.Matrix4();
  root.traverse(o=>{if(o.isMesh&&(!o.isInstancedMesh||o.count<512)&&! /moving-ore|spray|particle|mist|foam|reflection|glow|highlight/i.test(o.name))meshes.push(o);});
  const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  function hits(origin,direction,distance){root.updateWorldMatrix(true,true);ray.set(origin,direction);ray.near=0;ray.far=distance;return ray.intersectObjects(meshes,false).filter(h=>visible(h.object));}
  function normal(hit){matrix.copy(hit.object.matrixWorld);if(hit.instanceId!==undefined){hit.object.getMatrixAt(hit.instanceId,instance);matrix.multiply(instance);}return hit.face.normal.clone().applyNormalMatrix(normalMatrix.getNormalMatrix(matrix));}
  function support(position,range=30){return hits(position,new THREE.Vector3(0,-1,0),range).find(h=>Math.abs(normal(h).y)>.45);}
  function sweep(from,to,radius=.08){const delta=to.clone().sub(from),length=delta.length();if(length<1e-7)return null;return hits(from,delta.divideScalar(length),length+radius).find(h=>!isWater(h.object));}
  function isWater(o){return /^(reservoir|river-surface)$|water-surface|pond-surface|basin-water/i.test(o.name);}
  function objectMatrix(hit){matrix.copy(hit.object.matrixWorld);if(hit.instanceId!==undefined){hit.object.getMatrixAt(hit.instanceId,instance);matrix.multiply(instance);}return matrix.clone();}
  function anchor(hit){const m=objectMatrix(hit);let conveyor=hit.object.userData.birbConveyor,u=0;if(conveyor){const p=hit.point.clone().applyMatrix4(m.clone().invert());let best=Infinity;for(let i=0;i<=200;i++){const d=conveyor.curve.getPointAt(i/200).distanceToSquared(p);if(d<best){best=d;u=i/200;}}}return {hit,local:hit.point.clone().applyMatrix4(m.invert()),conveyor,u};}
  function carry(a,dt){if(!visible(a.hit.object))return null;if(a.conveyor){a.u+=a.conveyor.speed()*dt/a.conveyor.length;if(a.u>1)return null;a.local.copy(a.conveyor.curve.getPointAt(a.u));}return a.local.clone().applyMatrix4(objectMatrix(a.hit));}
  return {support,sweep,normal,isWater,anchor,carry};
}
