import * as THREE from 'three';
import {createWorldShell} from './world-shell.js';
import {makeBatch,metal} from './builder-utils.js';
import {MINE} from './mining-layout.js';
import {buildMiningHaulage} from './mining-vehicles.js';
import {buildMiningLoader} from './mining-loader.js';
import {buildMiningPlant} from './mining-plant.js';
import {buildMiningBuildings} from './mining-buildings.js';
import {buildMiningSite} from './mining-site.js';

export function createMiningScene(){
  const world=createWorldShell(181026),{root,updates}=world;
  world.key.color.set(0xffe4bb);world.key.intensity=3;
  root.getObjectByName('plinth').position.y=-.7;root.children.find(o=>o.isLineLoop).position.y=-.7;
  const pit=MINE.pit,points=[];
  for(let i=0;i<=100;i++){
    const t=i/100,r=.26+.84*t,a=-.8+Math.PI*2*t;
    points.push(new THREE.Vector3(pit.x+pit.rx*r*Math.cos(a),pit.floor+2.5*t+.055,pit.z+pit.rz*r*Math.sin(a)));
  }
  points.push(new THREE.Vector3(1.5,2.305,-4.45),new THREE.Vector3(...MINE.crusher));
  world.haulRoute=new THREE.CatmullRomCurve3(points,false,'centripetal');world.haulRoute.name='mining-haul-road';
  world.loadingPoint=points[0].clone();
  const samples=Array.from({length:260},(_,i)=>world.haulRoute.getPointAt(i/259));
  function rampAt(x,z){let best=Infinity,y=2.25;for(let i=0;i<samples.length-1;i++){
    const a=samples[i],b=samples[i+1],dx=b.x-a.x,dz=b.z-a.z;
    const t=THREE.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
    const d=Math.hypot(x-a.x-t*dx,z-a.z-t*dz);if(d<best){best=d;y=THREE.MathUtils.lerp(a.y,b.y,t)-.05;}
  }return{distance:best,y};}
  function height(x,z){
    const r=Math.hypot((x-pit.x)/pit.rx,(z-pit.z)/pit.rz);
    const radial=THREE.MathUtils.clamp((r-.24)/.76,0,1),step=Math.floor(radial*pit.benches)/pit.benches;
    let y=pit.floor+(pit.top-pit.floor)*step;
    if(r>=1)y=pit.top+.035*Math.sin(x*1.8)*Math.sin(z*.9);
    else y+=.025*Math.sin(x*7+z*3)*Math.sin(z*5);
    const ramp=rampAt(x,z),blend=1-THREE.MathUtils.smoothstep(ramp.distance,.61,.91);
    y=THREE.MathUtils.lerp(y,ramp.y,blend);
    // East-side infrastructure sits on a finished plateau.
    if(x>1.45)y=pit.top;
    return y;
  }
  world.height=height;
  const g=new THREE.PlaneGeometry(20,15.4,230,180);g.rotateX(-Math.PI/2);g.translate(0,0,-.4);
  const p=g.attributes.position,colors=[],color=new THREE.Color();
  for(let i=0;i<p.count;i++){
    const bx=p.getX(i),bz=p.getZ(i),x=bx+.14*Math.sin(bz*1.9)*Math.pow(Math.abs(bx)/10,10),z=bz+.12*Math.sin(bx*1.4)*Math.pow(Math.abs(bz+.4)/7.7,10),y=height(x,z);p.setXYZ(i,x,y,z);
    const hash=Math.sin(x*127.1+z*311.7)*43758.5453,noise=.88+.12*(hash-Math.floor(hash)),layer=Math.floor((y+.25)/.35)%3;
    color.setHex([0x887159,0x9d866b,0x6f6559][Math.abs(layer)]).multiplyScalar(noise);colors.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  const ground=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96}));ground.name='mining-open-pit';ground.receiveShadow=true;ground.castShadow=true;root.add(ground);
  // Close the island side walls to the tabletop; no room shows through the pit.
  const edges=[],nx=230,nz=180;
  const edge=i=>edges.push([p.getX(i),p.getY(i),p.getZ(i)]);
  for(let x=0;x<=nx;x++)edge(x);
  for(let z=1;z<=nz;z++)edge(z*(nx+1)+nx);
  for(let x=nx-1;x>=0;x--)edge(nz*(nx+1)+x);
  for(let z=nz-1;z>0;z--)edge(z*(nx+1));
  const skirt=[],indices=[],strata=[],bands=8,clay=new THREE.Color();
  edges.forEach(([x,y,z],i)=>{
    for(let k=0;k<=bands;k++){
      skirt.push(x,THREE.MathUtils.lerp(y,-.89,k/bands),z);
      clay.setHex([0x695846,0x88715b,0x5b5147,0x786654][k%4]);strata.push(clay.r,clay.g,clay.b);
      if(k<bands){const a=i*(bands+1)+k,b=((i+1)%edges.length)*(bands+1)+k;indices.push(a,b,a+1,a+1,b,b+1);}
    }
  });
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(skirt,3));sg.setAttribute('color',new THREE.Float32BufferAttribute(strata,3));sg.setIndex(indices);sg.computeVertexNormals();
  const wall=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));wall.name='mining-island-skirt';root.add(wall);
  // Widened graded route, sampled from the exact curve the trucks follow.
  const roadPositions=[],roadIndices=[];
  for(let i=0;i<=400;i++){
    const u=i/400,c=world.haulRoute.getPointAt(u),v=world.haulRoute.getTangentAt(u),side=new THREE.Vector3(-v.z,0,v.x).normalize();
    for(const sign of [-1,1])roadPositions.push(c.x+side.x*.58*sign,c.y-.002,c.z+side.z*.58*sign);
    if(i<400){const a=i*2;roadIndices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(roadPositions,3));rg.setIndex(roadIndices);rg.computeVertexNormals();
  const road=new THREE.Mesh(rg,metal(0x4e453a,.98,0));road.name='mining-haul-road';road.receiveShadow=true;root.add(road);
  const details=makeBatch(root,'mining-pit-details'),ore=metal(0x5e5247,1,0),yellow=metal(0xe5b840,.6,.2);
  for(let i=0;i<90;i++){
    const u=(i+.5)/90,c=world.haulRoute.getPointAt(u),v=world.haulRoute.getTangentAt(u),side=new THREE.Vector3(-v.z,0,v.x).normalize();
    for(const sign of [-1,1]){const x=c.x+side.x*.66*sign,z=c.z+side.z*.66*sign;details.box(x,c.y+.065,z,.035,.13,.035,i%5?ore:yellow);}
  }
  details.finish();
  buildMiningHaulage(world);buildMiningLoader(world);
  const full=new URLSearchParams(location.search).get('stage')!=='slice';
  if(full){buildMiningPlant(world);buildMiningBuildings(world);buildMiningSite(world);}
  world.stats.stage=full?'complete-mining':'mining-slice';world.stats.world='mining';world.stats.benches=pit.benches;
  world.stats.scope=full?'Complete mining miniature: pit, haulage, crusher, conveyors, processing, workshop, control, power and water':'Terraced open pit and haulage visual slice';
  world.activityDiagnostics=t=>({...world.haulageDiagnostics(t),loader:world.loaderDiagnostics?.(),plant:world.plantDiagnostics?.()});
  world.infrastructureDiagnostics=()=>({pit,buildings:world.buildingDiagnostics?.(),kits:world.siteKitDiagnostics?.(),routeSamples:samples.map(p=>p.toArray())});
  world.audit=()=>{
    const pitFloorClearance=pit.floor-new THREE.Box3().setFromObject(root.getObjectByName('plinth')).max.y;
    const required=full?['mining-open-pit','mining-haul-road','mining-primary-crusher','mining-overland-conveyor','mining-processing-plant','mining-workshop','mining-control-room','mining-site-power','mining-site-water']:['mining-open-pit','mining-haul-road'];
    const missingObjects=required.filter(name=>!root.getObjectByName(name));
    const buildings=world.buildingDiagnostics?.()||[];
    return {pass:samples.every(p=>p.y>=height(p.x,p.z)-.02)&&pitFloorClearance>0&&missingObjects.length===0&&buildings.every(b=>Math.abs(b.baseY-2.25)<.001),pitFloorClearance,benches:pit.benches,roadSamples:samples.length,minimumRoadClearance:Math.min(...samples.map(p=>p.y-height(p.x,p.z))),missingObjects,buildings};
  };
  world.update(0,0);return world;
}
