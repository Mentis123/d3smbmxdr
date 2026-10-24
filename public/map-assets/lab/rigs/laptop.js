// Laptop rig for the Local AI Lab world (world id `local`) and its three exhibits (CPU meeting notes, GPU browser
// agent, NPU ask-my-files). One premium 15-inch clamshell modelled on the look of the Surface Laptop Ultra (Nightfall
// or Platinum aluminium, thin-bezel 3:2 mini-LED screen, slim chassis, a very large haptic touchpad, ports on both
// sides, a mirrored four-square mark on the lid), a warm daylit desk, a seated person and the "On the chip" view.
// The board under the keyboard is ARTISTIC LICENCE (no teardown exists): one large package with a CPU die and a GPU
// die, memory beside it, a separate NPU block, an SSD at the edge, the battery under the palm rest, two fans with
// heat pipes. Plan and decisions: docs/three-worlds/LOCAL-LAB-PLAN.md.
//
// Everything is built in METRES inside its own group (laptop 0.340 x 0.244 m), so a caller scales the group to suit
// its stage (the world uses 10x; an exhibit stage around 4 to 6x). Every resource goes through the kit (k.mesh /
// k.mat / k.track), so the exhibit lifecycle (or the world's dispose) frees it. k needs {THREE, root, mesh, mat, track}.
//
// API
//   buildLaptop(k, {parent=k.root, x=0, y=0, z=0, ry=0, scale=1, finish='nightfall'|'platinum', lidAngle=110,
//                   screenSize=[1152,768]}) -> laptop
//     laptop.group            Group; origin at the base's bottom centre, +z toward the user, lid hinge at the back.
//     laptop.lid              Group (hinge pivot); laptop.size = {W, D, H} in metres.
//     laptop.screen           {canvas, ctx, texture, mesh, width, height, draw(fn, {taskbar=true}), redraw(),
//                              setWifi('on'|'offline'|'hidden', {badge=false}), wifi, desktop(ctx,w,h)}.
//                             draw(fn) clears, calls fn(ctx, w, h), paints the taskbar (clock + Wi-Fi glyph) on top
//                             and uploads. Draw only on a state change, never every frame. setWifi re-runs the last fn.
//     laptop.chips            {cpu, gpu, npu, memory, ssd, battery, fanL, fanR}: an Object3D at the top centre of each
//                             part (use as overlay anchors and sensor targets). Each has userData.label (its plate),
//                             userData.parts (meshes) and userData.accent (hex). Labels show only with the cutaway.
//     laptop.dies             {cpu, gpu, npu} die meshes (emissive core grids).
//     laptop.deck             [Mesh]: deck plate, keyboard well, keys (InstancedMesh), touchpad. They fade to glass.
//     laptop.keyboard         Object3D at the keyboard centre (top surface); laptop.touchpad likewise.
//     laptop.setCutaway(u)    0 = closed laptop, 1 = deck and keys as faint glass, board and labels shown. Pure.
//     laptop.lightChip(id, amount 0..1, {cores}) die (or part) glow; cores 0..1 lights that fraction of the core grid
//                             in order (CPU cores lighting in sequence). Pure: call every frame with the value for t.
//     laptop.flowPath(points, {radius, speed, repeat, glow}) -> {mesh, update(t, active)}: a flow-effects pulse
//                             along points given in laptop-local metres (input -> chip -> screen). Hidden until active.
//     laptop.point(name)      laptop-local [x,y,z] of a named place: 'mic', 'camera', 'screen', 'keyboard',
//                             'touchpad', 'ssd', 'cpu', 'gpu', 'npu', 'memory', 'battery', 'portL', 'portR'.
//     laptop.update(t, {fans=0.4})  spins the fans (0 still .. 1 flat out). Pure in t.
//   buildDesk(k, {parent=k.root, x=0, z=0, ry=0, scale=1, width=1.5, depth=0.75, height=0.74, window=false|{offset,width,height},
//                 notebook=true, pen=true, mug=true, phone=true, plant=true}) -> desk
//     desk.group, desk.top (y of the desk surface in the group), desk.spots {laptop, notebook, mug, phone, plant}
//     ([x,z] on the top), desk.items {notebook, pen, mug, phone, plant} (Groups), desk.window (Group or null).
//     Warm oak top, a Data#3 notebook and pen, a coffee mug, a phone face down, a plant; optional window wall behind.
//   seatedPerson(k, {parent=k.root, x=0, z=0, ry=0, scale=1, seat=0.47, chair=true, shirt, jacket, pants, hair, skin,
//                    keyboard:[x,y,z], screen:[x,y,z], touchpad:[x,y,z]}) -> sitter
//     keyboard / screen / touchpad are points in PARENT coordinates (pointIn(laptop, 'keyboard', parent)).
//     sitter.group, sitter.chair, sitter.person (exhibit-actors person), sitter.hands {left, right} (attach points,
//     e.g. a phone), sitter.pose(t, {mode:'type'|'mouse'|'rest'|'lap'|'point'|'phone'|'think', to, mix=0, point:[x,y,z],
//     look, turn, lean}). mode blends into `to` by mix (0..1). Deterministic in t; no accumulated state.
//   chipView(k, laptop, {target:'cpu'|'gpu'|'npu', path:[[x,y,z]...], keep:[Object3D], dim=0.22}) -> view
//     view.set(amount 0..1, t): cutaway = amount, everything under k.root except the laptop board, screen and `keep`
//     dimmed toward `dim`, the target die lit, the other dies quiet, the data path pulsing once amount > 0.5.
//     view.path (the flowPath or null), view.restore(). Call set() every frame in an aiView chapter (0 elsewhere).
//     Pair it with a sensor {mode:'normal', camera framing the board}; no change to exhibit-sensor.js is needed.
//   pointIn(laptop, name, space) -> [x,y,z] of laptop.point(name) in the local coordinates of Object3D `space`.
//   deskOn(desk, laptop, name) -> the same in the desk's parent coordinates. seatedPerson's keyboard / screen / touchpad
//     points must be in the PERSON'S PARENT coordinates: use pointIn(laptop, name, thatParent) when they differ.
//   ACCENTS = {cpu:0x2aa8ff, gpu:0x5dff6a, npu:0xc24dff, memory:0xffb84d, ssd:0x9fd8ff, battery:0x7dffb0}
import {createActors} from '../exhibit-actors.js';
import {createFlowMaterial} from '../../flow-effects.js';

export const ACCENTS={cpu:0x2aa8ff,gpu:0x5dff6a,npu:0xc24dff,memory:0xffb84d,ssd:0x9fd8ff,battery:0x7dffb0,fan:0x9fb4c8};
const hex=c=>'#'+c.toString(16).padStart(6,'0');
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};

function roundedShape(THREE,w,d,r,cx=0,cy=0){
  const s=new THREE.Shape(),x0=cx-w/2,y0=cy-d/2,x1=cx+w/2,y1=cy+d/2;
  s.moveTo(x0+r,y0);s.lineTo(x1-r,y0);s.quadraticCurveTo(x1,y0,x1,y0+r);s.lineTo(x1,y1-r);s.quadraticCurveTo(x1,y1,x1-r,y1);
  s.lineTo(x0+r,y1);s.quadraticCurveTo(x0,y1,x0,y1-r);s.lineTo(x0,y0+r);s.quadraticCurveTo(x0,y0,x0+r,y0);return s;
}
function roundedPath(THREE,w,d,r){const s=roundedShape(THREE,w,d,r),p=new THREE.Path();p.curves=s.curves;return p;}

function canvasTexture(k,w,h,draw){
  const {THREE,track}=k;const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw?.(ctx,w,h);
  const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return{canvas:c,ctx,texture:t};
}
function addTo(parent,o){parent.add(o);return o;}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

