import * as THREE from 'three';
import {makeBatch,metal} from './builder-utils.js';
import {MINE} from './mining-layout.js';

export function buildMiningPlant(world){
  const {root,updates}=world;
  const concrete=metal(0x6f7169,.95,0),steel=metal(0x7e8c8e,.52,.65),dark=metal(0x26343b,.78,.3),paint=metal(0x47636a,.6,.35),yellow=metal(0xd7a93f,.55,.2),ore=metal(0x847260,1,0);
  const lamp=new THREE.MeshStandardMaterial({color:0xffe0a5,emissive:0xffb250,emissiveIntensity:1.8});
  const crusher=new THREE.Group();crusher.name='mining-primary-crusher';root.add(crusher);
  const cb=makeBatch(crusher,'crusher');
  cb.box(4.05,2.3,-4.35,1.3,.12,1.5,concrete);
  // Receiving hopper is open, with four sloping steel walls and a recessed throat.
  const outer=[[3.53,2.76,-4.91],[4.58,2.76,-4.91],[4.58,2.76,-3.79],[3.53,2.76,-3.79]],inner=[[3.84,2.41,-4.64],[4.27,2.41,-4.64],[4.27,2.41,-4.06],[3.84,2.41,-4.06]];
  for(let i=0;i<4;i++){
    const j=(i+1)%4,p=[...outer[i],...inner[i],...outer[j],...outer[j],...inner[i],...inner[j]];
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();
    const mat=steel.clone();mat.side=THREE.DoubleSide;const mesh=new THREE.Mesh(g,mat);mesh.castShadow=true;crusher.add(mesh);
    cb.beam(outer[i],outer[j],.028,yellow,6);
  }
  cb.box(4.05,2.395,-4.35,.42,.035,.57,dark);
  for(const z of [-5.02,-3.68]){cb.box(3.48,2.52,z,.13,.46,.13,yellow);cb.beam([3.4,2.7,z],[4.7,2.7,z],.015,yellow,6);}
  cb.box(4.58,2.62,-4.35,.44,.55,.9,paint);for(let i=0;i<7;i++)cb.box(4.81,2.43+i*.055,-4.35,.015,.018,.68,dark);
  cb.cylinder(4.57,2.99,-4.35,.14,.14,.16,steel,18);
  cb.box(4.05,3.24,-5.05,1.35,.045,.5,steel);
  for(const x of [3.45,4.65])cb.beam([x,2.28,-5.05],[x,3.23,-5.05],.024,steel,6);
  cb.box(4.08,3.28,-5.05,.45,.03,.33,lamp);cb.finish();

  const plant=new THREE.Group();plant.name='mining-processing-plant';root.add(plant);
  const pb=makeBatch(plant,'processing');pb.box(6.65,2.28,-.85,3.7,.09,3.25,concrete);
  for(const x of [5.05,8.25])for(const z of [-2.25,.55]){
    pb.beam([x,2.3,z],[x,4.55,z],.045,steel,6);
    pb.beam([x,2.3,z],[x===5.05?8.25:5.05,3.65,z],.022,steel,6);
  }
  for(const y of [3.65,4.5]){
    for(const z of [-2.25,.55])pb.beam([5.05,y,z],[8.25,y,z],.055,steel,6);
    for(const x of [5.05,8.25])pb.beam([x,y,-2.25],[x,y,.55],.055,steel,6);
  }
  pb.box(6.7,3.92,-1.4,1.8,.65,1.15,paint);pb.box(6.7,4.28,-1.4,1.95,.07,1.25,steel);
  for(let i=0;i<14;i++)pb.box(5.85+i*.13,4.34,-1.4,.025,.035,1.2,steel);
  for(let i=0;i<8;i++)pb.box(6.7,3.72+i*.062,-.815,1.52,.022,.014,dark);
  // Narrow catwalks leave the equipment visible beneath the screen deck.
  for(const z of [-2.2,.5]){
    pb.box(6.65,3.65,z,3.5,.04,.3,steel);
    for(let i=0;i<10;i++)pb.beam([5.1+i*.34,3.65,z+.13],[5.1+i*.34,4.02,z+.13],.012,yellow,6);
    pb.beam([5.05,4.02,z+.13],[8.25,4.02,z+.13],.012,yellow,6);
  }
  for(let i=0;i<14;i++)pb.box(8.5,2.35+i*.095,.7-i*.12,.45,.035,.13,steel);
  pb.beam([8.73,2.5,.75],[8.73,3.9,-.9],.014,yellow,6);
  // Silo pair, ring bands and ladders.
  for(const z of [-.55,.35]){
    pb.cylinder(7.65,3.25,z,.35,.35,1.75,paint,26);
    pb.cylinder(7.65,4.18,z,.04,.36,.15,steel,26);
    for(const y of [2.47,2.8,3.3,3.8,4.1])pb.cylinder(7.65,y,z,.365,.365,.025,steel,26);
    for(let i=0;i<16;i++)pb.box(8.02,2.45+i*.1,z,.018,.018,.19,yellow);
    for(const off of [-.1,.1])pb.beam([8.02,2.4,z+off],[8.02,4.18,z+off],.009,steel,6);
  }
  const mills=[];
  for(const z of [-.45,.48]){
    const drum=new THREE.Group();drum.name='mining-mill-drum';drum.position.set(6.2,2.95,z);plant.add(drum);
    const shell=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,1.25,24),paint);shell.rotation.z=Math.PI/2;shell.castShadow=true;drum.add(shell);
    for(const x of [-.48,0,.48]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.325,.026,6,24),steel);ring.rotation.y=Math.PI/2;ring.position.x=x;drum.add(ring);}
    for(let i=0;i<8;i++){const a=i*Math.PI/4,m=new THREE.Mesh(new THREE.BoxGeometry(1.1,.022,.035),yellow);m.position.set(0,Math.sin(a)*.325,Math.cos(a)*.325);m.rotation.x=-a;drum.add(m);}
    for(const x of [5.75,6.65])pb.box(x,2.45,z,.22,.32,.5,concrete);
    mills.push(drum);
  }
  pb.finish();updates.push(t=>mills.forEach((m,i)=>{m.rotation.x=t*(.42+i*.08);}));

  const stockpile=new THREE.Mesh(new THREE.ConeGeometry(1.0,.95,36,6),ore);stockpile.name='mining-product-stockpile';stockpile.position.set(5.3,2.725,1.8);stockpile.scale.z=.78;stockpile.castShadow=stockpile.receiveShadow=true;root.add(stockpile);
  const cv=document.createElement('canvas');cv.width=128;cv.height=32;const ctx=cv.getContext('2d');ctx.fillStyle='#232927';ctx.fillRect(0,0,128,32);for(let i=0;i<128;i+=16){ctx.fillStyle='#56605a';ctx.fillRect(i,0,2,32);ctx.fillStyle='#303631';ctx.fillRect(i+2,0,10,32);}
  const beltTexture=new THREE.CanvasTexture(cv);beltTexture.wrapS=beltTexture.wrapT=THREE.RepeatWrapping;beltTexture.colorSpace=THREE.SRGBColorSpace;world.extraTextures.push(beltTexture);
  const beltMaterial=new THREE.MeshStandardMaterial({map:beltTexture,roughness:.92});
  let labStopped=false,conveyorTime=0,lastWorldTime=0;
  // Optional Lab fixture state only. Normal Worlds retains absolute-time seeking.
  world.setIllustratedConveyorRunning=running=>{labStopped=running===false;};
  updates.push(t=>{if(!labStopped)conveyorTime+=t-lastWorldTime;lastWorldTime=t;});
  const conveyors=[];
  function conveyor(id,points,width=.34){
    const group=new THREE.Group();group.name=id;root.add(group);
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    const length=curve.getLength(),positions=[],uv=[],indices=[],batch=makeBatch(group,id+'-frame');
    for(let i=0;i<=80;i++){
      const u=i/80,p=curve.getPointAt(u),v=curve.getTangentAt(u),side=new THREE.Vector3(-v.z,0,v.x).normalize();
      for(const sign of [-1,1]){positions.push(p.x+side.x*width/2*sign,p.y,p.z+side.z*width/2*sign);uv.push(u*length*3,(sign+1)/2);}
      if(i<80){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
      if(i%8===0){
        for(const sign of [-1,1]){
          const x=p.x+side.x*(width/2+.08)*sign,z=p.z+side.z*(width/2+.08)*sign;
          batch.beam([x,2.25,z],[x,p.y+.13,z],.018,steel,6);
          if(i<80){const next=curve.getPointAt(Math.min(1,u+.1));batch.beam([x,p.y+.13,z],[next.x+side.x*(width/2+.08)*sign,next.y+.13,next.z+side.z*(width/2+.08)*sign],.012,yellow,6);batch.beam([x,2.3,z],[next.x+side.x*(width/2+.08)*sign,next.y-.06,next.z+side.z*(width/2+.08)*sign],.012,steel,6);}
        }
        batch.beam([p.x-side.x*width/2,p.y-.025,p.z-side.z*width/2],[p.x+side.x*width/2,p.y-.025,p.z+side.z*width/2],.035,dark,10);
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const belt=new THREE.Mesh(g,beltMaterial);belt.name=id+'-moving-belt';belt.receiveShadow=true;belt.userData.birbConveyor={curve,length,speed:()=>labStopped?0:.32};group.add(belt);batch.finish();
    const particles=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.032,0),ore,80);particles.name=id+'-moving-ore';particles.castShadow=true;group.add(particles);
    const dummy=new THREE.Object3D();updates.push(()=>{const t=conveyorTime;
      for(let i=0;i<80;i++){
        const u=((i/80+t*.32/length)%1+1)%1,p=curve.getPointAt(u),v=curve.getTangentAt(u),side=new THREE.Vector3(-v.z,0,v.x).normalize();
        dummy.position.copy(p).addScaledVector(side,((i*17)%7-3)*.025);dummy.position.y+=.032;dummy.rotation.set(i*.4,i*.7+t*.03,i*.23);dummy.scale.set(1+(i%3)*.15,.65,1);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);
      }particles.instanceMatrix.needsUpdate=true;
    });
    conveyors.push({id,curve,length,particles,from:points[0],to:points.at(-1),width});
  }
  conveyor('mining-overland-conveyor',[[4.15,2.54,-4.35],[4.7,3.35,-3.3],[5.55,3.84,-2.2],[6.4,3.92,-1.5]]);
  conveyor('mining-product-conveyor',[[6.5,3.88,-.4],[6,3.9,.65],[5.3,3.75,1.8]]);
  updates.push(()=>{beltTexture.offset.x=-conveyorTime*.96;});
  world.plantDiagnostics=()=>({conveyorsRunning:!labStopped,conveyorTime,mills:mills.map(m=>m.rotation.x),stockpile:stockpile.position.toArray(),conveyors:conveyors.map(c=>{const m=new THREE.Matrix4();c.particles.getMatrixAt(0,m);return{id:c.id,length:c.length,from:c.from,to:c.to,width:c.width,orePosition:new THREE.Vector3().setFromMatrixPosition(m).toArray(),particleCount:c.particles.count,beltOffset:beltTexture.offset.x};})});
  world.stats.conveyors=conveyors.length;world.stats.mills=mills.length;
}
