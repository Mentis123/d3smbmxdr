import * as THREE from 'three';
import {random} from './scene.js';
import {LAYOUT,onTownTerrace} from './scene-layout.js';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';

// Instanced understory and grass. The production terrain and road meshes decide placement.
export function buildLandscapeDetails(world){
 const rng=random(181026),root=world.root,roads=[];
 for(const o of root.children.filter(o=>o.name==='service-road')){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i+=4)roads.push([p.getX(i),p.getZ(i)]);}
 const town=world.settlementDiagnostics().buildings,yard=LAYOUT.yard,pylons=world.electricalDiagnostics().pylons;
 const allowed=(x,z,y)=>{
  if(y<1.48||y>6.3||Math.abs(world.height(x+.08,z)-world.height(x-.08,z))+Math.abs(world.height(x,z+.08)-world.height(x,z-.08))>.65)return false;
  if(LAYOUT.tanks.some(t=>Math.hypot(x-t.x,z-t.z)<t.r+.20)||Math.abs(x-yard.x)<yard.w/2+.2&&Math.abs(z-yard.z)<yard.d/2+.2)return false;
  if(onTownTerrace(x,z,.06))return false;
  if(town.some(b=>x>b.bounds[0]-.16&&x<b.bounds[1]+.16&&z>b.bounds[2]-.16&&z<b.bounds[3]+.16)||pylons.some(p=>Math.abs(x-p.x)<.62&&Math.abs(z-p.z)<.62))return false;
  if(Math.abs(x-7.2)<.85&&Math.abs(z-4.35)<.60||Math.abs(x-.35)<.8&&Math.abs(z+2.35)<.5||z>-1.4&&z<.3&&x>-9&&x<1.9)return false;
  return !roads.some(p=>(p[0]-x)**2+(p[1]-z)**2<.18);
 };
 const lobes=[[-.38,.05,0],[.28,.08,.13],[0,.38,-.12],[.06,-.1,-.35]].map(([x,y,z])=>{const g=new THREE.IcosahedronGeometry(.65,0);g.translate(x,y,z);return g;});const bush=mergeGeometries(lobes);lobes.forEach(g=>g.dispose());
 const shrubMat=new THREE.MeshStandardMaterial({color:0x4c6734,roughness:1}),shrubs=new THREE.InstancedMesh(bush,shrubMat,330),d=new THREE.Object3D();let ns=0;
 const gp=[],gn=[];for(let i=0;i<5;i++){const a=i*2.399;gp.push(Math.cos(a)*.05,0,Math.sin(a)*.05,Math.cos(a+.6)*.065,0,Math.sin(a+.6)*.065,Math.cos(a)*.014,.08+i*.008,Math.sin(a)*.014);gn.push(0,1,0,0,1,0,0,1,0);}
 const grassG=new THREE.BufferGeometry();grassG.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));grassG.setAttribute('normal',new THREE.Float32BufferAttribute(gn,3));const clock={value:0};
 const grassMat=new THREE.MeshStandardMaterial({color:0x63764a,roughness:1,side:THREE.DoubleSide});grassMat.onBeforeCompile=s=>{s.uniforms.uWindTime=clock;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float uWindTime;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(uWindTime*.7+instanceMatrix[3].x*2.+instanceMatrix[3].z)*position.y*.08;');};
 const grass=new THREE.InstancedMesh(grassG,grassMat,1250);let ng=0;
 for(let i=0;i<12000&&(ng<1250||ns<330);i++){
  const x=-9.3+rng()*18.6,z=-8.65+rng()*15.9,y=world.height(x,z);if(!allowed(x,z,y))continue;
  if(ng<1250){const s=.3+rng()*.7;d.position.set(x,y+.012,z);d.rotation.set(0,rng()*6.28,0);d.scale.set(s,s*(.65+rng()*.5),s);d.updateMatrix();grass.setMatrixAt(ng,d.matrix);grass.setColorAt(ng,new THREE.Color().setHSL(.21+rng()*.08,.22,.42+rng()*.14));ng++;}
  if(ns<330&&rng()<.37){const s=.05+rng()*.10;d.position.set(x,y+s*.45,z);d.rotation.set(rng()*.4,rng()*6.28,rng()*.3);d.scale.set(s*(1+rng()),s*.65,s);d.updateMatrix();shrubs.setMatrixAt(ns,d.matrix);shrubs.setColorAt(ns,new THREE.Color().setHSL(.23+rng()*.09,.25+rng()*.12,.29+rng()*.13));ns++;}
 }
 shrubs.count=ns;grass.count=ng;shrubs.name='understory-shrubs';grass.name='ground-grass-tufts';shrubs.castShadow=shrubs.receiveShadow=grass.receiveShadow=true;root.add(shrubs,grass);world.updates.push(t=>{clock.value=t;});
 world.stats.landscape={shrubs:ns,grassTufts:ng,roadSamples:roads.length};
}