// A small label plate: dark glass with an accent edge, white text. Transparent so it can fade with the cutaway.
function labelPlate(k,text,accent,w,h){
  const {THREE,track}=k;
  const {texture}=canvasTexture(k,512,Math.round(512*h/w),(g,W,H)=>{
    g.clearRect(0,0,W,H);rr(g,4,4,W-8,H-8,H*.28);g.fillStyle='rgba(8,12,20,.88)';g.fill();g.lineWidth=Math.max(5,H*.07);g.strokeStyle=hex(accent);g.stroke();
    g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';let size=H*.56;g.font=`700 ${size}px "Segoe UI",Arial,Helvetica,sans-serif`;
    while(g.measureText(text).width>W*.84&&size>8){size-=2;g.font=`700 ${size}px "Segoe UI",Arial,Helvetica,sans-serif`;}
    g.fillText(text,W/2,H*.54);
  });
  const m=k.mesh(track(new THREE.PlaneGeometry(w,h)),track(new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,toneMapped:false})));
  m.castShadow=m.receiveShadow=false;m.renderOrder=3;m.userData.sensorKeep=true;m.name='chip-label-'+text.toLowerCase();return m;
}

// ------------------------------------------------------------------------------------------------ the screen
// A generic warm desktop: soft abstract wallpaper, a centred taskbar, a clock and the Wi-Fi glyph. No real logos.
function paintDesktop(g,w,h){
  const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#0b2a4f');bg.addColorStop(.55,'#123f73');bg.addColorStop(1,'#1d5c95');g.fillStyle=bg;g.fillRect(0,0,w,h);
  for(const [x,y,r,c] of [[.62,.5,.42,'rgba(120,190,255,.55)'],[.7,.45,.26,'rgba(200,230,255,.55)'],[.52,.62,.3,'rgba(70,140,230,.5)'],[.78,.6,.18,'rgba(255,255,255,.35)']]){
    const rg=g.createRadialGradient(x*w,y*h,0,x*w,y*h,r*w);rg.addColorStop(0,c);rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,w,h);
  }
  g.save();g.translate(w*.64,h*.5);for(let i=0;i<7;i++){g.rotate(Math.PI*2/7);g.beginPath();g.ellipse(w*.07,0,w*.11,h*.05,0,0,Math.PI*2);g.fillStyle=`rgba(${150+i*12},${200+i*5},255,.16)`;g.fill();}g.restore();
  // Desktop icons (pictograms only).
  for(let i=0;i<4;i++){const y=h*.05+i*h*.12;rr(g,w*.025,y,w*.045,w*.045,w*.008);g.fillStyle=['#f4c84a','#5aa7f0','#e9eef5','#62c48a'][i];g.fill();g.fillStyle='rgba(255,255,255,.75)';g.fillRect(w*.022,y+w*.052,w*.051,h*.012);}
}
function paintTaskbar(g,w,h,wifi,badge){
  const tb=h*.065;g.fillStyle='rgba(20,28,40,.86)';g.fillRect(0,h-tb,w,tb);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(0,h-tb,w,2);
  const n=7,s=tb*.62,gap=tb*.32,x0=w/2-(n*s+(n-1)*gap)/2,y=h-tb+(tb-s)/2;
  const cols=['#3d8bfd','#f4c84a','#e9eef5','#5ad1c8','#62c48a','#c58af9','#f2876b'];
  for(let i=0;i<n;i++){rr(g,x0+i*(s+gap),y,s,s,s*.22);g.fillStyle=i===0?'#cfe6ff':cols[i];g.fill();}
  // Start: a four-pane glyph drawn in white over the first tile.
  g.fillStyle='#1d5fc2';const q=s*.2;for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])g.fillRect(x0+s*.28+a*(q+s*.04),y+s*.28+b*(q+s*.04),q,q);
  g.fillStyle='#e8eef6';g.textAlign='right';g.textBaseline='middle';g.font=`600 ${tb*.32}px "Segoe UI",Arial,sans-serif`;g.fillText('9:41',w-tb*.4,h-tb*.62);
  g.font=`500 ${tb*.26}px "Segoe UI",Arial,sans-serif`;g.fillStyle='#b8c4d4';g.fillText('24/10/2026',w-tb*.4,h-tb*.28);
  if(wifi!=='hidden'){
    const cx=w-tb*3.1,cy=h-tb*.3,on=wifi==='on';g.lineCap='round';
    for(let i=1;i<=3;i++){g.beginPath();g.arc(cx,cy,tb*.14*i,-Math.PI*.75,-Math.PI*.25);g.lineWidth=tb*.07;g.strokeStyle=on?'#ffffff':'rgba(160,170,184,.65)';g.stroke();}
    g.beginPath();g.arc(cx,cy,tb*.05,0,Math.PI*2);g.fillStyle=on?'#ffffff':'rgba(160,170,184,.7)';g.fill();
    if(!on){g.beginPath();g.moveTo(cx-tb*.32,cy-tb*.5);g.lineTo(cx+tb*.32,cy+tb*.02);g.lineWidth=tb*.07;g.strokeStyle='#ff8a7a';g.stroke();
      g.textAlign='right';g.font=`600 ${tb*.3}px "Segoe UI",Arial,sans-serif`;g.fillStyle='#d6dde8';g.fillText('Offline',cx-tb*.5,h-tb*.5);}
    if(!on&&badge){const bw=w*.25,bh=h*.075,bx=w-bw-w*.02,by=h*.03;rr(g,bx,by,bw,bh,bh/2);g.fillStyle='rgba(16,22,32,.9)';g.fill();g.lineWidth=3;g.strokeStyle='#c24dff';g.stroke();
      g.fillStyle='#ffffff';g.textAlign='center';g.font=`600 ${bh*.42}px "Segoe UI",Arial,sans-serif`;g.fillText('Offline · on this laptop',bx+bw/2,by+bh*.54);}
  }
}

