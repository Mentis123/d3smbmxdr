// Meeting Room rig for the sixth AI Lab world (world id `meeting`): a presenter-and-audience meeting room with the three
// Cisco Pro room devices the exhibits are about. Shared by the world (meeting-scene.js, scale 1.6) and the three exhibit
// kits (lab/kits/meeting.*.js, scale 0.5 on the exhibit stage). Plan: docs/three-worlds/MEETING-ROOM-LAB-PLAN.md.
//
// The devices are SCHEMATIC, sized from Cisco's datasheets, not product renders and carrying no logos:
//   Room Vision PTZ        165 W x 196 H x 176 D mm, Carbon Black; pan and tilt head          (eyes)
//   Ceiling Microphone Pro 420 x 420 x 48 mm flat square on a wire hanging kit                  (ears)
//   Ceiling Speaker Pro    420 mm wide, 88 mm high (drawn as a round coaxial unit), horizontal  (voice)
//   Room Kit Pro G2        the codec (the NVIDIA room engine) in the credenza; a Catalyst PoE switch beside it
// Every device has ONE Ethernet cable (PoE: power, control and, for audio, AES67 over IP) that runs along the open
// cable tray, down the wall between the displays, into the credenza: "one cable each, one network, one brain".
//
// Built in METRES inside room.group (origin: room centre, floor top y = 0; the displays are on the front wall at -z),
// so a caller scales the group. Every resource goes through k (k.mesh / k.mat / k.track), so the exhibit lifecycle or
// the world's dispose frees it. k needs {THREE, root, mesh, mat, track, box, cylinder}.
//
// API
//   buildMeetingRoom(k, {parent=k.root, x=0, y=0, z=0, scale=1, hero=[], walls=true, detail='world'|'stage'}) -> room
//     room.group, room.scale, room.P (layout constants), room.point(name) -> [x,y,z] room-local metres
//     room.devices  {camFront, camRear, micFront, micRear, spk:[FL,FR,RL,RR], codec, poe, navigator}
//                   each {group, anchor (Object3D at its centre), led(amount, t), ...}; PTZs add pan(a), tilt(a),
//                   head (Object3D, sensor cameras go here); mics add face (the underside centre)
//     room.cables   {id: cable} ids camFront camRear micFront micRear spkFL spkFR spkRL spkRR; cable.update(t, amount 0..1)
//                   (mics and cameras flow toward the credenza, speakers away from it)
//     room.seats    [{id, x, y, z, ry, occupied, hero, head:[x,y,z]}] table t1..t9, rows r1-1..r2-8
//     room.crowd    instanced seated figures for every occupied seat not listed in `hero`; crowd.pose(id, {turn, look,
//                   lean, raise}); crowd.commit() after posing
//     room.presenter standing person (exhibit-actors) dressed for an office, room.presenterAt(x, z, heading)
//     room.displays {left, right} screens: draw(fn(ctx,w,h)), farEnd(opts), content(opts)
//     room.noise    {coffee, vent} Object3D origins of the room's noise
//     room.onCamera(cameraWorldPosition) hides the walls the camera is behind
//     room.update(t, {ambient=true}) idle life: device LEDs breathe, PTZ heads settle, coffee steam
//   seatedFigure(k, room, seatId, {shirt,...}) -> seatedPerson (lab/rigs/laptop.js) placed at a hero seat
//   speechRibbon(k, {parent, colour}) -> {mesh, draw(a, b, level, t, {amp, lift})}
//   beamFan(k, {parent, n=8, colour}) -> {group, beams:[{mesh, set(origin, dir, length, intensity, hex)}]}
//   shells(k, {parent, n, colour, half='down'|'full'|'up'}) -> {group, set(i, origin, radius, alpha), hide()}
//   tagSprite(k, lines, css, width, {parent, x, y, z}) -> Sprite (hidden until shown)
//   roomStage(k) warms the exhibit stage (lights, background) for an indoor dusk room
import {createActors} from '../exhibit-actors.js';
import {createFlowMaterial} from '../../flow-effects.js';
import {seatedPerson} from './laptop.js';

export const ACCENT={camera:0x19d3ff,mic:0xffb02e,speaker:0xc08cff,engine:0x5dff9a};
export const CSS={camera:'#19d3ff',mic:'#ffb02e',speaker:'#c08cff',engine:'#5dff9a'};
// Layout, room-local metres. Front wall (displays) at z = -D/2; the open back edge at +D/2; glass wall at +x.
export const P={
  W:11,D:8.5,H:3.0,TRAY:2.72,
  table:{x:0,z:-.8,L:4.4,W:1.4,top:.74},
  displays:{y:1.5,z:-4.19,w:1.88,h:1.06,x:[-1.05,1.05]},
  credenza:{z:-3.95,w:3.6,d:.5,h:.72},
  camFront:[0,2.12,-4.08],camRear:[0,1.95,4.0],
  micFront:[0,2.42,-1.0],micRear:[0,2.42,3.0],
  spk:[[-2.3,2.45,-1.7],[2.3,2.45,-1.7],[-2.3,2.45,2.6],[2.3,2.45,2.6]],
  lectern:[3.75,-3.25],door:[-5.5,1.9],coffee:[-5.2,-2.4],vent:[-5.47,2.55,-.4],
  riser:{z0:3.2,h:.2},
};
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function canvasTex(k,w,h,draw){const {THREE,track}=k;const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw?.(ctx,w,h);const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return{canvas:c,ctx,texture:t};}
const font=(g,w,s)=>{g.font=`${w} ${s}px "Segoe UI",Arial,Helvetica,sans-serif`;};

// Seats: nine at the table (t1..t4 left side facing +x, t5..t8 right side facing -x, t9 at the far end facing the
// displays), two rows of eight on a riser behind. A few are empty on purpose: t7 and t8 (the empty stretch the front
// microphone does not listen to), r1-8, r2-1 and r2-7.
const OUTFITS=[[0x2f4a6b,0x2b2f38,0x3a2a1e,0xd6a27e],[0x8a3b3b,0x2e3138,0x1c1714,0xb98563],[0xe6e1d6,0x30343c,0x6b4a2e,0xe7c3a0],[0x3d6b5a,0x262a31,0x151210,0x8d5d3e],
  [0x5b4a7a,0x2a2d35,0x4a3324,0xd9ab86],[0xc9a46a,0x343841,0x2a1f18,0xc28e6a],[0x264d73,0x2b2f38,0x7a5a3a,0xf0cba6],[0x7a7f86,0x23262c,0x101010,0x6e4a33],[0xb8574a,0x2c3038,0x3b2a20,0xe2b893]];
function seatList(){
  const T=P.table,s=[],side=1.08;
  [-2.45,-1.55,-.65,.25].forEach((dz,i)=>s.push({id:'t'+(i+1),x:T.x-side,y:0,z:dz,ry:Math.PI/2,occupied:true}));
  [-2.45,-1.55,-.65,.25].forEach((dz,i)=>s.push({id:'t'+(i+5),x:T.x+side,y:0,z:dz,ry:-Math.PI/2,occupied:i<2}));
  s.push({id:'t9',x:T.x,y:0,z:1.95,ry:Math.PI,occupied:true});
  const xs=[-3.15,-2.25,-1.35,-.45,.45,1.35,2.25,3.15];
  xs.forEach((x,i)=>s.push({id:'r1-'+(i+1),x,y:0,z:2.75,ry:Math.PI,occupied:i!==7}));
  xs.forEach((x,i)=>s.push({id:'r2-'+(i+1),x,y:P.riser.h,z:3.68,ry:Math.PI,occupied:i!==0&&i!==6}));
  s.forEach((q,i)=>{q.outfit=OUTFITS[i%OUTFITS.length];q.head=[q.x+Math.sin(q.ry)*.02,q.y+1.27,q.z+Math.cos(q.ry)*.02];});
  return s;
}

