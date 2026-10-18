import * as THREE from 'three';
import {makeBatch,metal} from './builder-utils.js';
import {buildElectrical} from './electrical.js';
import {buildTanks} from './tanks.js';
import {MINE} from './mining-layout.js';

export function buildMiningSite(world){
  const {root}=world;
  // Adapt the proven energy kits through a local group, preserving their
  // geometry/material/animation contracts without mutating energy's layout.
  const power=new THREE.Group();power.name='mining-site-power';root.add(power);
  power.scale.setScalar(.6);power.position.set(MINE.power[0]-.6*7.3,2.25-.6*1.9,MINE.power[2]+.6*.65);
  const powerKit={...world,root:power,stats:{},height:()=>1.88};buildElectrical(powerKit);
  const water=new THREE.Group();water.name='mining-site-water';root.add(water);
  water.scale.setScalar(.45);water.position.set(2.5-.45*3.6,2.25-.45*1.91,4.8-.45*1.5);
  const waterKit={...world,root:water,stats:{}};buildTanks(waterKit);
  const asphalt=metal(0x353d3d,.98,0),concrete=metal(0x7c7d72,.95,0),steel=metal(0x6e7f85,.65,.5),yellow=metal(0xd2af50,.75,.15),scrubMat=metal(0x535741,1,0);
  const warm=new THREE.MeshStandardMaterial({color:0xffdfa0,emissive:0xffb54f,emissiveIntensity:1.6});
  const batch=makeBatch(root,'mining-site-details');
  function road(points,width=.5){
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,2.29,z)),false,'centripetal'),p=[],ix=[];
    for(let i=0;i<=100;i++){const a=curve.getPointAt(i/100),v=curve.getTangentAt(i/100),side=new THREE.Vector3(-v.z,0,v.x).normalize().multiplyScalar(width/2);for(const sign of [-1,1])p.push(a.x+side.x*sign,a.y,a.z+side.z*sign);if(i<100){const j=i*2;ix.push(j,j+1,j+2,j+1,j+3,j+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();const mesh=new THREE.Mesh(g,asphalt);mesh.name='mining-service-road';mesh.receiveShadow=true;root.add(mesh);
  }
  road([[2.3,-4.55],[2.2,-3.3],[2.2,1.2],[3.8,2.9],[4,5.35],[7.5,5.35],[9.25,4.6],[9.25,-3.4],[8.4,-4.2]],.5);
  road([[4.3,4.95],[4.4,5.3],[6.6,5.3],[6.7,4.95]],.42);
  road([[2.1,5.7],[2.1,6.4],[5.5,6.4],[5.5,5.35]],.42);
  // Work pads and tanks get visible pipe connections instead of floating icons.
  batch.box(2.5,2.27,4.8,2.9,.05,2.7,concrete);
  for(const [a,b] of [[ [3.1,2.48,4.8],[3.5,2.48,3.8] ],[[3.5,2.48,3.8],[5.0,2.48,2.7]],[[5,2.48,2.7],[5.1,2.48,.8]]])batch.beam(a,b,.035,steel,10);
  for(const [x,z] of [[3.5,3.8],[5,2.7]]){
    batch.box(x,2.36,z,.35,.18,.25,steel);batch.cylinder(x,2.52,z,.065,.065,.15,yellow,12);
  }
  for(const [x,z] of [[1.8,-4.8],[2,-2],[2.1,1.5],[3.8,3],[4,5.7],[7,5.7],[9.4,4.6],[9.4,1.7],[9.4,-1.5],[9.4,-4],[6.8,-6.8]]){
    batch.cylinder(x,2.31,z,.09,.11,.12,concrete,10);batch.beam([x,2.3,z],[x,3.45,z],.018,steel,8);batch.box(x,3.48,z,.19,.055,.13,warm);
  }
  // Yard fence; the front access is deliberately open at the workshop road.
  for(let i=0;i<=40;i++){
    const x=-9.7+i*.48;batch.beam([x,world.height(x,6.9),6.9],[x,world.height(x,6.9)+.3,6.9],.009,steel,5);
    if(i<40&&!(x>3.7&&x<6.2))for(const dy of [.12,.26])batch.beam([x,world.height(x,6.9)+dy,6.9],[x+.48,world.height(x+.48,6.9)+dy,6.9],.005,steel,5);
  }
  batch.finish();
  const scrub=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.085,0),scrubMat,110),dummy=new THREE.Object3D();scrub.name='mining-native-scrub';let n=0;
  for(let i=0;n<110&&i<3000;i++){
    const hash=k=>{const v=Math.sin(k*127.1+91.7)*43758.5453;return v-Math.floor(v);};
    const x=-9.5+hash(i*3)*9.9,z=-7.4+hash(i*3+1)*14;
    if(Math.hypot((x+3.8)/4.7,(z+1)/4.2)<1.13)continue;
    dummy.position.set(x,world.height(x,z)+.035,z);dummy.scale.set(.7+hash(i*3+2),.6,1);dummy.rotation.y=i;dummy.updateMatrix();scrub.setMatrixAt(n++,dummy.matrix);
  }scrub.count=n;scrub.castShadow=true;root.add(scrub);
  world.siteKitDiagnostics=()=>({power:{scale:.6,position:power.position.toArray(),transformers:powerKit.stats.electrical.transformers,pylons:powerKit.stats.electrical.pylons},water:{scale:.45,position:water.position.toArray(),basins:waterKit.tankGeometryDiagnostics.basinCount,armAngles:['west','north','south'].map(id=>water.getObjectByName('treatment-arm-'+id).rotation.y)},scrub:n});
  world.stats.waterBasins=3;world.stats.transformers=3;
}
