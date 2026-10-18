import * as THREE from 'three';

// Isolated, deterministic museum exhibits. Shares the world's WebGL renderer, never its resources.
export function createExhibit(id, host, notify) {
  if(!['mining.conveyor-vision','energy.intake-vision'].includes(id))throw Error('Unsupported exhibit');
  const mining=id.startsWith('mining'),scene=new THREE.Scene();scene.background=new THREE.Color(0x071322);
  scene.fog=new THREE.Fog(0x071322,18,38);
  const root=new THREE.Group();scene.add(root);
  const camera=new THREE.PerspectiveCamera(38,1,.05,60),target=new THREE.Vector3(0,1,0);
  const materials=[],geometries=[],textures=[];
  const mat=(color,opts={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.65,...opts});materials.push(m);return m;};
  const steel=mat(0x8899a3,{metalness:.75,roughness:.32}),dark=mat(0x223540,{metalness:.6}),yellow=mat(0xdca644),rubber=mat(0x1d252a),ore=mat(0x8a7560),cyan=mat(0x32c9f2,{emissive:0x008cb0,emissiveIntensity:.45}),amber=mat(0xffc36b,{emissive:0xd77517,emissiveIntensity:.5});
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const n=Math.sin(x*127.1+y*311.7)*43758.5453,v=115+Math.floor((n-Math.floor(n))*35);ctx.fillStyle=`rgb(${v},${v+3},${v+4})`;ctx.fillRect(x,y,1,1);}
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
  const concrete=mat(0xb5bec1,{map:texture,roughness:.96});
  function mesh(g,m,x=0,y=0,z=0){geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
  const box=(w,h,d,m,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const cylinder=(r,len,m,x,y,z)=>mesh(new THREE.CylinderGeometry(r,r,len,16),m,x,y,z);
  function bar(a,b,r,m){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),o=cylinder(r,av.distanceTo(bv),m,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o;}
  scene.add(new THREE.HemisphereLight(0xbfe8ff,0x354156,2.3));
  const key=new THREE.DirectionalLight(0xffe5c0,3.6);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:20});key.shadow.normalBias=.025;scene.add(key);
  const rim=new THREE.DirectionalLight(0x37baff,2);rim.position.set(4,3,-4);scene.add(rim);
  box(7,.3,4.4,mat(0x132c3d,{metalness:.5}),0,-.2,0);
  box(6.85,.045,4.25,concrete,0,-.025,0);
  for(const z of [-2.16,2.16])box(6.8,.025,.025,cyan,0,-.06,z);
  const moving=[],pile=[],flows=[];let roller,water,outline;
  function inspectionCamera(x,y,z,look){
    bar([x,0,z],[x,y,z],.045,steel);bar([x,y,z],[x-.45,y,z],.04,steel);
    const body=box(.38,.23,.24,steel,x-.48,y,z);const lens=cylinder(.075,.08,dark,x-.48,y-.15,z);lens.rotation.x=Math.PI/2;
    bar([x-.48,y-.13,z],look,.009,cyan);
    const g=new THREE.ConeGeometry(.65,1.4,4,1,true);const m=mat(0x00aeff,{transparent:true,opacity:.065,depthWrite:false,side:THREE.DoubleSide});
    const cone=mesh(g,m,x-.48,y-.65,z);cone.rotation.z=Math.PI;return body;
  }
  if(mining){
    box(5.6,.19,1.2,dark,0,.92,0);
    box(5.65,.06,1.05,rubber,0,1.06,0);
    for(let i=0;i<11;i++){const x=-2.55+i*.51;const r=cylinder(.12,1.32,steel,x,.83,0);r.rotation.x=Math.PI/2;if(i==0)roller=r;}
    for(const x of [-2.3,-.8,.8,2.3])for(const z of [-.48,.48]){bar([x,0,z],[x,.88,z],.045,steel);box(.25,.035,.22,dark,x,.03,z);}
    for(const z of [-.66,.66]){box(5.7,.1,.07,yellow,0,1.15,z);bar([-2.35,.2,z],[2.35,.75,z],.025,dark);}
    // Feed hopper and outlet: an open taper leaves the moving material visible.
    for(const z of [-.5,.5]){const side=box(1.35,.7,.07,steel,-1.9,1.53,z);side.rotation.x=z>0?-.2:.2;}
    box(.08,.7,1.1,steel,-2.53,1.53,0);
    for(const z of [-.49,.49])box(.92,.42,.07,yellow,2.1,1.3,z);
    for(let i=0;i<28;i++){const o=mesh(new THREE.DodecahedronGeometry(.09+(i%4)*.018,0),ore);o.userData={offset:i/28,lane:Math.sin(i*4.7)*.36};o.rotation.set(i*.7,i*.3,i);moving.push(o);}
    for(let i=0;i<20;i++){const o=mesh(new THREE.DodecahedronGeometry(.12+(i%3)*.02,0),ore,1.9+Math.sin(i*2.4)*.3,1.19+Math.floor(i/5)*.11,Math.cos(i*1.7)*.34);pile.push(o);}
    inspectionCamera(.9,2.75,-.8,[1.9,1.2,0]);
    box(.65,.9,.36,dark,.1,.5,-1.25);box(.52,.6,.025,steel,.1,.53,-1.055);
    for(let i=0;i<6;i++)box(.32,.018,.018,dark,.1,.36+i*.065,-1.03);
    box(.055,.055,.025,cyan,.29,.83,-1.03);
    bar([.1,.9,-1.25],[.9,2.7,-.8],.018,dark);
    bar([2.7,0,1.3],[2.7,1.5,1.3],.045,steel);box(.75,.47,.12,dark,2.7,1.65,1.3);box(.62,.34,.015,cyan,2.7,1.65,1.37);
    outline=mesh(new THREE.TorusGeometry(.6,.018,8,64),amber,1.94,1.32,0);outline.rotation.x=-Math.PI/2;
  }else{
    // Open-sided intake chamber: opaque wall piers and rack, water outside the wall.
    box(6.5,.18,3.9,concrete,0,.08,0);
    for(const x of [-2.2,2.2])box(1.2,2.6,.7,concrete,x,1.4,-.4);
    box(5.6,.36,.8,concrete,0,2.66,-.4);
    box(3.25,.28,.7,concrete,0,.28,-.4);
    for(let i=0;i<19;i++){const x=-1.5+i/6;box(.045,2.1,.1,steel,x,1.43,.04);}
    for(const y of [.5,1.4,2.4])box(3.2,.07,.13,dark,0,y,.07);
    // Water volume is contained behind/front of the rack, solid boundaries stay opaque.
    box(5.2,1.12,1.3,mat(0x1689aa,{transparent:true,opacity:.18,depthWrite:false}),0,.9,1.1);
    const wg=new THREE.PlaneGeometry(5.2,1.4,40,20);wg.rotateX(-Math.PI/2);
    water=mesh(wg,mat(0x1b87a5,{metalness:.35,roughness:.2,transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}),0,1.5,1.1);water.castShadow=false;
    for(let i=0;i<13;i++){const o=cylinder(.038,.45+(i%4)*.15,mat(0x766044),Math.sin(i*2.4)*1.1,1.4+Math.cos(i*3.1)*.27,.24);o.rotation.set(.8,i*.7,1.1);pile.push(o);}
    for(let i=0;i<22;i++){const f=mesh(new THREE.SphereGeometry(.025,6,5),cyan);flows.push(f);}
    inspectionCamera(-2.6,2.1,.9,[0,1.5,.25]);
    box(.55,.75,.3,dark,2.4,2.55,.3);box(.42,.44,.02,cyan,2.4,2.6,.46);
    for(const x of [-2.7,2.7]){bar([x,2.85,-.6],[x,3.2,-.6],.025,yellow);}
    bar([-2.7,3.2,-.6],[2.7,3.2,-.6],.025,yellow);
    outline=mesh(new THREE.TorusGeometry(1.05,.018,8,64),amber,0,1.4,.3);outline.scale.y=.48;
  }
  let time=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,angle=.55,elevation=.42,distance=10.8,lastPhase=-1;
  const points=new Map();let gesture=null;
  function pose(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();const fit=camera.aspect<1?1.15/camera.aspect:1;camera.position.set(Math.sin(angle)*Math.cos(elevation),Math.sin(elevation),Math.cos(angle)*Math.cos(elevation)).multiplyScalar(distance*fit).add(target);camera.lookAt(target);camera.updateMatrixWorld();}
  function update(dt){if(playing)time+=dt;const t=time%12,amount=THREE.MathUtils.smoothstep(t,4,7),phase=t<4?0:t<7?1:2;
    moving.forEach(o=>{o.position.set(-2.6+((o.userData.offset+time*.13)%1)*5.2,1.18,o.userData.lane);o.rotation.z=time*1.2+o.userData.offset;});
    pile.forEach((o,i)=>{const s=Math.max(.001,THREE.MathUtils.clamp(amount*pile.length-i,0,1));o.scale.setScalar(s);});
    outline.visible=phase===2;outline.material.emissiveIntensity=.45+Math.sin(time*3)*.15;
    flows.forEach((o,i)=>{const x=-2.1+(i%8)*.58;o.position.set(x,.55+(i%3)*.28,1.7-((time*.6+i*.13)%1.6));o.visible=!(amount>.5&&Math.abs(x)<.9);});
    if(water){const a=water.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,.012*Math.sin(a.getX(i)*6+time*1.5)+.008*Math.sin(a.getZ(i)*8-time));a.needsUpdate=true;water.geometry.computeVertexNormals();}
    if(phase!==lastPhase){lastPhase=phase;notify({phase,playing,time:t});}pose();
  }
  const stop=e=>{e.stopImmediatePropagation();};
  function down(e){if(e.button!==0)return;stop(e);host.focus({preventScroll:true});points.set(e.pointerId,{x:e.clientX,y:e.clientY});host.setPointerCapture(e.pointerId);gesture=null;e.preventDefault();}
  function move(e){if(!points.has(e.pointerId))return;stop(e);const old=points.get(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===2){const [a,b]=[...points.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(gesture)distance=THREE.MathUtils.clamp(distance*gesture/d,6.5,16);gesture=d;}else{angle-=(e.clientX-old.x)*.007;elevation=THREE.MathUtils.clamp(elevation+(e.clientY-old.y)*.005,.08,1.2);}pose();}
  function up(e){if(!points.has(e.pointerId))return;stop(e);points.delete(e.pointerId);gesture=null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);}
  function wheel(e){stop(e);e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),6.5,16);pose();}
  function keydown(e){if(e.target!==host)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-',' '].includes(e.key)){stop(e);e.preventDefault();if(e.key==='ArrowLeft')angle-=.15;if(e.key==='ArrowRight')angle+=.15;if(e.key==='ArrowUp')elevation=Math.min(1.2,elevation+.1);if(e.key==='ArrowDown')elevation=Math.max(.08,elevation-.1);if(e.key==='+')distance=Math.max(6.5,distance/1.1);if(e.key==='-')distance=Math.min(16,distance*1.1);if(e.key===' ')playing=!playing;pose();notify({phase:lastPhase,playing,time:time%12});}}
  const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['wheel',wheel]];
  listeners.forEach(([n,f])=>host.addEventListener(n,f,{capture:true,passive:false}));document.addEventListener('keydown',keydown,true);
  update(0);
  return{scene,camera,update,command(action){if(action==='pause')playing=!playing;if(action==='replay'){time=0;playing=true;}if(action==='reset'){angle=.55;elevation=.42;distance=10.8;}notify({phase:lastPhase,playing,time:time%12});},setTime(t){time=t;playing=false;update(0);},metrics:()=>({id,time:time%12,playing,phase:lastPhase,angle,elevation,distance}),dispose(){listeners.forEach(([n,f])=>host.removeEventListener(n,f,true));document.removeEventListener('keydown',keydown,true);points.clear();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());key.shadow.map?.dispose();}};
}