// ------------------------------------------------------------------------------------------------- the crowd
// Every seated figure in one set of InstancedMeshes (about a dozen draw calls for the whole room). Stylised and
// faceless on purpose: head detection is drawn as marks over heads, never as names or faces.
function createCrowd(k,{parent,seats}){
  const {THREE,mat,track}=k;
  const group=new THREE.Group();group.name='meeting-crowd';parent.add(group);
  const people=seats.filter(s=>s.occupied&&!s.hero),chairs=seats;
  const cap=(r,l)=>track(new THREE.CapsuleGeometry(r,l,4,10));
  const white=o=>mat(0xffffff,{roughness:.8,...o});
  const parts={
    seat:{geo:track(new THREE.BoxGeometry(.46,.06,.44)),mat:mat(0x2c2f35,{roughness:.9}),n:chairs.length},
    back:{geo:track(new THREE.BoxGeometry(.44,.46,.05)),mat:mat(0x2c2f35,{roughness:.9}),n:chairs.length},
    column:{geo:track(new THREE.CylinderGeometry(.025,.03,.38,10)),mat:mat(0x1b1d21,{metalness:.6,roughness:.4}),n:chairs.length},
    base:{geo:track(new THREE.CylinderGeometry(.27,.27,.025,18)),mat:mat(0x1b1d21,{metalness:.6,roughness:.4}),n:chairs.length},
    thighs:{geo:track(new THREE.BoxGeometry(.36,.14,.44)),mat:white(),n:people.length},
    shins:{geo:track(new THREE.BoxGeometry(.32,.44,.12)),mat:white(),n:people.length},
    shoes:{geo:track(new THREE.BoxGeometry(.32,.07,.2)),mat:mat(0x1a1a1c,{roughness:.6}),n:people.length},
    torso:{geo:cap(.16,.3),mat:white(),n:people.length},
    upper:{geo:cap(.05,.22),mat:white(),n:people.length*2},
    fore:{geo:cap(.045,.22),mat:white(),n:people.length*2},
    hand:{geo:track(new THREE.SphereGeometry(.045,8,6)),mat:white({roughness:.75}),n:people.length*2},
    neck:{geo:track(new THREE.CylinderGeometry(.042,.046,.1,10)),mat:white({roughness:.75}),n:people.length},
    head:{geo:track(new THREE.SphereGeometry(.105,14,10)),mat:white({roughness:.75}),n:people.length},
    hair:{geo:track(new THREE.SphereGeometry(.11,14,10)),mat:white({roughness:.85}),n:people.length},
  };
  const mesh={};
  for(const [id,p] of Object.entries(parts)){const m=new THREE.InstancedMesh(p.geo,p.mat,Math.max(1,p.n));m.count=p.n;m.name='crowd-'+id;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;group.add(m);mesh[id]=m;}
  const C=new THREE.Color();
  people.forEach((s,i)=>{const [shirt,pants,hair,skin]=s.outfit;
    for(const id of ['thighs','shins'])mesh[id].setColorAt(i,C.setHex(pants));
    mesh.torso.setColorAt(i,C.setHex(shirt));for(const j of [0,1])mesh.upper.setColorAt(i*2+j,C.setHex(shirt)),mesh.fore.setColorAt(i*2+j,C.setHex(shirt)),mesh.hand.setColorAt(i*2+j,C.setHex(skin));
    mesh.neck.setColorAt(i,C.setHex(skin));mesh.head.setColorAt(i,C.setHex(skin));mesh.hair.setColorAt(i,C.setHex(hair));});
  for(const m of Object.values(mesh))if(m.instanceColor)m.instanceColor.needsUpdate=true;
  const M=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));
  const base=s=>M(s.x,s.y,s.z,0,s.ry,0);
  chairs.forEach((s,i)=>{const b=base(s);
    mesh.seat.setMatrixAt(i,b.clone().multiply(M(0,.45,0)));mesh.back.setMatrixAt(i,b.clone().multiply(M(0,.79,-.215,-.1)));
    mesh.column.setMatrixAt(i,b.clone().multiply(M(0,.23,0)));mesh.base.setMatrixAt(i,b.clone().multiply(M(0,.03,0)));});
  const state=people.map(()=>({turn:0,look:.15,lean:.05,raise:0}));
  const index=new Map(people.map((s,i)=>[s.id,i]));
  const tmp=new THREE.Matrix4();
  function writePerson(i){
    const s=people[i],st=state[i],b=base(s);
    mesh.thighs.setMatrixAt(i,b.clone().multiply(M(0,.54,.15)));mesh.shins.setMatrixAt(i,b.clone().multiply(M(0,.27,.37)));mesh.shoes.setMatrixAt(i,b.clone().multiply(M(0,.035,.45)));
    const hip=b.clone().multiply(M(0,.56,-.05,st.lean));
    mesh.torso.setMatrixAt(i,hip.clone().multiply(M(0,.31,0,0,0,0,1.15,1,.72)));
    for(const [j,sd] of [[0,-1],[1,1]]){
      const up=sd<0?st.raise:0;
      const sh=hip.clone().multiply(M(sd*.215,.5,0,-.35-up*2.6,0,sd*(.08+up*.1)));
      mesh.upper.setMatrixAt(i*2+j,sh.clone().multiply(M(0,-.14,0)));
      const el=sh.clone().multiply(M(0,-.27,0,-1.15+up*.9));
      mesh.fore.setMatrixAt(i*2+j,el.clone().multiply(M(0,-.14,0)));
      mesh.hand.setMatrixAt(i*2+j,el.clone().multiply(M(0,-.29,0,0,0,0,.8,1.2,.5)));
    }
    mesh.neck.setMatrixAt(i,hip.clone().multiply(M(0,.56,0)));
    const head=hip.clone().multiply(M(0,.6,0,0,st.turn,0)).multiply(M(0,0,0,st.look-st.lean));
    mesh.head.setMatrixAt(i,head.clone().multiply(M(0,.12,.005,0,0,0,.92,1.06,.98)));
    mesh.hair.setMatrixAt(i,head.clone().multiply(M(0,.155,-.03,0,0,0,1,.92,1.04)));
  }
  people.forEach((_,i)=>writePerson(i));
  function commit(){people.forEach((_,i)=>writePerson(i));for(const m of Object.values(mesh))m.instanceMatrix.needsUpdate=true;}
  commit();void tmp;
  return{group,mesh,people,has:id=>index.has(id),
    pose(id,{turn,look,lean,raise}={}){const i=index.get(id);if(i===undefined)return;const st=state[i];if(turn!==undefined)st.turn=turn;if(look!==undefined)st.look=look;if(lean!==undefined)st.lean=lean;if(raise!==undefined)st.raise=raise;},
    commit};
}

// ------------------------------------------------------------------------------------------------- office dress
// The shared worker rig is a site worker; this turns it into an office worker (no hi-vis, hair instead of a helmet).
export function officeDress(k,person,{hair=0x3a2a1e,skin=0xd6a27e}={}){
  const {THREE,mat,track}=k;
  person.group.traverse(o=>{const p=o.geometry?.parameters;if(!p)return;
    if(o.geometry.type==='BoxGeometry'&&Math.abs(p.height-.035)<1e-6&&Math.abs(p.width-.38)<1e-6)o.visible=false;
    if(o.geometry.type==='CylinderGeometry'&&Math.abs(p.radiusTop-.15)<1e-6)o.visible=false;
    if(o.material?.emissiveIntensity===.12)o.material.emissiveIntensity=0;});
  const hairM=mat(hair,{roughness:.8});
  const [,hat]=person.head.children;if(hat){hat.material=hairM;hat.scale.set(.93,.85,1.0);hat.position.y=.13;}
  const back=k.mesh(track(new THREE.SphereGeometry(.104,14,10)),hairM);person.head.add(back);back.position.set(0,.11,-.025);
  const neck=k.mesh(track(new THREE.CylinderGeometry(.04,.046,.1,12)),mat(skin,{roughness:.8}));person.joints.neck.add(neck);neck.position.set(0,0,0);
  return person;
}

// ------------------------------------------------------------------------------------------------- screens
function makeScreen(k,parent,{w,h,px=[1280,720],x=0,y=0,z=0,ry=0}){
  const {THREE,mat,track}=k;
  const s=canvasTex(k,px[0],px[1]);
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);
  const bezel=k.mesh(track(new THREE.BoxGeometry(w+.03,h+.03,.045)),mat(0x0d0e10,{roughness:.35,metalness:.4}));g.add(bezel);bezel.position.z=-.01;
  const face=k.mesh(track(new THREE.PlaneGeometry(w,h)),track(new THREE.MeshBasicMaterial({map:s.texture,toneMapped:false})));face.castShadow=false;g.add(face);face.position.z=.0135;
  face.userData.sensorKeep=true;
  let last=null;
  return{group:g,face,canvas:s.canvas,ctx:s.ctx,texture:s.texture,width:px[0],height:px[1],
    draw(fn,key){if(key!==undefined&&key===last)return;last=key;fn(s.ctx,px[0],px[1]);s.texture.needsUpdate=true;}};
}
const REMOTE=[{name:'Ana',bg:['#2c3a4a','#41566b'],skin:'#e3b48f',hair:'#3b2a20',top:'#9b5d3a'},{name:'Kofi',bg:['#2b3a32','#3e5a4a'],skin:'#8d5d3e',hair:'#141414',top:'#3f6f86'},
  {name:'Lena',bg:['#3a2f3d','#58475e'],skin:'#f0c9a3',hair:'#c79a55',top:'#7d4a8f'},{name:'Raj',bg:['#3a3428','#5a4e3a'],skin:'#b98563',hair:'#1f1a17',top:'#2f4a6b'}];
