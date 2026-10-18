import * as THREE from 'three';
import {random} from './scene.js';

// Dense needle clusters sit on radial branch cards around a closed, tapered core.
// This is foliage surface geometry, not a camera-facing full-tree billboard.
export function createFirGeometry(texture){
  const rng=random(19813),p=[],uv=[],normals=[],idx=[];
  for(let tier=0;tier<10;tier++)for(let branch=0;branch<6;branch++){
    const t=tier/10,a=branch*Math.PI/3+tier*2.399+(rng()-.5)*.32;
    const reach=.54*Math.pow(1-t,.78)*(.85+rng()*.25),y=.13+t*1.08;
    const radial=new THREE.Vector3(Math.cos(a),0,Math.sin(a)),side=new THREE.Vector3(-Math.sin(a),0,Math.cos(a));
    // Two sloping needle planes create a bough with visible depth from above/side.
    for(let face=0;face<2;face++){
      const n=p.length/3,center=new THREE.Vector3(0,y,0),width=reach*.85;
      const wing=side.clone().multiplyScalar(width*.5);if(face)wing.y=reach*.27;
      const length=radial.clone().multiplyScalar(reach);length.y=reach*(face?-.08:.23);
      const normal=new THREE.Vector3().crossVectors(wing,length).normalize();if(normal.y<0)normal.negate();normal.lerp(new THREE.Vector3(0,1,0),.45).normalize();
      for(const [u,v]of [[0,0],[1,0],[0,1],[1,1]]){const q=center.clone().addScaledVector(wing,u*2-1).addScaledVector(length,v);p.push(q.x,q.y,q.z);uv.push(branch%2?1-u:u,v);normals.push(normal.x,normal.y,normal.z);}
      idx.push(n,n+2,n+1,n+1,n+2,n+3);
    }
  }
  const needles=new THREE.BufferGeometry();needles.setAttribute('position',new THREE.Float32BufferAttribute(p,3));needles.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));needles.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));needles.setIndex(idx);needles.computeBoundingSphere();
  const needleMaterial=new THREE.MeshStandardMaterial({map:texture,color:0xffffff,alphaTest:.43,alphaToCoverage:true,side:THREE.DoubleSide,roughness:.94,metalness:0});
  needleMaterial.color.setRGB(1.45,1.85,1.35);
  // Subtle transmission avoids black paper undersides while preserving needles.
  needleMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight += diffuseColor.rgb * 0.12;\n#include <opaque_fragment>');};
  const core=new THREE.CylinderGeometry(.012,.23,1.12,11,9);core.translate(0,.69,0);
  const cp=core.attributes.position;for(let i=0;i<cp.count;i++){const x=cp.getX(i),z=cp.getZ(i),y=cp.getY(i),k=.90+.12*Math.sin(y*72+Math.atan2(z,x)*7);cp.setXYZ(i,x*k,y,z*k);}core.computeVertexNormals();
  const coreMaterial=new THREE.MeshStandardMaterial({color:0x263b24,roughness:1});
  return{needles,needleMaterial,core,coreMaterial,tiers:10,boughs:60,triangles:idx.length/3};
}