// ------------------------------------------------------------------------------------------------ the laptop
export function buildLaptop(k,{parent=k.root,x=0,y=0,z=0,ry=0,scale=1,finish='nightfall',lidAngle=110,screenSize=[1152,768]}={}){
  const {THREE,mat,track}=k;
  const W=.340,D=.244,H=.0128,T=.0048,R=.011;
  const group=new THREE.Group();group.name='laptop';group.position.set(x,y,z);group.rotation.y=ry;group.scale.setScalar(scale);parent.add(group);
  const add=(geo,m,px=0,py=0,pz=0,p=group)=>{const o=k.mesh(geo,m,px,py,pz);p.add(o);return o;};
  const shell=finish==='platinum'?0xc8c9c6:0x30333a;
  const M={
    shell:mat(shell,{metalness:.72,roughness:.36,envMapIntensity:1.2}),
    deck:mat(shell,{metalness:.68,roughness:.42,transparent:true,opacity:1}),
    well:mat(finish==='platinum'?0xb3b4b1:0x24262c,{metalness:.5,roughness:.55,transparent:true,opacity:1}),
    keys:mat(finish==='platinum'?0xd9d9d6:0x26282e,{metalness:.15,roughness:.58,transparent:true,opacity:1}),
    pad:mat(finish==='platinum'?0xd2d3d0:0x383b43,{metalness:.35,roughness:.22,transparent:true,opacity:1}),
    bezel:mat(0x040507,{metalness:.1,roughness:.08}),
    chrome:mat(0xe8eaee,{metalness:1,roughness:.14}),
    port:mat(0x0a0b0d,{roughness:.6}),
    pcb:null,
    substrate:mat(0x203a30,{roughness:.55,metalness:.2}),
    memory:mat(0x15181c,{roughness:.4,metalness:.3,emissive:ACCENTS.memory,emissiveIntensity:0}),
    copper:mat(0xc8794a,{metalness:.9,roughness:.3}),
    fan:mat(0x1d2126,{roughness:.6,metalness:.3}),
    blade:mat(0x2b3138,{roughness:.5,metalness:.2}),
    battery:mat(0x2a2d31,{roughness:.6,metalness:.25,emissive:ACCENTS.battery,emissiveIntensity:0}),
    ssd:mat(0x13314a,{roughness:.5,metalness:.2,emissive:ACCENTS.ssd,emissiveIntensity:0}),
    small:mat(0x7e8a93,{roughness:.5,metalness:.5}),
    fin:mat(0x6f777e,{metalness:.6,roughness:.5}),
  };
  // Board texture: dark navy with faint traces and pads.
  const pcbTex=canvasTexture(k,512,256,(g,w,h)=>{g.fillStyle='#132233';g.fillRect(0,0,w,h);g.strokeStyle='rgba(120,170,210,.18)';g.lineWidth=1.4;
    for(let i=0;i<70;i++){let px=rnd(i,1)*w,py=rnd(i,2)*h;g.beginPath();g.moveTo(px,py);for(let s=0;s<3;s++){if((i+s)%2)px+=(rnd(i,s+3)-.5)*160;else py+=(rnd(i,s+6)-.5)*90;g.lineTo(px,py);}g.stroke();}
    g.fillStyle='rgba(210,180,110,.35)';for(let i=0;i<160;i++)g.fillRect(rnd(i,9)*w,rnd(i,10)*h,3,2);}).texture;
  M.pcb=mat(0xffffff,{map:pcbTex,roughness:.7,metalness:.1});

  // ---- base: bottom plate, side walls (a ring, so the inside is hollow), deck plate on top.
  const bottom=new THREE.ExtrudeGeometry(roundedShape(THREE,W,D,R),{depth:.0012,bevelEnabled:true,bevelThickness:.0006,bevelSize:.0006,bevelSegments:2,curveSegments:10});bottom.rotateX(-Math.PI/2);
  add(track(bottom),M.shell,0,.0006,0).name='laptop-bottom';
  const ringShape=roundedShape(THREE,W,D,R);ringShape.holes.push(roundedPath(THREE,W-.007,D-.007,R-.003));
  const ring=new THREE.ExtrudeGeometry(ringShape,{depth:H-.0034,bevelEnabled:true,bevelThickness:.0006,bevelSize:.0005,bevelSegments:2,curveSegments:10});ring.rotateX(-Math.PI/2);
  add(track(ring),M.shell,0,.0018,0).name='laptop-walls';
  const deckGeo=new THREE.ExtrudeGeometry(roundedShape(THREE,W,D,R),{depth:.0006,bevelEnabled:true,bevelThickness:.0004,bevelSize:.0005,bevelSegments:2,curveSegments:10});deckGeo.rotateX(-Math.PI/2);
  const deckPlate=add(track(deckGeo),M.deck,0,H-.001,0);deckPlate.name='laptop-deck';
  // Keyboard: well, then instanced keys (15u wide, function row plus five rows).
  const U=.0186,KX=0,KZ=-.058,rows=[[...Array(14).fill(1),1],[...Array(13).fill(1),2],[1.5,...Array(12).fill(1),1.5],[1.75,...Array(11).fill(1),2.25],[2.25,...Array(10).fill(1),2.75],[1,1,1,1.25,5.5,1.25,1,1,1,1]];
  const kbW=15*U,kbD=U*.6+5*U;
  const well=add(track(new THREE.BoxGeometry(kbW+.004,.0003,kbD+.004)),M.well,KX,H+.00002,KZ);well.name='laptop-keyboard-well';
  const keyGeo=track(new THREE.BoxGeometry(1,1,1));let keyCount=0;rows.forEach(r=>keyCount+=r.length);
  const keys=new THREE.InstancedMesh(keyGeo,M.keys,keyCount);keys.name='laptop-keys';keys.castShadow=false;keys.receiveShadow=true;group.add(keys);
  {const m4=new THREE.Matrix4();let n=0,zc=KZ-kbD/2;rows.forEach((r,ri)=>{const dz=ri===0?U*.6:U;let xc=KX-kbW/2;for(const u of r){m4.compose(new THREE.Vector3(xc+u*U/2,H+.0005,zc+dz/2),new THREE.Quaternion(),new THREE.Vector3(u*U-.0024,.0011,dz-.0024));keys.setMatrixAt(n++,m4);xc+=u*U;}zc+=dz;});keys.instanceMatrix.needsUpdate=true;}
  const keyboard=new THREE.Object3D();keyboard.position.set(KX,H+.001,KZ);group.add(keyboard);
  // Large haptic touchpad: a glass slab flush with the deck, a hairline gap around it.
  const PZ=.064,PW=.168,PD=.098;
  const gap=add(track(new THREE.BoxGeometry(PW+.0012,.0002,PD+.0012)),M.well,0,H+.00002,PZ);
  const pad=add(track(new THREE.BoxGeometry(PW,.0004,PD)),M.pad,0,H+.00008,PZ);pad.name='laptop-touchpad';
  const touchpad=new THREE.Object3D();touchpad.position.set(0,H+.0003,PZ);group.add(touchpad);
  // Ports: left two USB-C and HDMI, right USB-C, USB-A, SD and the magnetic charger.
  const portsL=[[-.07,.0085,.0028],[-.05,.0085,.0028],[-.024,.014,.0045]],portsR=[[-.075,.016,.0028],[-.045,.0085,.0028],[-.02,.0125,.0045],[.02,.024,.0016]];
  for(const [pz,w,h] of portsL)add(track(new THREE.BoxGeometry(.0016,h,w)),M.port,-W/2+.0004,H*.48,pz);
  for(const [pz,w,h] of portsR)add(track(new THREE.BoxGeometry(.0016,h,w)),M.port,W/2-.0004,H*.48,pz);
  // Rubber feet (two long strips) so the shadow line under the chassis reads.
  for(const fz of [-.08,.085])add(track(new THREE.BoxGeometry(W-.06,.0012,.008)),M.port,0,-.0004,fz);
  const deck=[deckPlate,well,keys,gap,pad];

  // ---- lid: hinge pivot at the rear; screen face +z when open; mirrored four-square mark on the back.
  const lid=new THREE.Group();lid.name='laptop-lid';lid.position.set(0,H-.0015,-D/2+.0045);lid.rotation.x=-(lidAngle-90)*Math.PI/180;group.add(lid);
  const lidGeo=new THREE.ExtrudeGeometry(roundedShape(THREE,W,D,R,0,D/2),{depth:T-.001,bevelEnabled:true,bevelThickness:.0005,bevelSize:.0005,bevelSegments:2,curveSegments:10});lidGeo.translate(0,0,-T+.0005);
  add(track(lidGeo),M.shell,0,0,0,lid).name='laptop-lid-shell';
  add(track(new THREE.PlaneGeometry(W-.0025,D-.0025)),M.bezel,0,D/2,.00035,lid).name='laptop-bezel';
  const SW=.3195,SH=SW/1.5,SY=D/2+.0035;
  const [cw,ch]=screenSize;const sc=canvasTexture(k,cw,ch);
  const screenMat=track(new THREE.MeshBasicMaterial({map:sc.texture,toneMapped:false,color:0xe6e6e6}));
  const screenMesh=add(track(new THREE.PlaneGeometry(SW,SH)),screenMat,0,SY,.0006,lid);screenMesh.name='laptop-screen';screenMesh.castShadow=false;screenMesh.userData.sensorKeep=true;
  add(track(new THREE.CircleGeometry(.0011,12)),M.port,0,SY+SH/2+.0045,.0007,lid);
  {const q=.0085,gp=.0009;for(const [a,b] of [[-1,1],[1,1],[-1,-1],[1,-1]]){const o=add(track(new THREE.PlaneGeometry(q,q)),M.chrome,a*(q+gp)/2,D/2+.006+b*(q+gp)/2,-T-.0001,lid);o.rotation.y=Math.PI;o.castShadow=false;}}
  const screen={canvas:sc.canvas,ctx:sc.ctx,texture:sc.texture,mesh:screenMesh,width:cw,height:ch,wifi:'on',badge:false,last:null,desktop:paintDesktop,
    draw(fn,{taskbar=true}={}){this.last=[fn,taskbar];const g=this.ctx;g.save();g.clearRect(0,0,cw,ch);(fn||paintDesktop)(g,cw,ch);g.restore();if(taskbar){g.save();paintTaskbar(g,cw,ch,this.wifi,this.badge);g.restore();}this.texture.needsUpdate=true;},
    redraw(){const [fn,taskbar]=this.last||[null,true];this.draw(fn,{taskbar});},
    setWifi(state,{badge=false}={}){if(state===this.wifi&&badge===this.badge)return;this.wifi=state;this.badge=badge;this.redraw();}};
  screen.draw(null);

  // ---- the board (artistic licence): PCB, package (CPU + GPU dies), memory, NPU, SSD, battery, fans, heat pipes.
  const inside=new THREE.Group();inside.name='laptop-board';group.add(inside);
  const PCBY=.0022,pcbTop=PCBY+.0008;
  add(track(new THREE.BoxGeometry(W-.012,.0008,.128)),M.pcb,0,PCBY+.0004,-.051,inside).name='laptop-pcb';
  const chips={},dies={},parts={};
  const anchor=(id,px,py,pz,accent)=>{const o=new THREE.Object3D();o.name='chip-'+id;o.position.set(px,py,pz);inside.add(o);o.userData.accent=accent;o.userData.parts=[];chips[id]=o;return o;};
  // Die: dark silicon with an emissive core grid (cells lit in order by lightChip cores).
  function die(id,w,d,px,pz,cols,rows_){
    const accent=ACCENTS[id];const tex=canvasTexture(k,256,Math.round(256*d/w));
    const paint=(lit,amount)=>{const g=tex.ctx,cw2=tex.canvas.width,ch2=tex.canvas.height;g.fillStyle='#000';g.fillRect(0,0,cw2,ch2);
      const m=cw2*.06,cwid=(cw2-m*2)/cols,chgt=(ch2-m*2)/rows_;let i=0;
      for(let r=0;r<rows_;r++)for(let c=0;c<cols;c++,i++){const on=i<lit;g.fillStyle=on?'#ffffff':`rgba(255,255,255,${.28+.1*amount})`;g.fillRect(m+c*cwid+cwid*.12,m+r*chgt+chgt*.12,cwid*.76,chgt*.76);}
      g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=cw2*.02;g.strokeRect(m*.5,m*.5,cw2-m,ch2-m);tex.texture.needsUpdate=true;};
    paint(0,0);
    const dm=mat(0x0d1116,{roughness:.25,metalness:.6,emissive:accent,emissiveMap:tex.texture,emissiveIntensity:.35});
    const y=id==='npu'?pcbTop+.0011:pcbTop+.0015;
    const mesh=add(track(new THREE.BoxGeometry(w,.0008,d)),dm,px,y,pz,inside);mesh.name='die-'+id;
    const glowTex=glowTexture();const glow=add(track(new THREE.PlaneGeometry(w*2.4,d*2.4)),track(new THREE.MeshBasicMaterial({map:glowTex,color:accent,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false})),px,y+.0006,pz,inside);
    glow.rotation.x=-Math.PI/2;glow.castShadow=glow.receiveShadow=false;glow.renderOrder=2;glow.userData.sensorKeep=true;
    dies[id]=mesh;parts[id]={mesh,mat:dm,glow,paint,cells:cols*rows_,lit:-1,amount:-1};
    const a=anchor(id,px,y+.0004,pz,accent);a.userData.parts.push(mesh);return a;
  }
  let glowCache=null;
  function glowTexture(){if(glowCache)return glowCache;const {texture}=canvasTexture(k,128,128,(g)=>{const rg=g.createRadialGradient(64,64,4,64,64,64);rg.addColorStop(0,'rgba(255,255,255,1)');rg.addColorStop(.35,'rgba(255,255,255,.45)');rg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=rg;g.fillRect(0,0,128,128);});texture.colorSpace=THREE.NoColorSpace;glowCache=texture;return texture;}
  // Package: substrate with a CPU die (left) and a GPU die (right).
  const PKX=-.006,PKZ=-.06;
  add(track(new THREE.BoxGeometry(.076,.0011,.05)),M.substrate,PKX,pcbTop+.00055,PKZ,inside).name='laptop-package';
  add(track(new THREE.BoxGeometry(.078,.0004,.052)),M.copper,PKX,pcbTop+.0012,PKZ,inside).scale.set(1,1,1);
  // The copper frame is a stiffener ring around the dies: cut by covering its centre with substrate.
  add(track(new THREE.BoxGeometry(.072,.00045,.046)),M.substrate,PKX,pcbTop+.00125,PKZ,inside);
  die('cpu',.026,.03,PKX-.0205,PKZ,4,5);
  die('gpu',.036,.036,PKX+.0135,PKZ,8,6);
  // Memory: four LPDDR stacks in a row in front of the package.
  const memory=anchor('memory',PKX,pcbTop+.0016,PKZ+.036,ACCENTS.memory);
  for(let i=0;i<4;i++){const m=add(track(new THREE.BoxGeometry(.015,.0016,.011)),M.memory,PKX-.0255+i*.017,pcbTop+.0008,PKZ+.036,inside);memory.userData.parts.push(m);}
  parts.memory={mat:M.memory};
  // NPU: its own block to the right of the package, between the package and the right fan.
  add(track(new THREE.BoxGeometry(.021,.0009,.021)),M.substrate,.06,pcbTop+.00045,-.046,inside);
  die('npu',.015,.015,.06,-.046,4,4);
  // SSD: removable M.2 2230 module at the right edge, in front of the right fan.
  const ssd=anchor('ssd',.122,pcbTop+.0013,-.009,ACCENTS.ssd);
  {const m=add(track(new THREE.BoxGeometry(.03,.0012,.022)),M.ssd,.122,pcbTop+.0006,-.009,inside);ssd.userData.parts.push(m);add(track(new THREE.BoxGeometry(.009,.0014,.008)),M.small,.112,pcbTop+.0012,-.009,inside);add(track(new THREE.BoxGeometry(.01,.0014,.009)),M.small,.128,pcbTop+.0012,-.009,inside);}
  parts.ssd={mat:M.ssd};
  // Battery across the palm rest.
  const battery=anchor('battery',0,.0018+.0058,.064,ACCENTS.battery);
  {const bt=canvasTexture(k,512,160,(g,w,h)=>{g.fillStyle='#2b2f34';g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=3;for(let i=1;i<4;i++){g.beginPath();g.moveTo(i*w/4,8);g.lineTo(i*w/4,h-8);g.stroke();}
      g.fillStyle='rgba(255,255,255,.08)';g.fillRect(w*.38,h*.3,w*.24,h*.4);}).texture;
    const bm=mat(0xffffff,{map:bt,roughness:.6,metalness:.2,emissive:ACCENTS.battery,emissiveIntensity:0});parts.battery={mat:bm};
    const m=add(track(new THREE.BoxGeometry(.3,.0056,.096)),bm,0,.0018+.0028,.064,inside);battery.userData.parts.push(m);}
  // Fans with heat pipes and fin stacks.
  const fans=[];
  for(const side of [-1,1]){
    const fx=side*.115,fz=-.072,fr=.032,id=side<0?'fanL':'fanR';
    const f=anchor(id,fx,pcbTop+.006,fz,ACCENTS.fan);
    const wall=add(track(new THREE.CylinderGeometry(fr+.002,fr+.002,.0058,32,1,true)),M.fan,fx,pcbTop+.0029,fz,inside);wall.material.side=THREE.DoubleSide;
    const floor=add(track(new THREE.CylinderGeometry(fr+.002,fr+.002,.0004,32)),M.fan,fx,pcbTop+.0002,fz,inside);
    const rotor=new THREE.Group();rotor.position.set(fx,pcbTop+.003,fz);inside.add(rotor);
    add(track(new THREE.CylinderGeometry(.009,.009,.004,20)),M.fan,0,0,0,rotor);
    for(let b=0;b<13;b++){const bl=add(track(new THREE.BoxGeometry(.021,.0032,.0026)),M.blade,0,0,0,rotor);const a=b/13*Math.PI*2;bl.position.set(Math.cos(a)*.019,0,Math.sin(a)*.019);bl.rotation.set(.35,-a+.5,0);}
    rotor.userData.spin=side;fans.push(rotor);
    f.userData.parts.push(wall,floor);
    // Fin stack at the rear vent.
    const fins=add(track(new THREE.BoxGeometry(.06,.0055,.009)),M.fin,fx,pcbTop+.0028,-.11,inside);fins.name='laptop-fins';
    for(let i=0;i<14;i++)add(track(new THREE.BoxGeometry(.0006,.0056,.0092)),M.fan,fx-.028+i*.0043,pcbTop+.0029,-.11,inside);
    // Two flattened copper heat pipes from the package to the fin stack.
    for(const off of [0,1]){
      const pts=[[PKX+side*.012,pcbTop+.0022,PKZ-.012-off*.008],[PKX+side*.04,pcbTop+.0026,PKZ-.03-off*.006],[fx-side*.02,pcbTop+.0045,-.103-off*.002],[fx+side*.02,pcbTop+.0045,-.103-off*.002]].map(p=>new THREE.Vector3(...p));
      const tube=add(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.0019,8,false)),M.copper,0,0,0,inside);tube.scale.y=1;tube.name='laptop-heat-pipe';
    }
  }
  // Small parts: capacitors and regulators, deterministic and clear of the big parts.
  {const avoid=[[PKX,PKZ,.05,.04],[PKX,PKZ+.036,.04,.01],[.06,-.046,.016,.016],[-.115,-.072,.04,.04],[.115,-.072,.04,.04],[.122,-.009,.02,.016],[0,-.105,.15,.01]];
    let n=0;for(let i=0;i<220&&n<70;i++){const px=(rnd(i,21)-.5)*(W-.03),pz=-.112+rnd(i,22)*.12;if(avoid.some(([ax,az,hw,hd])=>Math.abs(px-ax)<hw&&Math.abs(pz-az)<hd))continue;
      const big=rnd(i,23)>.75,s=big?.006:.0025;add(track(new THREE.BoxGeometry(s,big?.0012:.0008,s*(big?1:.6))),big?M.fan:M.small,px,pcbTop+.0005,pz,inside);n++;}}

  // Label plates over the parts, standing and leaning back so a camera above and in front can read them.
  const LABELS={cpu:['CPU',0,.022],gpu:['GPU',0,.026],npu:['NPU',0,.017],memory:['MEMORY',0,.012],ssd:['SSD',0,.016],battery:['BATTERY',0,.0],fanL:['FAN',0,.0],fanR:['FAN',0,.0]};
  for(const [id,[text,,dz]] of Object.entries(LABELS)){
    const a=chips[id],w=text.length>4?.034:.022,h=.0085,plate=labelPlate(k,text,a.userData.accent,w,h);inside.add(plate);
    plate.position.set(a.position.x,H+.0062,a.position.z+dz+(id==='battery'?0:.004));plate.rotation.x=-.75;if(id==='battery'||id.startsWith('fan')){plate.position.y=H+.004;}
    a.userData.label=plate;
  }
  // Fan glow (lightChip on a fan): fans have no emissive die, so they use the blade material.
  parts.fanL={mat:M.blade,accent:ACCENTS.fan};parts.fanR=parts.fanL;

  // ---- behaviour
  let cut=0;
  function setCutaway(u){
    cut=Math.min(1,Math.max(0,u));
    const o=1-cut;
    M.deck.opacity=.06+.94*o**1.4;M.deck.depthWrite=cut<.5;
    M.well.opacity=.05+.95*o**1.4;M.well.depthWrite=cut<.5;
    M.keys.opacity=.1+.9*o**1.4;M.keys.depthWrite=cut<.5;
    M.pad.opacity=.08+.92*o**1.4;M.pad.depthWrite=cut<.5;
    const lo=smooth(.35,.85,cut);for(const id in chips){const p=chips[id].userData.label;p.material.opacity=lo;p.visible=lo>.01;}
    inside.visible=cut>.001;
  }
  function lightChip(id,amount=0,{cores}={}){
    const p=parts[id];if(!p)return;const a=Math.min(1,Math.max(0,amount));
    if(p.paint){
      p.mat.emissiveIntensity=.35+a*2.4;p.glow.material.opacity=a*.85;p.glow.visible=a>.01;
      const lit=cores===undefined?(a>.02?p.cells:0):Math.round(Math.min(1,Math.max(0,cores))*p.cells);
      if(lit!==p.lit||Math.abs(a-p.amount)>.05){p.paint(lit,a);p.lit=lit;p.amount=a;}
    }else if(p.mat.emissive){p.mat.emissiveIntensity=a*1.1;}
    const label=chips[id]?.userData.label;if(label){label.scale.setScalar(1+.12*a);}
  }
  function flowPath(points,{radius=.0011,speed=.5,repeat=3,glow=[.4,1.5,2.4],base=[.02,.06,.1]}={}){
    const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));
    const flow=track(createFlowMaterial({speed:speed/Math.max(.01,path.getLength()*10),repeat,base,glow}));flow.transparent=true;flow.depthWrite=false;
    const mesh=add(track(new THREE.TubeGeometry(path,Math.max(24,points.length*24),radius,6,false)),flow);mesh.castShadow=mesh.receiveShadow=false;mesh.visible=false;mesh.renderOrder=4;mesh.name='laptop-flow';mesh.userData.sensorKeep=true;
    return{mesh,update(t,active){mesh.visible=!!active;flow.uniforms.uTime.value=t;}};
  }
  const lidPoint=(px,py,pz)=>{const v=new THREE.Vector3(px,py,pz).applyEuler(lid.rotation).add(lid.position);return v.toArray();};
  function point(name){
    if(name==='screen')return lidPoint(0,SY,.002);
    if(name==='camera')return lidPoint(0,SY+SH/2+.0045,.002);
    if(name==='mic')return lidPoint(.02,SY+SH/2+.0045,.002);
    if(name==='keyboard')return keyboard.position.toArray();
    if(name==='touchpad')return touchpad.position.toArray();
    if(name==='portL')return[-W/2,H*.5,-.05];
    if(name==='portR')return[W/2,H*.5,-.045];
    if(chips[name])return chips[name].position.toArray();
    return[0,H,0];
  }
  function update(t,{fans:speed=.4}={}){for(const f of fans)f.rotation.y=-f.userData.spin*t*(2+28*speed);}
  setCutaway(0);for(const id of ['cpu','gpu','npu'])lightChip(id,0);update(0);
  return{group,lid,screen,chips,dies,deck,keyboard,touchpad,board:inside,size:{W,D,H,T},materials:M,setCutaway,get cutaway(){return cut;},lightChip,flowPath,point,update};
}