function avatarTile(g,x,y,w,h,p,{talk=0,label=true}={}){
  const gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,p.bg[0]);gr.addColorStop(1,p.bg[1]);rr(g,x,y,w,h,Math.min(w,h)*.05);g.fillStyle=gr;g.fill();
  g.save();rr(g,x,y,w,h,Math.min(w,h)*.05);g.clip();
  g.fillStyle=p.top;g.beginPath();g.ellipse(x+w/2,y+h*1.02,w*.3,h*.36,0,Math.PI,0);g.fill();
  g.fillStyle=p.skin;g.beginPath();g.arc(x+w/2,y+h*.46,h*.17,0,Math.PI*2);g.fill();
  g.fillStyle=p.hair;g.beginPath();g.arc(x+w/2,y+h*.41,h*.18,Math.PI*1.02,Math.PI*1.98);g.fill();g.restore();
  if(talk>0){g.strokeStyle=`rgba(93,255,154,${.5+.5*talk})`;g.lineWidth=Math.max(4,h*.025);rr(g,x+2,y+2,w-4,h-4,Math.min(w,h)*.05);g.stroke();}
  if(label){font(g,600,Math.max(14,h*.075));const tw=g.measureText(p.name).width;g.fillStyle='rgba(0,0,0,.55)';rr(g,x+h*.05,y+h*.82,tw+h*.12,h*.12,h*.03);g.fill();g.fillStyle='#fff';g.textBaseline='middle';g.fillText(p.name,x+h*.11,y+h*.88);}
}
// A stylised picture of the room as a camera frame (for the self-view and the far end's layout): figures as soft shapes.
function roomShot(g,x,y,w,h,{kind='wide',hl=null}={}){
  g.save();rr(g,x,y,w,h,8);g.clip();
  const gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,'#3a3029');gr.addColorStop(1,'#1c1714');g.fillStyle=gr;g.fillRect(x,y,w,h);
  g.fillStyle='rgba(216,185,143,.18)';for(let i=0;i<18;i++)g.fillRect(x+i*w/18,y,w/40,h*.55);
  const fig=(cx,cy,s,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(cx,cy+s*.9,s*.75,s*.7,0,Math.PI,0);g.fill();g.beginPath();g.arc(cx,cy,s*.42,0,Math.PI*2);g.fill();};
  if(kind==='wide'){g.fillStyle='#5a3a24';g.beginPath();g.moveTo(x+w*.42,y+h*.55);g.lineTo(x+w*.58,y+h*.55);g.lineTo(x+w*.72,y+h);g.lineTo(x+w*.28,y+h);g.closePath();g.fill();
    [[.36,.6],[.33,.72],[.29,.86],[.64,.6],[.67,.72],[.5,.5],[.2,.42],[.3,.42],[.4,.42],[.6,.42],[.7,.42],[.8,.42]].forEach(([a,b],i)=>fig(x+w*a,y+h*b,h*(.05+b*.06),i%3?'#7a6a5c':'#8a5a48'));}
  else if(kind==='presenter'){fig(x+w*.5,y+h*.42,h*.2,'#3d566e');g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x+w*.05,y+h*.12,w*.32,h*.42);}
  else if(kind==='question'){fig(x+w*.5,y+h*.45,h*.2,'#6b4a7a');}
  g.restore();
  if(hl){g.strokeStyle=hl;g.lineWidth=4;rr(g,x+2,y+2,w-4,h-4,8);g.stroke();}
}

