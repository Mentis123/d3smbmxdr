import * as THREE from 'three';
import {createMiningScene} from './mining-scene.js';
import {makeBatch,metal} from './builder-utils.js';
import {createWaterMaterial} from './water.js';
import {applyAtmosphere} from './atmosphere.js';
import {PLACES,WORLD_VIEWS,WORLD_SEED} from './mining-region-layout.js';
export {WORLD_VIEWS,WORLD_SEED};
export function createWorld(){
 const w=createMiningScene(),{root}=w;
 const mine=new THREE.Group();mine.name='regional-mine';
 for(const c of [...root.children]){if(c.name==='plinth'||c.isLineLoop)c.visible=false;mine.add(c);}
 root.add(mine);mine.scale.setScalar(.59);mine.position.set(-7,-.4,0);
 applyAtmosphere(w,'dusk',{fogDensity:.004,preset:{zenith:[.06,.13,.23],upper:[.14,.24,.34],horizon:[.36,.37,.34],glow:[.8,.4,.15],stars:0,clouds:.35,key:{color:[1,.84,.64],intensity:3,position:[-9,17,10]},hemi:{sky:[.55,.68,.8],ground:[.18,.14,.1],intensity:1.2},environmentIntensity:.6}});
 const b=makeBatch(root,'region'),earth=metal(0x74644c,.98,0),concrete=metal(0x8c8b7b,.9,0),steel=metal(0x536575,.55,.4),dark=metal(0x263843,.85,.1),yellow=metal(0xc99b3e,.8,.1),green=metal(0x415549,1,0),light=metal(0xb8c4c7,.55,.2);
 b.box(0,-.75,-1,31,.9,25,earth);b.box(5,-.05,4,10,.5,8,concrete);b.box(8,-.05,-6.5,10,.5,8,concrete);
 // Roads connect places; rail independently serves the terminal.
 b.box(-1,.015,7,27,.04,.65,dark);b.box(0,.015,1, .65,.04,12,dark);b.box(8,.015,-1,.65,.04,10,dark);
 for(let i=0;i<45;i++){b.box(-14+i*.6,.045,7,.22,.025,.035,yellow);b.box(-13+i*.58,.12,-3,.05,.12,1.1,earth);}
 for(const z of [-3.45,-2.65])b.box(-.2,.22,z,27,.06,.045,steel);
 function shed(x,z,ww,dd){b.box(x,1,z,ww,1.6,dd,light);b.box(x,1.88,z,ww+.15,.16,dd+.15,dark);for(let j=0;j<ww;j++)b.box(x-ww/2+.35+j,1.2,z+dd/2+.01,.48,.45,.025,steel);}
 shed(3,4,3,3);shed(7,3.7,3,3);shed(5,6.7,2.5,1.5);shed(11,-4.7,2,1.7);
 // Dispatch staging, pallet stacks, pipe racks, fencing and yard lights are batched.
 for(let i=0;i<18;i++){const x=1+i%6*.5,z=1.2+Math.floor(i/6)*.55;b.box(x,.36,z,.38,.45,.4,i%2?earth:yellow);}
 for(let i=0;i<8;i++){b.cylinder(8.6+i*.17,.43,5,.065,.065,.65,steel,8);}
 for(let i=0;i<24;i++){const x=-1+i*.48;b.box(x,.45,8,.025,.9,.025,steel);b.box(x,.6,8,.45,.025,.025,steel);}
 for(const [x,z] of [[1,7],[8,7],[10,-3],[4,-3],[-2,7],[-12,7]]){b.box(x,1.3,z,.05,2.6,.05,steel);b.box(x,2.6,z,.36,.08,.15,yellow);}
 // Stockpiles and a bulk conveyor/shiploader, purpose-built for this scene.
 for(let i=0;i<4;i++)b.cylinder(3.5+i*1.5,.7,-7,.05,.85,1.4,dark,16);
 b.box(7,1.6,-7,8,.15,.42,steel);for(const x of [3,5,7,9,11]){b.beam([x,0,-7],[x,1.5,-7],.06,steel);}
 b.box(9.5,.12,-10,6,.25,1.2,concrete);b.beam([9,0,-9],[9,3.6,-9],.13,yellow);b.beam([9,3.6,-9],[10,2,-11.5],.11,yellow);b.beam([9,1.4,-9],[10,2,-11.5],.12,steel);
 const water=createWaterMaterial(0,w.scene.environment),sea=new THREE.Mesh(new THREE.PlaneGeometry(30,5).rotateX(-Math.PI/2),water);sea.position.set(0,-.12,-11);root.add(sea);w.updates.push(t=>water.uniforms.uTime.value=t);
 const ship=new THREE.Group();ship.name='bulk-carrier';ship.position.set(9,.05,-11.7);root.add(ship);const sb=makeBatch(ship,'ship');sb.box(0,.2,0,5.5,.7,1.1,dark);sb.box(0,.61,0,5,.14,1.12,steel);for(let i=0;i<4;i++)sb.box(-1.5+i, .74,0,.7,.15,.8,earth);sb.box(2,1,0,.75,.9,.9,light);sb.box(2,1.55,0,.8,.2,.95,dark);sb.finish();
 // Ridges and vegetation frame the region; repeated trees use instancing.
 for(let i=0;i<15;i++){const g=new THREE.ConeGeometry(2.5+(i%3),2+i%4,5);g.translate(-18+i*2.6,.1,-13.5);b.geometry(g,earth);}
 const trees=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.35,1),green,100),dummy=new THREE.Object3D();
 for(let i=0;i<100;i++){const x=-14+(i*7.73%28),z=9+(i*1.31%2.4);dummy.position.set(x,.55,z);dummy.scale.set(.7+(i%3)*.2,1.3,1);dummy.updateMatrix();trees.setMatrixAt(i,dummy.matrix);b.cylinder(x,.2,z,.04,.06,.5,earth,5);}root.add(trees);
 // Workload cabinet, order assembly and endpoint light respond to exhibit/decision state.
 const actors={};function marker(id,x,z){const g=new THREE.Group();g.position.set(x,.3,z);const mat=new THREE.MeshStandardMaterial({color:0x48d1c2,emissive:0x145d52,roughness:.4});const m=new THREE.Mesh(new THREE.BoxGeometry(.55,.85,.45),mat);m.position.y=.4;g.add(m);root.add(g);actors[id]=g;return g;}
 marker('operations',-1.5,2.6);marker('engineering',4,3);marker('terminal',11,-4);
 // Secondary operation across the ridge: explicit service rooms and a shared business link.
 shed(-11,-5.5,2,1.3);b.beam([-11,.7,-5.5],[-1.5,.7,2.6],.025,steel);
 // A small rail consist and service vehicle use existing deterministic actor conventions.
 const train=new THREE.Group();root.add(train);const tb=makeBatch(train,'rail');for(let i=0;i<5;i++){tb.box(i*.85,.45,-3,.72,.4,.6,i?earth:yellow);tb.box(i*.85,.22,-3,.8,.12,.65,dark);}tb.finish();
 const van=new THREE.Group();root.add(van);const vb=makeBatch(van,'service');vb.box(0,.25,0,.65,.4,.32,light);vb.box(.15,.5,0,.3,.18,.28,dark);vb.finish();
 const workloadLights=[];
 for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.15,.12,.06),new THREE.MeshStandardMaterial({color:0x65e5ba,emissive:0x175940}));m.position.set(-1.5,.5+i*.2,2.84);root.add(m);workloadLights.push(m);}
 const link=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,6),new THREE.MeshStandardMaterial({color:0x56d5d0,emissive:0x145c64}));const a=new THREE.Vector3(-11,.9,-5.5),end=new THREE.Vector3(-1.5,.9,2.6),delta=end.clone().sub(a);link.scale.y=delta.length();link.position.copy(a.add(end).multiplyScalar(.5));link.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());root.add(link);
 let story=null,step=0;
 w.setStory=(id,s=0)=>{story=id;step=s;return id||'hero';};
 w.updates.push(t=>{train.position.x=-12+(t*.25%18);van.position.set(-10+(t*.35%20),.05,7);ship.position.y=.05+Math.sin(t*.5)*.025;
  for(const [id,g]of Object.entries(actors)){const active=story===id;g.children[0].material.color.setHex(active&&step===5?0xe8a94f:active?0x4ce0c1:0x709a9d);g.children[0].material.emissive.setHex(active?0x174b40:0x000000);}
  actors.engineering.position.x=story==='engineering'&&step>=2&&step!==5?6.8:4;
  workloadLights.forEach((m,i)=>{const held=story==='operations'&&(step===5||step===4&&i===2);m.material.color.setHex(held?0xe3a04c:0x65e5ba);m.material.emissive.setHex(held?0x5e2600:0x175940);});
  link.visible=!(story==='operations'&&step>=4);
  actors.terminal.children[0].material.color.setHex(story==='terminal'&&step===4?0x46627e:story==='terminal'&&step>=1?0xe8a94f:0x709a9d);
 });
 b.finish();w.navigationBounds={target:{x:[-16,16],z:[-14,11],y:[-1,10]},flight:{x:[-22,22],z:[-20,16]},ceiling:24};
 w.hotspots=Object.entries(PLACES).map(([id,p])=>({id,label:{operations:'Mine',engineering:'Engineering',terminal:'Terminal'}[id],caption:'Explore '+id,view:id,anchor:new THREE.Vector3(p.x,2.2,p.z)}));
 w.stats.world='mining-region';w.stats.destinations=3;w.height=()=>0;return w;
}