// ------------------------------------------------------------------------------------------------ the desk
export function buildDesk(k,{parent=k.root,x=0,z=0,ry=0,scale=1,width=1.5,depth=.75,height=.74,window:win=false,notebook=true,pen=true,mug=true,phone=true,plant=true}={}){
  const {THREE,mat,track}=k;
  const group=new THREE.Group();group.name='desk';group.position.set(x,0,z);group.rotation.y=ry;group.scale.setScalar(scale);parent.add(group);
  const add=(geo,m,px=0,py=0,pz=0,p=group)=>{const o=k.mesh(geo,m,px,py,pz);p.add(o);return o;};
  const wood=canvasTexture(k,1024,512,(g,w,h)=>{g.fillStyle='#b9864f';g.fillRect(0,0,w,h);
    for(let i=0;i<140;i++){const y=rnd(i,1)*h,a=.04+rnd(i,2)*.1;g.strokeStyle=rnd(i,3)>.5?`rgba(120,70,30,${a})`:`rgba(240,200,150,${a})`;g.lineWidth=1+rnd(i,4)*3;g.beginPath();g.moveTo(0,y);
      for(let s=1;s<=8;s++)g.lineTo(s*w/8,y+Math.sin(s*1.3+i)*6*rnd(i,5));g.stroke();}
    for(let i=1;i<4;i++){g.fillStyle='rgba(90,50,20,.18)';g.fillRect(0,i*h/4,w,2);}}).texture;
  const T=.032;
  const top=add(track(new THREE.BoxGeometry(width,T,depth)),mat(0xffffff,{map:wood,roughness:.5,metalness:0}),0,height-T/2,0);top.name='desk-top';
  const legM=mat(0x2b2c2f,{metalness:.6,roughness:.4});
  for(const sx of [-1,1]){add(track(new THREE.BoxGeometry(.05,height-T,.05)),legM,sx*(width/2-.08),(height-T)/2,-depth/2+.07);add(track(new THREE.BoxGeometry(.05,height-T,.05)),legM,sx*(width/2-.08),(height-T)/2,depth/2-.07);
    add(track(new THREE.BoxGeometry(.04,.04,depth-.14)),legM,sx*(width/2-.08),.1,0);}
  add(track(new THREE.BoxGeometry(width-.16,.06,.02)),legM,0,height-T-.04,-depth/2+.07);
  const items={},spots={laptop:[0,.14],notebook:[-.5,.12],mug:[.42,-.06],phone:[.37,.24],plant:[-.62,-.24]};
  const at=(name,[sx,sz],r=0)=>{const g=new THREE.Group();g.name='desk-'+name;g.position.set(sx,height,sz);g.rotation.y=r;group.add(g);items[name]=g;return g;};
  if(notebook){
    const g=at('notebook',spots.notebook,.18);
    const cover=canvasTexture(k,512,720,(c,w,h)=>{c.fillStyle='#0a3d7a';c.fillRect(0,0,w,h);c.fillStyle='rgba(255,255,255,.05)';for(let i=0;i<40;i++)c.fillRect(0,i*18,w,1);
      c.fillStyle='#ffffff';c.textBaseline='alphabetic';c.font='700 64px Arial,Helvetica,sans-serif';const x0=48,y0=h-70;c.fillText('Data',x0,y0);const dw=c.measureText('Data').width;
      c.fillStyle='#00a3e0';c.font='700 38px Arial,Helvetica,sans-serif';c.fillText('#',x0+dw+2,y0-30);const hw=c.measureText('#').width;c.fillStyle='#ffffff';c.font='700 64px Arial,Helvetica,sans-serif';c.fillText('3',x0+dw+hw+4,y0);
      c.fillStyle='#00a3e0';c.fillRect(x0,y0+18,180,5);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(w-36,0,6,h);}).texture;
    add(track(new THREE.BoxGeometry(.15,.012,.21)),mat(0xf3eee2,{roughness:.9}),0,.006,0,g);
    const c=add(track(new THREE.PlaneGeometry(.152,.212)),mat(0xffffff,{map:cover,roughness:.7}),0,.0124,0,g);c.rotation.x=-Math.PI/2;c.name='desk-notebook-cover';
    add(track(new THREE.BoxGeometry(.152,.0012,.212)),mat(0x0a3d7a,{roughness:.7}),0,.0006,0,g);
    add(track(new THREE.BoxGeometry(.006,.0125,.214)),mat(0x0d2f5c,{roughness:.6}),-.074,.0063,0,g);
  }
  if(pen){const g=at('pen',[spots.notebook[0]+.11,spots.notebook[1]+.02],-.5);const b=add(track(new THREE.CylinderGeometry(.0045,.0045,.14,12)),mat(0x1b1d22,{metalness:.5,roughness:.3}),0,.0045,0,g);b.rotation.x=Math.PI/2;
    const tip=add(track(new THREE.ConeGeometry(.0045,.012,12)),mat(0xc9cdd2,{metalness:.9,roughness:.2}),0,.0045,.076,g);tip.rotation.x=Math.PI/2;const clip=add(track(new THREE.BoxGeometry(.002,.002,.04)),mat(0xc9cdd2,{metalness:.9,roughness:.2}),0,.0095,-.04,g);}
  if(mug){const g=at('mug',spots.mug,.6);const cer=mat(0xf2ede4,{roughness:.35});
    const body=add(track(new THREE.CylinderGeometry(.042,.038,.095,28,1,true)),cer,0,.0475,0,g);body.material.side=THREE.DoubleSide;
    add(track(new THREE.CylinderGeometry(.038,.038,.006,28)),cer,0,.003,0,g);
    add(track(new THREE.CircleGeometry(.04,28)),mat(0x3b2416,{roughness:.2}),0,.08,0,g).rotation.x=-Math.PI/2;
    const h=add(track(new THREE.TorusGeometry(.025,.0065,10,20,Math.PI)),cer,.042,.05,0,g);h.rotation.z=-Math.PI/2;
    add(track(new THREE.TorusGeometry(.0415,.003,8,28)),cer,0,.095,0,g).rotation.x=Math.PI/2;}
  if(phone){const g=at('phone',spots.phone,-.35);
    const shape=roundedShape(THREE,.072,.152,.009);const geo=new THREE.ExtrudeGeometry(shape,{depth:.006,bevelEnabled:true,bevelThickness:.0012,bevelSize:.0012,bevelSegments:2,curveSegments:8});geo.rotateX(-Math.PI/2);
    add(track(geo),mat(0x2e3a48,{metalness:.5,roughness:.3}),0,.0012,0,g).name='desk-phone';
    add(track(new THREE.BoxGeometry(.03,.002,.03)),mat(0x1a1f26,{metalness:.6,roughness:.25}),-.016,.0094,-.052,g);
    for(const [a,b] of [[-.024,-.06],[-.009,-.06],[-.024,-.045]])add(track(new THREE.CylinderGeometry(.005,.005,.0025,16)),mat(0x0a0c10,{roughness:.1,metalness:.3}),a+.0005,.0098,b+.0075,g);}
  if(plant){const g=at('plant',spots.plant,0);
    add(track(new THREE.CylinderGeometry(.065,.05,.12,24)),mat(0xd9c7ae,{roughness:.8}),0,.06,0,g);add(track(new THREE.CylinderGeometry(.06,.06,.008,24)),mat(0x3a2a1e,{roughness:1}),0,.116,0,g);
    const leaf=mat(0x4f8a3e,{roughness:.7}),leaf2=mat(0x6aa64f,{roughness:.7});
    for(let i=0;i<14;i++){const a=i*2.4,r=.02+rnd(i,7)*.05,hgt=.16+rnd(i,8)*.16;const l=add(track(new THREE.SphereGeometry(.03,10,8)),i%3?leaf:leaf2,Math.cos(a)*r,.12+hgt*.6,Math.sin(a)*r,g);l.scale.set(.55,1.6,.25);l.rotation.set(Math.sin(a)*.5,a,Math.cos(a)*.6);}}
  let windowGroup=null;
  if(win){
    const {offset=.35,width:ww=2.6,height:wh=2.0}=typeof win==='object'?win:{};
    windowGroup=new THREE.Group();windowGroup.name='desk-window';windowGroup.position.set(0,0,-depth/2-offset);group.add(windowGroup);
    const wallM=mat(0xefe6d8,{roughness:.95});
    add(track(new THREE.BoxGeometry(ww,wh,.08)),wallM,0,wh/2,-.04,windowGroup).name='desk-window-wall';
    const sky=canvasTexture(k,256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#fff4dc');gr.addColorStop(.6,'#ffe9c4');gr.addColorStop(1,'#f6d7a8');g.fillStyle=gr;g.fillRect(0,0,w,h);
      g.fillStyle='rgba(150,175,130,.22)';for(let i=0;i<12;i++){g.beginPath();g.arc(rnd(i,3)*w,h*.9-rnd(i,4)*h*.15,20+rnd(i,5)*30,0,Math.PI*2);g.fill();}}).texture;
    const glass=add(track(new THREE.PlaneGeometry(1.2,1.0)),track(new THREE.MeshBasicMaterial({map:sky,toneMapped:false,color:0xd6d2cc})),-.2,1.35,.002,windowGroup);glass.name='desk-window-glass';
    const frame=mat(0xfaf7f0,{roughness:.6});
    for(const [fx,fy,fw,fh] of [[-.2,1.86,1.28,.04],[-.2,.84,1.28,.04],[-.82,1.35,.04,1.06],[.42,1.35,.04,1.06],[-.2,1.35,.03,1.0],[-.2,1.35,1.2,.025]])add(track(new THREE.BoxGeometry(fw,fh,.05)),frame,fx,fy,.02,windowGroup);
    add(track(new THREE.BoxGeometry(1.36,.03,.14)),frame,-.2,.81,.06,windowGroup);
  }
  return{group,top:height,width,depth,spots,items,window:windowGroup};
}