// ------------------------------------------------------------------------------------------------- the room
export function buildMeetingRoom(k,{parent=k.root,x=0,y=0,z=0,scale=1,hero=[],walls=true,detail='world',deviceScale=1}={}){
  const DS=deviceScale;
  const {THREE,mat,track}=k;
  const group=new THREE.Group();group.name='meeting-room';group.position.set(x,y,z);group.scale.setScalar(scale);parent.add(group);
  const add=(geo,m,px=0,py=0,pz=0,p=group)=>{const o=k.mesh(track(geo),m,px,py,pz);p.add(o);return o;};
  const box=(w,h,d,m,px,py,pz,p=group)=>add(new THREE.BoxGeometry(w,h,d),m,px,py,pz,p);
  const {W,D,H}=P,front=-D/2;
  const M={
    walnut:mat(0x7a4a2c,{roughness:.4,metalness:.05}),walnutDark:mat(0x3d2416,{roughness:.5}),
    oak:mat(0xc9ab80,{roughness:.62}),plaster:mat(0xc5c8cb,{roughness:.95}),slatBack:mat(0x221c17,{roughness:.9}),
    black:mat(0x1d1f23,{roughness:.45,metalness:.3}),device:mat(0x26282c,{roughness:.5,metalness:.25}),deviceFace:mat(0x34373c,{roughness:.85}),
    steel:mat(0x8a9198,{metalness:.8,roughness:.3}),tray:mat(0x80868c,{roughness:.45,metalness:.6}),
    glass:mat(0xcfe6f2,{metalness:.1,roughness:.05,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide}),
    riser:mat(0x4a4540,{roughness:.9}),
  };

  // ---- floor: charcoal carpet tiles with a faint grid ----
  const carpet=canvasTex(k,512,512,(g,w,h)=>{g.fillStyle='#77726b';g.fillRect(0,0,w,h);
    for(let i=0;i<9000;i++){const v=rnd(i,3);g.fillStyle=v<.5?'rgba(20,18,17,.25)':'rgba(120,110,100,.08)';g.fillRect(rnd(i,1)*w,rnd(i,2)*h,1.5,1.5);}
    g.strokeStyle='rgba(40,36,32,.35)';g.lineWidth=2;for(let p=0;p<=w;p+=128){g.beginPath();g.moveTo(p,0);g.lineTo(p,h);g.stroke();g.beginPath();g.moveTo(0,p);g.lineTo(w,p);g.stroke();}}).texture;
  carpet.wrapS=carpet.wrapT=THREE.RepeatWrapping;carpet.repeat.set(W/2,D/2);
  const floor=add(new THREE.BoxGeometry(W,.02,D),mat(0xffffff,{map:carpet,roughness:.95}),0,-.01,0);floor.castShadow=false;floor.name='meeting-floor';

  // ---- front wall: dark backing with oak slats (instanced), two displays, the camera shelf ----
  const frontWall=new THREE.Group();frontWall.name='front-wall';group.add(frontWall);
  box(W,H,.08,M.slatBack,0,H/2,front-.04,frontWall);
  {const n=Math.floor(W/.09),geo=track(new THREE.BoxGeometry(.045,H-.12,.035)),inst=new THREE.InstancedMesh(geo,M.oak,n),mm=new THREE.Matrix4();
    for(let i=0;i<n;i++){mm.makeTranslation(-W/2+.045+i*.09,H/2,front+.018);inst.setMatrixAt(i,mm);}inst.castShadow=false;inst.receiveShadow=true;frontWall.add(inst);}
  const D_=P.displays;
  const displays={left:makeScreen(k,frontWall,{w:D_.w,h:D_.h,x:D_.x[0],y:D_.y,z:D_.z+.04}),right:makeScreen(k,frontWall,{w:D_.w,h:D_.h,x:D_.x[1],y:D_.y,z:D_.z+.04})};
  box(.42,.025,.2,M.black,P.camFront[0],P.camFront[1]-.11,front+.1,frontWall);

  // ---- credenza with a glass window onto the codec and the PoE switch ----
  const C_=P.credenza,cz=C_.z;
  const credenza=new THREE.Group();credenza.name='credenza';group.add(credenza);
  box(C_.w,.04,C_.d,M.walnut,0,C_.h-.02,cz,credenza);
  for(const sx of [-1,1]){box(1.2,C_.h-.08,C_.d,M.walnut,sx*1.2,(C_.h-.04)/2,cz,credenza);for(const dx of [-.3,.3])box(.005,C_.h-.16,.004,M.walnutDark,sx*1.2+dx,(C_.h-.04)/2,cz+C_.d/2+.002,credenza);}
  box(1.2,.03,C_.d,M.walnutDark,0,.015,cz,credenza);box(1.2,C_.h-.08,.02,M.walnutDark,0,(C_.h-.04)/2,cz-C_.d/2+.01,credenza);
  box(1.2,.015,C_.d-.04,M.walnutDark,0,.36,cz,credenza);
  const glassFront=box(1.2,C_.h-.08,.008,M.glass,0,(C_.h-.04)/2,cz+C_.d/2-.004,credenza);glassFront.castShadow=false;glassFront.userData.sensorKeep=true;
  // Codec (Room Kit Pro G2) and switch: dark 1U boxes with port lights. Port materials are the LEDs the cables light.
  const devices={};
  function rackBox(name,w,y,ports,accentHex){
    const g=new THREE.Group();g.name=name;g.position.set(0,y,cz+.02);credenza.add(g);
    box(w,.044,.3,M.device,0,.022,0,g);box(w,.044,.006,M.black,0,.022,.153,g);
    const leds=[];for(let i=0;i<ports;i++){const m=mat(0x1f3326,{emissive:accentHex,emissiveIntensity:.15,roughness:.4});const p=box(.016,.012,.006,m,-w/2+.06+i*.026,.03,.157,g);p.castShadow=false;leds.push(m);}
    const status=mat(0xbfffe0,{emissive:accentHex,emissiveIntensity:.6});box(.012,.012,.006,status,w/2-.03,.022,.157,g).castShadow=false;
    const lab=canvasTex(k,512,64,(c,w,h)=>{c.fillStyle='#0d1014';c.fillRect(0,0,w,h);c.fillStyle='#e8f0f6';font(c,700,34);c.textBaseline='middle';c.fillText(name==='room-kit-pro-g2'?'ROOM KIT PRO G2':'POE SWITCH',16,h/2+2);});
    const plateM=add(new THREE.PlaneGeometry(w*.55,w*.55/8),track(new THREE.MeshBasicMaterial({map:lab.texture,toneMapped:false})),w*.12,.022,.1545,g);plateM.castShadow=false;
    const anchor=new THREE.Object3D();anchor.position.set(0,.03,.1);g.add(anchor);
    return{group:g,anchor,leds,status,
      led(a,t){status.emissiveIntensity=.4+.8*a*(.6+.4*Math.sin(t*7));}};
  }
  devices.codec=rackBox('room-kit-pro-g2',.44,.42,8,ACCENT.engine);
  devices.poe=rackBox('poe-switch',.33,.05,8,ACCENT.engine);
  // A thin cable bundle comes down the wall between the displays into the credenza (drawn by the cables below).

  // ---- table and its Room Navigator ----
  const T=P.table;
  {const s=new THREE.Shape(),L=T.L/2,w=T.W/2,r=.55;
    s.moveTo(-w+r,-L);s.lineTo(w-r,-L);s.quadraticCurveTo(w,-L,w,-L+r);s.lineTo(w*.92,L-r);s.quadraticCurveTo(w*.92,L,w*.92-r,L);s.lineTo(-w*.92+r,L);s.quadraticCurveTo(-w*.92,L,-w*.92,L-r);s.lineTo(-w,-L+r);s.quadraticCurveTo(-w,-L,-w+r,-L);
    const g=new THREE.ExtrudeGeometry(s,{depth:.05,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:2,curveSegments:10});g.rotateX(Math.PI/2);
    const top=add(g,M.walnut,T.x,T.top,T.z);top.name='table-top';
    for(const dz of [-1.3,1.3])box(.5,T.top-.05,.12,M.black,T.x,(T.top-.05)/2,T.z+dz);
    box(.08,.012,T.L*.6,M.black,T.x,T.top+.004,T.z).castShadow=false;}
  {const g=new THREE.Group();g.name='room-navigator';g.position.set(T.x+.32,T.top,T.z+1.75);g.rotation.y=Math.PI;group.add(g);
    box(.1,.02,.08,M.black,0,.01,0,g);const scr=canvasTex(k,256,160,(c,w,h)=>{c.fillStyle='#0f1620';c.fillRect(0,0,w,h);c.fillStyle='#5dff9a';c.beginPath();c.arc(w/2,h*.42,26,0,Math.PI*2);c.fill();c.fillStyle='#d8e6f2';font(c,600,20);c.textAlign='center';c.fillText('In a meeting',w/2,h*.82);});
    const face=add(new THREE.PlaneGeometry(.2,.125),track(new THREE.MeshBasicMaterial({map:scr.texture,toneMapped:false})),0,.08,.012,g);face.rotation.x=-.5;face.castShadow=false;
    const shell=box(.21,.135,.012,M.black,0,.078,0,g);shell.rotation.x=-.5;devices.navigator={group:g};}

  // ---- table dressing: carafes, notebooks, a couple of laptops ----
  {const glassM=mat(0xdff2fa,{transparent:true,opacity:.35,roughness:.05,depthWrite:false});
    for(const dz of [-1.6,.4]){const c=add(new THREE.CylinderGeometry(.045,.05,.24,16),glassM,T.x,T.top+.12,T.z+dz);c.castShadow=false;}
    const lid=mat(0x9aa3ab,{metalness:.8,roughness:.3});
    for(const [dx,dz,ry] of [[-.42,-1.65,Math.PI/2],[.42,-.75,-Math.PI/2],[-.42,.15,Math.PI/2]]){const g=new THREE.Group();g.position.set(T.x+dx,T.top,T.z+dz);g.rotation.y=ry;group.add(g);
      box(.31,.012,.22,lid,0,.006,0,g);const l=box(.31,.2,.008,lid,0,.1,-.11,g);l.rotation.x=-.25;}
    const paper=mat(0xf4f1ea,{roughness:.9});
    for(const [dx,dz] of [[-.45,-2.5],[.45,-2.45],[-.45,-.7],[.45,-1.6],[0,.95]]){const p=box(.16,.006,.22,paper,T.x+dx,T.top+.003,T.z+dz);p.castShadow=false;}}

  // ---- a lounge corner by the glass: two armchairs, a low table, a floor lamp ----
  {const fabric=mat(0x6f7a72,{roughness:.95}),leg=mat(0x1b1d21,{metalness:.5,roughness:.4});
    for(const [ax,az,ry] of [[4.55,.2,-Math.PI/2-.35],[4.55,1.5,-Math.PI/2+.35]]){const g=new THREE.Group();g.position.set(ax,0,az);g.rotation.y=ry;group.add(g);
      box(.72,.2,.7,fabric,0,.32,0,g);box(.72,.42,.14,fabric,0,.6,-.3,g);for(const sx of [-1,1])box(.12,.3,.7,fabric,sx*.33,.45,0,g);
      for(const [lx,lz] of [[-.3,-.28],[.3,-.28],[-.3,.28],[.3,.28]])box(.03,.22,.03,leg,lx,.11,lz,g);}
    add(new THREE.CylinderGeometry(.32,.32,.03,28),M.walnut,4.0,.42,.85);add(new THREE.CylinderGeometry(.03,.03,.4,10),leg,4.0,.21,.85);
    add(new THREE.CylinderGeometry(.012,.012,1.5,8),leg,5.15,.75,2.25);add(new THREE.CylinderGeometry(.13,.18,.22,20,1,true),mat(0xfff1d6,{emissive:0xffd29a,emissiveIntensity:.9,roughness:.5,side:THREE.DoubleSide}),5.15,1.55,2.25);}
  // ---- the riser and its edge light ----
  {const R=P.riser,d=D/2-R.z0;box(8.6,R.h,d,M.riser,0,R.h/2,R.z0+d/2);box(8.6,.012,.02,mat(0xffe2b0,{emissive:0xffb35a,emissiveIntensity:.8}),0,R.h-.01,R.z0+.012).castShadow=false;}

  // ---- left wall: plaster, door, coffee counter and machine, vent grille ----
  const leftWall=new THREE.Group();leftWall.name='left-wall';group.add(leftWall);
  const noise={};
  if(walls){
    const lx=-W/2;
    box(.1,H,D,M.plaster,lx-.05,H/2,0,leftWall);box(.03,1.0,D,M.walnutDark,lx+.015,.5,0,leftWall);box(.04,.03,D,M.walnut,lx+.02,1.0,0,leftWall);
    box(.02,2.15,1.0,M.walnut,lx+.01,1.075,P.door[1],leftWall);box(.03,.02,.14,M.steel,lx+.03,1.0,P.door[1]-.38,leftWall);
    const cx=P.coffee[0],czc=P.coffee[1];
    box(.6,.9,1.3,M.walnutDark,cx,.45,czc,leftWall);box(.62,.03,1.32,mat(0xe9e5dc,{roughness:.4}),cx,.915,czc,leftWall);
    const machine=new THREE.Group();machine.position.set(cx+.02,.93,czc-.25);leftWall.add(machine);
    box(.3,.4,.3,M.black,0,.2,0,machine);box(.26,.06,.06,M.steel,0,.33,.15,machine);box(.1,.12,.01,mat(0x0f1620),0,.23,.152,machine);
    for(const [dz,c] of [[.25,0xf2efe8],[.4,0x2f6b4f]])add(new THREE.CylinderGeometry(.04,.034,.09,14),mat(c,{roughness:.6}),cx,.98,czc+dz,leftWall);
    noise.coffee=new THREE.Object3D();noise.coffee.position.set(cx+.05,1.25,czc-.22);group.add(noise.coffee);
    box(.02,.3,.7,mat(0x9aa1a7,{metalness:.5,roughness:.5}),lx+.01,P.vent[1],P.vent[2],leftWall);
    for(let i=0;i<7;i++)box(.025,.012,.66,M.black,lx+.02,P.vent[1]-.12+i*.04,P.vent[2],leftWall);
    noise.vent=new THREE.Object3D();noise.vent.position.set(lx+.15,P.vent[1],P.vent[2]);group.add(noise.vent);
    // A plant in the front-left corner.
    const pot=add(new THREE.CylinderGeometry(.22,.17,.5,20),mat(0xd6c6ae,{roughness:.85}),lx+.45,.25,front+.5,leftWall);void pot;
    const leafA=mat(0x3f7a36,{roughness:.7}),leafB=mat(0x5e9a48,{roughness:.7});
    for(let i=0;i<12;i++){const a=i*2.39,h=.7+rnd(i,4)*.7;const l=add(new THREE.SphereGeometry(.16,10,8),i%2?leafA:leafB,lx+.45+Math.cos(a)*.18,.5+h,front+.5+Math.sin(a)*.18,leftWall);l.scale.set(1.1,.18,.42);l.rotation.set(0,-a,-.4);}
  }else{noise.coffee=new THREE.Object3D();noise.vent=new THREE.Object3D();group.add(noise.coffee,noise.vent);}

  // ---- glass wall on the right: thin black mullions, a sill, glass panes ----
  const glassWall=new THREE.Group();glassWall.name='glass-wall';group.add(glassWall);
  if(walls){const gx=W/2;
    const pane=add(new THREE.BoxGeometry(.02,H,D),M.glass,gx,H/2,0,glassWall);pane.castShadow=false;pane.userData.sensorKeep=true;
    for(let zz=-D/2;zz<=D/2+1e-6;zz+=D/6)box(.05,H,.05,M.black,gx,H/2,zz,glassWall);
    box(.06,.06,D,M.black,gx,H,0,glassWall);box(.08,.08,D,M.black,gx,.04,0,glassWall);}

  // ---- cable tray (open ceiling): a spine down the middle, two cross members, hanger rods ----
  const trayG=new THREE.Group();trayG.name='cable-tray';group.add(trayG);
  const TY=P.TRAY;
  function trayRun(a,b){const len=Math.hypot(b[0]-a[0],b[1]-a[1]),cx=(a[0]+b[0])/2,czz=(a[1]+b[1])/2,along=Math.abs(b[0]-a[0])>Math.abs(b[1]-a[1]);
    const w=along?len:.1,d=along?.1:len;box(w,.008,d,M.tray,cx,TY-.025,czz,trayG);
    for(const s of [-1,1]){if(along)box(len,.035,.008,M.tray,cx,TY-.01,czz+s*.05,trayG);else box(.008,.035,len,M.tray,cx+s*.05,TY-.01,czz,trayG);}}
  trayRun([0,front+.05],[0,4.1]);trayRun([-2.3,-1.7],[2.3,-1.7]);trayRun([-2.3,2.6],[2.3,2.6]);
  for(const [hx,hz] of [[0,-3.2],[0,-1.7],[0,.4],[0,2.6],[0,3.9],[-2.2,-1.7],[2.2,-1.7],[-2.2,2.6],[2.2,2.6]])add(new THREE.CylinderGeometry(.006,.006,H-TY+.05,6),M.steel,hx,TY+(H-TY)/2,hz,trayG).castShadow=false;

  // ---- two linear pendants over the table and one over the rows (warm light bars; bloom does the glow) ----
  const pendants=[];
  {const bar=mat(0x1b1d21,{metalness:.5,roughness:.4}),lightM=mat(0xfff1d8,{emissive:0xffd9a8,emissiveIntensity:1.6,roughness:.4}),upM=mat(0xfff6ea,{emissive:0xffe2bc,emissiveIntensity:.7,roughness:.5});
    for(const [px,pz,len,ry] of [[-.75,-.8,3.4,0],[.75,-.8,3.4,0],[0,3.2,6.0,Math.PI/2]]){const g=new THREE.Group();g.position.set(px,2.25,pz);g.rotation.y=ry;group.add(g);
      box(.06,.04,len,bar,0,0,0,g);const l=box(.04,.01,len-.06,lightM,0,-.024,0,g);l.castShadow=false;const u=box(.03,.006,len-.1,upM,0,.023,0,g);u.castShadow=false;
      for(const s of [-1,1])add(new THREE.CylinderGeometry(.003,.003,TY-2.25,4),M.steel,0,(TY-2.25)/2,s*(len/2-.2),g).castShadow=false;
      pendants.push(g);}}
  // ---- the devices ----
  function ledMat(hex){return mat(0x202428,{emissive:hex,emissiveIntensity:.1,roughness:.4});}
  function drop(x0,z0,from,to){add(new THREE.CylinderGeometry(.008,.008,Math.abs(from-to),6),M.steel,x0,(from+to)/2,z0,trayG).castShadow=false;}
  // Ceiling Microphone Pro: 420 x 420 x 48 mm, a perforated face, three small ultrasonic ports, a status light.
  const perf=canvasTex(k,256,256,(g,w,h)=>{g.fillStyle='#34373c';g.fillRect(0,0,w,h);g.fillStyle='rgba(10,10,12,.55)';for(let i=6;i<w;i+=9)for(let j=6;j<h;j+=9){g.beginPath();g.arc(i,j,1.6,0,Math.PI*2);g.fill();}}).texture;
  function micPro(name,pos){
    const g=new THREE.Group();g.name=name;g.position.set(...pos);g.scale.setScalar(DS);group.add(g);
    const body=box(.42,.048,.42,M.device,0,0,0,g);void body;
    const face=add(new THREE.PlaneGeometry(.39,.39),mat(0xffffff,{map:perf,roughness:.9}),0,-.0245,0,g);face.rotation.x=Math.PI/2;face.castShadow=false;
    for(const [dx,dz] of [[0,-.12],[.1,.07],[-.1,.07]])add(new THREE.CylinderGeometry(.012,.012,.003,10),M.black,dx,-.026,dz,g).castShadow=false;
    const lm=ledMat(ACCENT.mic);for(const [ex,ez,ew,ed] of [[0,.211,.42,.006],[0,-.211,.42,.006],[.211,0,.006,.42],[-.211,0,.006,.42]])box(ew,.008,ed,lm,ex,-.02,ez,g).castShadow=false;
    for(const [dx,dz] of [[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]])add(new THREE.CylinderGeometry(.002,.002,(TY-.03-pos[1])/DS,4),M.steel,dx,(TY-.03-pos[1])/DS/2,dz,g).castShadow=false;
    const anchor=new THREE.Object3D();g.add(anchor);const faceAnchor=new THREE.Object3D();faceAnchor.position.y=-.03;g.add(faceAnchor);
    return{group:g,anchor,face:faceAnchor,ledMat:lm,led(a,t){lm.emissiveIntensity=.12+1.4*a*(.7+.3*Math.sin(t*5));}};
  }
  devices.micFront=micPro('ceiling-mic-pro-front',P.micFront);devices.micRear=micPro('ceiling-mic-pro-rear',P.micRear);
  // Ceiling Speaker Pro: 420 mm wide, 88 mm high, round coaxial body, perforated grille, light ring; hung level.
  const grille=canvasTex(k,256,256,(g,w,h)=>{g.fillStyle='#2e3135';g.fillRect(0,0,w,h);g.fillStyle='rgba(8,8,10,.6)';for(let r=12;r<w/2;r+=10)for(let a=0;a<Math.PI*2;a+=8/r){g.beginPath();g.arc(w/2+Math.cos(a)*r,h/2+Math.sin(a)*r,1.6,0,Math.PI*2);g.fill();}}).texture;
  function speakerPro(name,pos){
    const g=new THREE.Group();g.name=name;g.position.set(...pos);g.scale.setScalar(DS);group.add(g);
    add(new THREE.CylinderGeometry(.2,.21,.07,40),M.device,0,0,0,g);
    add(new THREE.CylinderGeometry(.16,.2,.018,40),M.device,0,.044,0,g);
    const face=add(new THREE.CircleGeometry(.195,40),mat(0xffffff,{map:grille,roughness:.85}),0,-.0355,0,g);face.rotation.x=Math.PI/2;face.castShadow=false;
    const lm=ledMat(ACCENT.speaker);const ring=add(new THREE.TorusGeometry(.205,.006,6,48),lm,0,-.03,0,g);ring.rotation.x=Math.PI/2;ring.castShadow=false;
    add(new THREE.CylinderGeometry(.03,.03,.02,12),M.black,0,.06,0,g);
    const anchor=new THREE.Object3D();g.add(anchor);const faceAnchor=new THREE.Object3D();faceAnchor.position.y=-.04;g.add(faceAnchor);
    return{group:g,anchor,face:faceAnchor,ledMat:lm,led(a,t){lm.emissiveIntensity=.1+1.6*a*(.75+.25*Math.sin(t*6));}};
  }
  devices.spk=P.spk.map((p,i)=>speakerPro('ceiling-speaker-pro-'+['fl','fr','rl','rr'][i],p));
  for(const d of devices.spk){const p=d.group.position;drop(p.x,p.z,p.y+.07*DS,TY-.03);}
  // Room Vision PTZ: base, a yoke that pans, a head that tilts, a glass lens and a light. Faces +z by default.
  function ptz(name,pos,{ry=0,hang=false}={}){
    const g=new THREE.Group();g.name=name;g.position.set(...pos);g.rotation.y=ry;g.scale.setScalar(DS);group.add(g);
    const baseY=hang?.0:0;
    box(.165,.05,.176,M.device,0,baseY+.025,0,g);
    const yaw=new THREE.Group();yaw.position.y=.05;g.add(yaw);
    box(.13,.02,.12,M.device,0,.01,0,yaw);for(const s of [-1,1])box(.018,.11,.06,M.device,s*.07,.07,0,yaw);
    const head=new THREE.Group();head.position.y=.11;yaw.add(head);
    add(new THREE.BoxGeometry(.12,.1,.14),M.device,0,0,0,head);
    add(new THREE.CylinderGeometry(.045,.045,.02,24),M.black,0,0,.075,head).rotation.x=Math.PI/2;
    const lens=add(new THREE.CylinderGeometry(.032,.032,.006,24),mat(0x0b1b2a,{metalness:.9,roughness:.05,emissive:0x0a3550,emissiveIntensity:.4}),0,0,.086,head);lens.rotation.x=Math.PI/2;lens.castShadow=false;
    const lm=ledMat(ACCENT.camera);box(.012,.008,.004,lm,.042,.036,.071,head).castShadow=false;
    const mount=new THREE.Object3D();mount.position.set(0,0,.09);head.add(mount);
    const anchor=new THREE.Object3D();anchor.position.y=.1;g.add(anchor);
    return{group:g,anchor,head,mount,yaw,ledMat:lm,pan(a){yaw.rotation.y=a;},tilt(a){head.rotation.x=a;},led(a,t){lm.emissiveIntensity=.15+1.4*a*(.7+.3*Math.sin(t*4));}};
  }
  devices.camFront=ptz('room-vision-ptz-front',P.camFront);
  devices.camRear=ptz('room-vision-ptz-rear',[P.camRear[0],P.camRear[1],P.camRear[2]],{ry:Math.PI});
  box(.22,.02,.22,M.black,P.camRear[0],P.camRear[1]-.01,P.camRear[2],trayG);drop(P.camRear[0],P.camRear[2],P.camRear[1],TY-.03);
  devices.camFront.tilt(.22);devices.camRear.tilt(.2);

  // ---- the eight cables: device -> drop -> tray -> spine -> front wall -> down between the displays -> credenza ----
  const cables={};
  const spineX=i=>-.055+i*.016;
  function route(id,i,from,{viaCross=false}={}){
    const x0=spineX(i),top=TY+.012,pts=[];
    pts.push([from[0],from[1]+.03,from[2]]);
    if(id==='camFront'){pts.push([from[0]+.08,from[1],from[2]-.06],[x0,from[1],front+.06]);}
    else{pts.push([from[0],top,from[2]]);if(viaCross)pts.push([x0,top,from[2]]);pts.push([x0,top,front+.06]);}
    pts.push([x0,top,front+.05],[x0,C_.h+.02,front+.05],[x0,C_.h-.02,cz-.05],[x0*.5,.45,cz-.02]);
    return pts;
  }
  const order=[['micFront',P.micFront,ACCENT.mic,false],['micRear',P.micRear,ACCENT.mic,false],['camRear',P.camRear,ACCENT.camera,false],['camFront',P.camFront,ACCENT.camera,false],
    ['spkFL',P.spk[0],ACCENT.speaker,true],['spkFR',P.spk[1],ACCENT.speaker,true],['spkRL',P.spk[2],ACCENT.speaker,true],['spkRR',P.spk[3],ACCENT.speaker,true]];
  const col=h=>{const c=new THREE.Color(h);return[c.r,c.g,c.b];};
  order.forEach(([id,from,hex,cross],i)=>{
    let pts=route(id,i,from,{viaCross:cross});
    const toEngine=!id.startsWith('spk');if(!toEngine)pts=pts.slice().reverse();
    const path=new THREE.CurvePath();for(let j=1;j<pts.length;j++)path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[j-1]),new THREE.Vector3(...pts[j])));
    const len=path.getLength(),segs=Math.max(40,pts.length*30);
    const cable=add(new THREE.TubeGeometry(path,segs,.006,5,false),mat(0x1d3a66,{roughness:.6,emissive:0x0b2a5a,emissiveIntensity:.25}));cable.castShadow=false;cable.name='cable-'+id;
    const g=col(hex),flow=track(createFlowMaterial({speed:.9/len,repeat:Math.max(2,Math.round(len/2.2)),base:[0,0,0],glow:[g[0]*2.2,g[1]*2.2,g[2]*2.2]}));
    flow.transparent=true;flow.blending=THREE.AdditiveBlending;flow.depthWrite=false;
    const glow=add(new THREE.TubeGeometry(path,segs,.011,6,false),flow);glow.castShadow=glow.receiveShadow=false;glow.visible=false;glow.userData.sensorKeep=true;glow.name='pulse-'+id;
    cables[id]={cable,glow,path,length:len,toEngine,hex,update(t,a){glow.visible=a>.02;flow.uniforms.uTime.value=t;}};
  });

  // ---- seats and people ----
  const seats=seatList();for(const s of seats)s.hero=hero.includes(s.id);
  const crowd=createCrowd(k,{parent:group,seats});
  const actors=createActors({...k,root:group});
  const presenter=officeDress(k,actors.person({vest:0x2a3442,shirt:0xe9e4da,pants:0x262a31,helmet:0x2a1f18,skin:0xc99574,name:'presenter'}),{hair:0x2a1f18,skin:0xc99574});
  // Lectern beside the presenter's spot.
  {const [lx,lz]=P.lectern;const g=new THREE.Group();g.name='lectern';g.position.set(lx,0,lz);g.rotation.y=-.6;group.add(g);
    box(.5,1.0,.4,M.walnut,0,.5,0,g);const top=box(.56,.03,.46,M.walnutDark,0,1.06,-.02,g);top.rotation.x=.25;}
  function presenterAt(px,pz,heading=0){presenter.group.position.set(px,0,pz);presenter.group.rotation.y=heading;}
  presenterAt(P.lectern[0]-.55,P.lectern[1]-.15,-.9);presenter.pose({distance:0,weight:0});

  // ---- display content ----
  function farEnd(screen,{talk=-1,self='wide',selfHl=null,layout='tiles',meter=null,t=0}={}){
    screen.draw((g,w,h)=>{
      g.fillStyle='#0b0f14';g.fillRect(0,0,w,h);
      if(layout==='two-up'){roomShot(g,w*.02,h*.04,w*.47,h*.72,{kind:'presenter',hl:'#19d3ff'});roomShot(g,w*.51,h*.04,w*.47,h*.72,{kind:'question',hl:'#19d3ff'});
        const tw=w*.2,th=h*.17;REMOTE.forEach((p,i)=>avatarTile(g,w*.02+i*(tw+w*.015),h*.79,tw,th,p,{talk:i===talk?1:0,label:false}));
        g.fillStyle='rgba(0,0,0,.6)';rr(g,w*.03,h*.06,w*.3,h*.07,10);g.fill();g.fillStyle='#fff';font(g,700,h*.04);g.textBaseline='middle';g.fillText('What the far end sees',w*.045,h*.095);
      }else{
        const tw=w*.47,th=h*.44;REMOTE.forEach((p,i)=>avatarTile(g,w*.02+(i%2)*(tw+w*.02),h*.04+Math.floor(i/2)*(th+h*.03),tw,th,p,{talk:i===talk?1:0}));
        if(self){roomShot(g,w*.73,h*.68,w*.24,h*.27,{kind:self,hl:selfHl});g.fillStyle='rgba(0,0,0,.6)';rr(g,w*.735,h*.69,w*.11,h*.05,6);g.fill();g.fillStyle='#fff';font(g,600,h*.03);g.textBaseline='middle';g.fillText('Our room',w*.742,h*.715);}
      }
      if(meter){const mx=w*.03,my=h*.86,mw=w*.4,mh=h*.1;g.fillStyle='rgba(0,0,0,.65)';rr(g,mx,my,mw,mh,10);g.fill();
        g.fillStyle='#d8e6f2';font(g,600,h*.028);g.textBaseline='middle';g.fillText(meter.label,mx+12,my+mh*.25);
        g.strokeStyle=meter.clean?'#5dff9a':'#9aa5ad';g.lineWidth=3;g.beginPath();
        for(let i=0;i<=120;i++){const u=i/120,xx=mx+12+u*(mw-24),noisy=meter.clean?0:(rnd(i,Math.floor(t*8))-.5)*.8,voice=Math.sin(u*40+t*6)*Math.max(0,Math.sin(u*7+t))*(meter.clean?.9:.5);g.lineTo(xx,my+mh*.66+(voice+noisy)*mh*.28);}g.stroke();}
    },JSON.stringify([talk,self,selfHl,layout,meter&&[meter.clean,meter.label,Math.floor(t*8)]]));
  }
  function content(screen,{title='Q3 town hall',step=0}={}){
    screen.draw((g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#101a26');gr.addColorStop(1,'#1d2b3c');g.fillStyle=gr;g.fillRect(0,0,w,h);
      g.fillStyle='#e9eef4';font(g,700,h*.075);g.textBaseline='top';g.fillText(title,w*.06,h*.07);
      g.fillStyle='#8fa3b8';font(g,500,h*.04);g.fillText('Customer pilots by region',w*.06,h*.17);
      const vals=[.42,.58,.5,.74,.66,.88];vals.forEach((v,i)=>{const bx=w*.08+i*w*.14,bh=h*.55*v;g.fillStyle=i===5?'#5dff9a':'#3f7fb8';rr(g,bx,h*.86-bh,w*.09,bh,6);g.fill();});
      g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=2;g.beginPath();g.moveTo(w*.06,h*.86);g.lineTo(w*.94,h*.86);g.stroke();
      if(step){g.strokeStyle='#ffb02e';g.lineWidth=6;rr(g,w*.76,h*.18,w*.14,h*.7,10);g.stroke();}
    },JSON.stringify([title,step]));
  }
  farEnd(displays.left);content(displays.right);

  // ---- walls that give way to the camera ----
  const tmpV=new THREE.Vector3();
  function onCamera(worldPos){tmpV.copy(worldPos);group.worldToLocal(tmpV);
    frontWall.visible=tmpV.z>front-.02;leftWall.visible=tmpV.x>-W/2;glassWall.visible=tmpV.x<W/2;}

  // ---- idle life ----
  function update(t,{ambient=true}={}){
    if(!ambient)return;
    for(const d of [devices.micFront,devices.micRear])d.led(.15+.1*Math.sin(t*.8),t);
    devices.spk.forEach((d,i)=>d.led(.12+.08*Math.sin(t*.7+i),t));
    devices.camFront.led(.3,t);devices.camRear.led(.3,t);devices.codec.led(.4,t);devices.poe.led(.3,t);
  }

  const point=name=>{const pts={micFront:P.micFront,micRear:P.micRear,camFront:P.camFront,camRear:P.camRear,credenza:[0,P.credenza.h,P.credenza.z],codec:[0,.45,P.credenza.z+.2],
    lectern:[P.lectern[0],1.1,P.lectern[1]],table:[P.table.x,P.table.top,P.table.z],displayL:[D_.x[0],D_.y,D_.z],displayR:[D_.x[1],D_.y,D_.z]};return pts[name]?[...pts[name]]:null;};
  return{group,scale,P,M,pendants,devices,cables,seats,crowd,presenter,presenterAt,actors,displays,farEnd,content,noise,onCamera,update,point,walls:{front:frontWall,left:leftWall,glass:glassWall},tray:trayG,credenza};
}

