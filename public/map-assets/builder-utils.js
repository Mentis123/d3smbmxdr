import * as THREE from 'three';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';
export function makeBatch(root,prefix='detail'){
  const buckets=new Map(),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);let pieces=0;
  function add(g,mat,x=0,y=0,z=0,rotation=null){dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.quaternion.identity();if(rotation)dummy.quaternion.copy(rotation);dummy.scale.set(1,1,1);dummy.updateMatrix();g.applyMatrix4(dummy.matrix);g.deleteAttribute('uv');if(!buckets.has(mat))buckets.set(mat,[]);buckets.get(mat).push(g);pieces++;}
  return{
    box(x,y,z,w,h,d,mat){add(new THREE.BoxGeometry(w,h,d),mat,x,y,z);},
    cylinder(x,y,z,rt,rb,h,mat,segments=16){add(new THREE.CylinderGeometry(rt,rb,h,segments),mat,x,y,z);},
    beam(a,b,r,mat,sides=6){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);if(delta.length()<1e-5)return;const q=new THREE.Quaternion().setFromUnitVectors(up,delta.clone().normalize()),p=av.add(bv).multiplyScalar(.5);add(new THREE.CylinderGeometry(r,r,delta.length(),sides),mat,p.x,p.y,p.z,q);},
    geometry(g,mat){add(g,mat);},
    finish(){let count=0;for(const[mat,gs]of buckets){const geometry=mergeGeometries(gs,false);if(!geometry)throw Error('Incompatible batch '+prefix);const m=new THREE.Mesh(geometry,mat);m.name=prefix+'-'+count++;m.castShadow=m.receiveShadow=true;root.add(m);gs.forEach(g=>g.dispose());}buckets.clear();return {pieces,batches:count};}
  };
}
export function metal(color=0x8c9ba3,roughness=.45,metalness=.65){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
// One 3 m saw-cut concrete slab panel as a repeating canvas texture (no image asset). Used for structural floors.
export function slabTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const g=canvas.getContext('2d');
  g.fillStyle='#58636b';g.fillRect(0,0,512,512);
  for(let i=0;i<90;i++){g.fillStyle=i%2?'rgba(255,255,255,0.025)':'rgba(0,0,0,0.04)';g.fillRect((i*97)%512,(i*181)%512,40+(i%5)*18,30+(i%4)*14);}
  g.strokeStyle='#2e363c';g.lineWidth=5;g.strokeRect(2,2,508,508);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;return texture;
}