// laptop.point(name) in the local coordinates of `space` (an Object3D): pass the seated person's parent.
export function pointIn(laptop,name,space){
  const v=new laptop.group.position.constructor(...laptop.point(name));
  laptop.group.updateWorldMatrix(true,false);space.updateWorldMatrix(true,false);
  return space.worldToLocal(laptop.group.localToWorld(v)).toArray();
}
// The same, in the desk's parent's coordinates (the person's parent when desk, laptop and person share one parent).
export function deskOn(desk,laptop,name){return pointIn(laptop,name,desk.group.parent);}

// ------------------------------------------------------------------------------------------------ the person
export function seatedPerson(k,{parent=k.root,x=0,z=0,ry=0,scale=1,seat=.47,chair=true,shirt=0xe9e4da,jacket=0x2f4a6b,pants=0x2b2f38,hair=0x3a2a1e,skin=0xd6a27e,keyboard=null,screen=null,touchpad=null,name='seated-person'}={}){
  const {THREE,mat,track}=k;
  const group=new THREE.Group();group.name=name;group.position.set(x,0,z);group.rotation.y=ry;group.scale.setScalar(scale);parent.add(group);
  const add=(geo,m,px=0,py=0,pz=0,p=group)=>{const o=k.mesh(geo,m,px,py,pz);p.add(o);return o;};
  let chairGroup=null;
  if(chair){
    chairGroup=new THREE.Group();chairGroup.name=name+'-chair';group.add(chairGroup);
    const fabric=mat(0x34373d,{roughness:.9}),frame=mat(0x1b1d21,{metalness:.5,roughness:.4}),chromeM=mat(0xbfc4c9,{metalness:.9,roughness:.25});
    const seatGeo=new THREE.ExtrudeGeometry(roundedShape(THREE,.48,.46,.06),{depth:.05,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:3});seatGeo.rotateX(-Math.PI/2);
    add(track(seatGeo),fabric,0,seat-.062,.01,chairGroup);
    const backGeo=new THREE.ExtrudeGeometry(roundedShape(THREE,.44,.5,.08),{depth:.04,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:3});
    const back=add(track(backGeo),fabric,0,seat+.08,-.2,chairGroup);back.rotation.x=-.12;back.geometry.translate(0,.25,-.02);
    add(track(new THREE.BoxGeometry(.05,.24,.03)),frame,0,seat-.02,-.2,chairGroup).rotation.x=-.1;
    add(track(new THREE.CylinderGeometry(.022,.026,seat-.15,14)),chromeM,0,(seat-.15)/2+.08,0,chairGroup);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.3,leg=add(track(new THREE.BoxGeometry(.04,.03,.3)),frame,Math.sin(a)*.15,.075,Math.cos(a)*.15,chairGroup);leg.rotation.y=a;
      add(track(new THREE.SphereGeometry(.025,10,8)),frame,Math.sin(a)*.29,.025,Math.cos(a)*.29,chairGroup);}
    for(const s of [-1,1]){add(track(new THREE.BoxGeometry(.05,.025,.24)),frame,s*.26,seat+.2,-.02,chairGroup);add(track(new THREE.BoxGeometry(.025,.2,.03)),frame,s*.26,seat+.09,-.1,chairGroup);}
  }
  const actors=createActors({...k,root:group});
  const person=actors.person({vest:jacket,shirt,pants,helmet:hair,skin,name:name+'-body'});
  // An office worker, not a site worker: no hi-vis bands, no helmet brim (the helmet dome reads as hair).
  person.group.traverse(o=>{const p=o.geometry?.parameters;if(!p)return;
    if(o.geometry.type==='BoxGeometry'&&Math.abs(p.height-.035)<1e-6&&Math.abs(p.width-.38)<1e-6)o.visible=false;
    if(o.geometry.type==='CylinderGeometry'&&Math.abs(p.radiusTop-.15)<1e-6)o.visible=false;
    if(o.material?.emissiveIntensity===.12)o.material.emissiveIntensity=0;});
  // A neck (the actor rig floats the head ~9 cm over the chest, invisible at site scale, obvious at a desk) and hair
  // that covers the back of the head, so the hair dome reads as hair and not a helmet.
  {const skinM=mat(skin,{roughness:.8}),hairM=mat(hair,{roughness:.75});
    const neckMesh=k.mesh(track(new THREE.CylinderGeometry(.04,.046,.12,14)),skinM);neckMesh.name="neck";person.joints.neck.add(neckMesh);neckMesh.position.set(0,.03,-.005);person.joints.neck.position.y=.5;
    const back=k.mesh(track(new THREE.SphereGeometry(.108,16,12)),hairM);back.name="hair-back";person.joints.head.add(back);back.position.set(0,.115,-.022);back.scale.set(.98,.95,.92);}
  // Softer forms for a figure seen this close: the rig's boxes become rounded capsules of the same size.
  const soft=[];person.group.traverse(o=>{if(o.isMesh&&o.visible&&o.geometry.type==='BoxGeometry')soft.push(o);});
  // Hands: a flat mitten (wide, long along the forearm, thin palm-to-back), not an egg. The forearm runs along the
  // elbow's -y and its z is the back of the hand when the arm reaches forward, so z is the thin axis.
  person.group.traverse(o=>{if(o.isMesh&&o.geometry.type==='SphereGeometry'&&Math.abs(o.geometry.parameters.radius-.05)<1e-6){o.scale.set(.8,1.3,.4);o.position.y=-.33;}});
  // Long limbs become capsules; the torso, hips and shoes become rounded boxes (a capsule torso reads as a second head).
  for(const o of soft){const {width:w,height:h,depth:d}=o.geometry.parameters;let g;
    if(h>2.2*Math.max(w,d)){g=new THREE.CapsuleGeometry(.5,1,6,14);g.scale(w,h/2,d);}
    else{const b=Math.min(w,h,d)*.22,r=Math.min(w,h)*.22;g=new THREE.ExtrudeGeometry(roundedShape(THREE,w-2*b,h-2*b,r),{depth:Math.max(.001,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:6});g.translate(0,0,-(d-2*b)/2);}
    track(g);o.geometry.dispose();o.geometry=g;}
  const J=person.joints,right=J.arms.find(a=>a.side<0),left=J.arms.find(a=>a.side>0);
  const attach=arm=>{const o=new THREE.Object3D();o.name='hand';o.position.set(0,-.3,0);arm.elbow.add(o);return o;};
  const hands={right:attach(right),left:attach(left)};
  const tmp=new THREE.Vector3();
  const toBody=p=>{tmp.set(...p);parent.updateWorldMatrix(true,false);parent.localToWorld(tmp);person.group.updateWorldMatrix(true,true);return person.group.worldToLocal(tmp.clone());};
  // Closed-form two-bone arm (upper .3, fore .3 to the hand) aimed at a point in torso space.
  function reach(arm,targetBody){
    const torso=J.torso;torso.updateWorldMatrix(true,false);const t=torso.worldToLocal(person.group.localToWorld(targetBody.clone())).sub(arm.shoulder.position);
    const d=Math.min(.598,Math.max(.12,t.length())),cosb=Math.min(1,Math.max(-1,d*d/.18-1)),b=-Math.acos(cosb);
    const py=-.3-.3*Math.cos(b),pz=-.3*Math.sin(b),c=Math.asin(Math.min(1,Math.max(-1,t.x/Math.max(1e-4,-py))));
    const a=Math.atan2(t.z,t.y)-Math.atan2(pz,py*Math.cos(c));
    arm.shoulder.rotation.set(a,0,c);arm.elbow.rotation.set(b,0,0);
  }
  const keyB=()=>keyboard?toBody(keyboard):new THREE.Vector3(0,.76,.42);
  const screenB=()=>screen?toBody(screen):new THREE.Vector3(0,.95,.7);
  // Hand targets (body space) for each mode at time t.
  function targets(mode,t,pointAt){
    const K=keyB();
    if(mode==='type'){const tap=s=>.006*Math.max(0,Math.sin(t*(11+s*1.3)+s*1.9))**3;
      return{right:K.clone().add(new THREE.Vector3(-.075+.012*Math.sin(t*1.7),.012+tap(1),.0)),left:K.clone().add(new THREE.Vector3(.075+.01*Math.sin(t*1.3+1),.012+tap(-1),.0))};}
    if(mode==='rest')return{right:K.clone().add(new THREE.Vector3(-.12,.005,.13)),left:K.clone().add(new THREE.Vector3(.13,.005,.14))};
    if(mode==='mouse'){const P=touchpad?toBody(touchpad):K.clone().add(new THREE.Vector3(0,0,.12));return{right:P.add(new THREE.Vector3(-.02+.025*Math.sin(t*.9),.012,.01+.02*Math.sin(t*.63+1))),left:new THREE.Vector3(.13,seat+.2,.3)};}
    if(mode==='lap')return{right:new THREE.Vector3(-.12,seat+.2,.3),left:new THREE.Vector3(.12,seat+.2,.3)};
    if(mode==='point'){const P=pointAt?toBody(pointAt):screenB();const S=new THREE.Vector3(-.235,J.pelvis.position.y+.56,.0);const dir=P.clone().sub(S);const reachTo=S.clone().add(dir.multiplyScalar(Math.min(1,.56/dir.length())));
      return{right:reachTo,left:K.clone().add(new THREE.Vector3(.13,.005,.14))};}
    if(mode==='phone')return{right:new THREE.Vector3(-.05,J.pelvis.position.y+.72,.3),left:K.clone().add(new THREE.Vector3(.13,.005,.14))};
    if(mode==='think')return{right:new THREE.Vector3(-.03,J.pelvis.position.y+.66,.2),left:K.clone().add(new THREE.Vector3(.13,.005,.14))};
    return targets('rest',t);
  }
  function pose(t=0,{mode='type',to=null,mix=0,point:pointAt=null,look=null,turn=0,lean=null}={}){
    // Body: seated. Hip joint sits .09 above the seat top so the thigh rests on the cushion; shins drop to the floor.
    J.pelvis.position.y=seat+.09;J.pelvis.rotation.set(0,0,0);
    for(const leg of J.legs){leg.hip.rotation.set(-1.5,0,leg.side*.08);leg.knee.rotation.set(1.32,0,0);leg.ankle.rotation.set(-(leg.hip.rotation.x+leg.knee.rotation.x),0,0);}
    const m=Math.min(1,Math.max(0,mix)),L=(a,b)=>a+(b-a)*m;
    const leanFor=md=>md==='type'||md==='mouse'?.14:md==='point'?.18:md==='lap'?-.06:md==='phone'?.02:.08,lookFor=md=>md==='type'||md==='mouse'?.42:md==='point'?.28:md==='phone'?.35:md==='lap'?.2:.3;
    J.torso.rotation.set(lean??L(leanFor(mode),leanFor(to||mode)),0,0);
    J.head.rotation.set(look??L(lookFor(mode),lookFor(to||mode))+.03*Math.sin(t*.7),0,0);J.neck.rotation.set(0,turn+.06*Math.sin(t*.37),0);
    person.group.updateWorldMatrix(true,true);
    const A=targets(mode,t,pointAt),B=to?targets(to,t,pointAt):A;
    reach(right,A.right.clone().lerp(B.right,m));reach(left,A.left.clone().lerp(B.left,m));
  }
  pose(0);
  return{group,chair:chairGroup,person,hands,joints:J,pose};
}