// A full seatedPerson (lab/rigs/laptop.js) at a hero seat, for close-ups; the crowd leaves that seat to it.
export function seatedFigure(k,room,seatId,opts={}){
  const s=room.seats.find(q=>q.id===seatId);const [shirt,pants,hair,skin]=s.outfit;
  const p=seatedPerson(k,{parent:room.group,x:s.x,z:s.z,ry:s.ry,shirt,jacket:shirt,pants,hair,skin,name:'hero-'+seatId,...opts});
  p.group.position.y=s.y;
  // Forearms on the table edge (table seats) or on the lap (rows): a keyboard point in front of the person.
  const fwd=[Math.sin(s.ry),Math.cos(s.ry)],table=s.id.startsWith('t');
  const kb=[s.x+fwd[0]*(table?.42:.3),s.y+(table?P.table.top+.01:.62),s.z+fwd[1]*(table?.42:.3)];
  const pose=p.pose;p.seat=s;p.rest=kb;
  p.pose=(t,o={})=>pose(t,{mode:table?'rest':'lap',...o});
  p.pose(0);return p;
}

// ------------------------------------------------------------------------------------------------- helpers
export function speechRibbon(k,{parent=k.root,colour=0x5dff9a,N=64,scale=1}={}){
  const {THREE,track}=k;
  const fade=canvasTex(k,256,8,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.18,'rgba(255,255,255,.95)');gr.addColorStop(.82,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}).texture;
  const pos=new Float32Array((N+1)*6),uv=new Float32Array((N+1)*4),idx=[];
  for(let j=0;j<=N;j++){uv.set([j/N,0,j/N,1],j*4);if(j<N){const a=j*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const geo=track(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setIndex(idx);
  const m=track(new THREE.MeshBasicMaterial({color:colour,map:fade,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  const mesh=new THREE.Mesh(geo,m);mesh.frustumCulled=false;mesh.renderOrder=5;mesh.userData.noFit=true;mesh.userData.sensorKeep=true;parent.add(mesh);
  const Pt=new THREE.Vector3(),Tg=new THREE.Vector3(),Nn=new THREE.Vector3(),Cc=new THREE.Vector3(),A=new THREE.Vector3(),B=new THREE.Vector3(),X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
  const bez=(a,c,b,u,out)=>{const w=1-u;return out.set(0,0,0).addScaledVector(a,w*w).addScaledVector(c,2*w*u).addScaledVector(b,u*u);};
  return{mesh,material:m,draw(a,b,level,t,{amp=.05,lift=.25,phase=0,width=.03}={}){
    m.opacity=Math.min(1,level*1.2);mesh.visible=level>.01;if(!mesh.visible)return;
    A.set(...a);B.set(...b);Cc.copy(A).lerp(B,.5);Cc.y+=A.distanceTo(B)*lift;
    const side=Math.abs(B.x-A.x)>Math.abs(B.z-A.z)?Z:X;
    for(let j=0;j<=N;j++){const u=j/N;bez(A,Cc,B,u,Pt);bez(A,Cc,B,Math.min(1,u+.01),Tg);Tg.sub(Pt).normalize();Nn.crossVectors(Tg,side).normalize();if(Nn.y<0)Nn.negate();
      const env=Math.pow(Math.sin(Math.PI*u),.6),wave=Math.sin(u*26-t*9+phase)*.7+Math.sin(u*47-t*15+phase*2)*.3,d=amp*scale*env*level*wave,h=width*scale*env*(.4+.6*level);
      pos.set([Pt.x+Nn.x*(d+h),Pt.y+Nn.y*(d+h),Pt.z+Nn.z*(d+h),Pt.x+Nn.x*(d-h),Pt.y+Nn.y*(d-h),Pt.z+Nn.z*(d-h)],j*6);}
    geo.attributes.position.needsUpdate=true;}};
}

// Microphone beams: translucent cones from the microphone face. Apex at the origin, opening along dir.
export function beamFan(k,{parent=k.root,n=8,colour=ACCENT.mic,half=.2}={}){
  const {THREE,track}=k;
  const grad=canvasTex(k,8,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.6,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,.08)');g.fillStyle=gr;g.fillRect(0,0,w,h);}).texture;
  const geo=track(new THREE.ConeGeometry(1,1,40,1,true));geo.translate(0,-.5,0);
  const group=new THREE.Group();group.name='mic-beams';parent.add(group);
  const down=new THREE.Vector3(0,-1,0),D=new THREE.Vector3();
  const beams=[];
  for(let i=0;i<n;i++){
    const m=track(new THREE.MeshBasicMaterial({color:colour,map:grad,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    const mesh=new THREE.Mesh(geo,m);mesh.userData.sensorKeep=true;mesh.userData.noFit=true;mesh.renderOrder=4;mesh.castShadow=mesh.receiveShadow=false;group.add(mesh);
    beams.push({mesh,material:m,set(origin,dir,length,intensity,hex){
      mesh.visible=intensity>.01&&length>.01;if(!mesh.visible)return;
      mesh.position.set(...origin);D.set(...dir).normalize();mesh.quaternion.setFromUnitVectors(down,D);
      const w=Math.tan(half)*length;mesh.scale.set(w,length,w);m.opacity=intensity;if(hex!==undefined)m.color.setHex(hex);}});
  }
  return{group,beams};
}

// Expanding shells (sound and noise). half 'down' draws the lower hemisphere (a ceiling speaker's sound).
export function shells(k,{parent=k.root,n=6,colour=0xc08cff,half='full',opacity=.5}={}){
  const {THREE,track}=k;
  const geo=track(half==='down'?new THREE.SphereGeometry(1,48,20,0,Math.PI*2,Math.PI/2,Math.PI/2):half==='up'?new THREE.SphereGeometry(1,48,20,0,Math.PI*2,0,Math.PI/2):new THREE.SphereGeometry(1,40,20));
  const group=new THREE.Group();group.name='shells';parent.add(group);
  // Rim-lit bubble: bright at grazing angles, almost clear face-on, so an expanding sphere reads as a wavefront.
  const vertexShader='varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}';
  const fragmentShader='uniform vec3 uColor;uniform float uOpacity;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.4);gl_FragColor=vec4(uColor*(.35+1.4*f),(.06+.94*f)*uOpacity);}';
  const items=[];
  for(let i=0;i<n;i++){const m=track(new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Color(colour)},uOpacity:{value:0}},vertexShader,fragmentShader,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
    const mesh=new THREE.Mesh(geo,m);mesh.userData.sensorKeep=true;mesh.userData.noFit=true;mesh.renderOrder=3;mesh.visible=false;mesh.castShadow=mesh.receiveShadow=false;group.add(mesh);items.push({mesh,m});}
  return{group,items,set(i,origin,r,a,hex){const it=items[i];if(!it)return;it.mesh.visible=a>.003&&r>.001;if(!it.mesh.visible)return;it.mesh.position.set(...origin);it.mesh.scale.setScalar(r);it.m.uniforms.uOpacity.value=a*opacity;if(hex!==undefined)it.m.uniforms.uColor.value.setHex(hex);},
    hide(){items.forEach(it=>{it.mesh.visible=false;});}};
}

// Billboard tag drawn on a canvas: a coloured title line and one or two plain lines. Hidden until shown.
export function tagSprite(k,lines,css,width,{parent=k.root,x=0,y=0,z=0,depth=false}={}){
  const {THREE,track}=k;
  const t=canvasTex(k,768,64+lines.length*62,(g,w,h)=>{g.fillStyle='rgba(10,12,16,.9)';rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle=css;g.lineWidth=5;g.stroke();
    g.textBaseline='middle';g.textAlign='center';lines.forEach((s,i)=>{g.fillStyle=i?'#eef2f6':css;let size=i?44:50;font(g,i?600:800,size);while(g.measureText(s).width>w-60&&size>20){size-=2;font(g,i?600:800,size);}g.fillText(s,w/2,44+i*62);});}).texture;
  const s=new THREE.Sprite(track(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,depthTest:depth,toneMapped:false})));
  s.scale.set(width,width*t.image.height/t.image.width,1);s.position.set(x,y,z);s.userData.noFit=true;s.renderOrder=8;s.visible=false;parent.add(s);return s;
}

// The exhibit stage, dressed as an indoor room at dusk: warm key, cool display light, a dark warm background.
export function roomStage(k){
  const {THREE,root,mat}=k;const scene=root.parent;
  if(scene){scene.background=new THREE.Color(0x15120f);if(scene.fog){scene.fog.color.set(0x15120f);scene.fog.near=16;scene.fog.far=40;}
    scene.traverse(o=>{if(o.isHemisphereLight){o.color.set(0xfff0dc);o.groundColor.set(0x5a4a3c);o.intensity=1.9;}
      else if(o.isDirectionalLight&&o.castShadow){o.color.set(0xffe9cc);o.intensity=2.6;o.position.set(-3,7,4);}
      else if(o.isDirectionalLight){o.color.set(0xffb878);o.intensity=1.2;o.position.set(6,2.5,1);}});
    const fill=new THREE.DirectionalLight(0xdfe9ff,.7);fill.position.set(0,4,-6);scene.add(fill);}
  for(const o of [...root.children]){if(!o.isMesh)continue;if(o.material===k.cyan)o.visible=false;else if(o.geometry?.parameters?.width===7&&o.geometry.parameters.height===.3)o.material=mat(0x2a201a,{roughness:.7,metalness:.05});}
}

// ------------------------------------------------------------------------------------------------- exhibit stage
// The whole room at half scale on the exhibit stage (11 x 8.5 m -> 5.5 x 4.25 units, the stage floor's depth), with the
// walls giving way to whichever camera is rendering (the scene's onBeforeRender runs before the render list is built).
export const STAGE_SCALE=.5;
export function stageRoom(k,{hero=[],deviceScale=1.2}={}){
  roomStage(k);
  const room=buildMeetingRoom(k,{scale:STAGE_SCALE,y:.004,hero,deviceScale,detail:'stage'});
  const scene=k.root.parent,v=new k.THREE.Vector3();
  if(scene)scene.onBeforeRender=(r,s,cam)=>{if(cam)room.onCamera(cam.getWorldPosition(v));};
  room.toRoot=p=>[p[0]*STAGE_SCALE,p[1]*STAGE_SCALE+.004,p[2]*STAGE_SCALE];
  return room;
}
// Aim a PTZ (room.devices.camFront / camRear) at a room-local point: returns {yaw, tilt} for its pan() and tilt().
export function aimAt(k,ptzDevice,roomGroup,point){
  const v=new k.THREE.Vector3(...point);roomGroup.localToWorld(v);ptzDevice.group.worldToLocal(v);v.y-=.16;
  return{yaw:Math.atan2(v.x,v.z),tilt:Math.atan2(-v.y,Math.hypot(v.x,v.z))};
}