// ------------------------------------------------------------------------------------------------ the chip view
// "On the chip": the deck turns to glass, the scene around the laptop dims, the target die lights and a data path
// pulses. Pure in (amount, t): materials are rescaled from their stored originals every call.
export function chipView(k,laptop,{target='npu',path=null,keep=[],dim=.22}={}){
  const {THREE}=k;
  const keepSet=new Set();const mark=o=>o.traverse(c=>keepSet.add(c));
  mark(laptop.board);mark(laptop.screen.mesh);keep.forEach(mark);
  const keepMats=new Set();keepSet.forEach(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>keepMats.add(m));});
  const dimmed=new Map();
  k.root.traverse(o=>{if(!o.isMesh||keepSet.has(o)||!o.material||Array.isArray(o.material))return;const m=o.material;if(keepMats.has(m)||dimmed.has(m)||!m.color||m.isShaderMaterial)return;
    dimmed.set(m,{color:m.color.clone(),emissive:m.emissive?.clone()});});
  const flow=path?laptop.flowPath(path,{glow:target==='cpu'?[.3,1.4,2.6]:target==='gpu'?[.6,2.4,.8]:[1.8,.6,2.6]}):null;
  const others=['cpu','gpu','npu'].filter(id=>id!==target);
  function set(amount=0,t=0){
    const a=Math.min(1,Math.max(0,amount)),f=1-a*(1-dim);
    laptop.setCutaway(Math.max(a,0));
    for(const [m,o] of dimmed){m.color.copy(o.color).multiplyScalar(f);if(o.emissive)m.emissive.copy(o.emissive).multiplyScalar(f);}
    laptop.lightChip(target,a*(.75+.25*Math.sin(t*5)**2));for(const id of others)laptop.lightChip(id,0);
    for(const id in laptop.chips){const l=laptop.chips[id].userData.label;if(id!==target&&l)l.material.opacity*=1-.55*a;}
    flow?.update(t,a>.5);
  }
  function restore(){set(0,0);}
  return{set,restore,path:flow};
}
