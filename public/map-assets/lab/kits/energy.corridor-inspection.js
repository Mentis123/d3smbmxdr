// E3 "A drone finds a stretch of line to inspect": a power-line corridor through bush. Three lattice towers carry
// three conductors each (the electrical.js pattern: two outer phases on a crossarm, one on the peak). A drone lifts
// from the pad by the depot hut, crabs along the far side of the line with its gimbal on the conductors, and
// pauses at span 2 where one tree's limb reaches up toward the near conductor. The growth is already there: the
// survey reveals it, nothing grows. Imagery goes up in a short burst (drone -> hut mast -> site GPU), not a
// continuous link. In Review a vegetation crew ute drives to span 2 and the crew member looks up at the limb while
// the drone flies home. Variation: low sun glare on the gimbal camera; no mask, the drone flies another pass.
import {createDrone} from '../rigs/drone.js';

const LINE_Z=-.35,TOWERS=[-2.3,.1,2.5],H=3.6,ARM_Y=H-.5,ARM=.74,INS=.26,SAG=.34;
const TRACK_Z=.45,EDGE=3.42;
const HUT=[-2.85,1.3],PAD=[-1.95,1.45],MAST=[-3.15,.75];
const TARGET=[1.36,2.3,.6];                          // where the gimbal looks: the limb reaching up to the near conductor
const HOVER=[1.45,3.45,-1.2];
const SPIN_ON=1.4,LIFT=2.0,ARRIVE=7.4,AIM0=7.4,AIM1=8.4,DEPART=18.6,HOME_T=24.0,SPIN_OFF=24.4;
const UP0=8.5,UP1=10.1;                                // one short upload burst, before the camera view
const UTE0=16.6,UTE1=19.6,P_T0=19.9,P_T1=22.4;
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};

export function buildKit(k){
  const {THREE,root,box,cylinder,mesh,mat,steel,dark,concrete,track,props,actors}=k;
  const V=(...a)=>new THREE.Vector3(...a);
  // Thin struts with few segments: a lattice tower is a lot of members.
  const UPY=V(0,1,0);
  function strut(a,b,r,m,parent=root){const av=V(...a),bv=V(...b),len=av.distanceTo(bv);const o=mesh(track(new THREE.CylinderGeometry(r,r,len,6)),m);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(UPY,bv.sub(av).normalize());if(parent!==root)parent.add(o);return o;}

  // ---- Ground: dry grass, a dirt access track under the line, low scrub ----
  const gc=document.createElement('canvas');gc.width=gc.height=256;const gg=gc.getContext('2d');gg.fillStyle='#7d7a48';gg.fillRect(0,0,256,256);
  for(let i=0;i<2600;i++){const v=rnd(i,1);gg.fillStyle=v<.4?'#6a6a3c':v<.7?'#8f8752':v<.9?'#5d6638':'#a39a63';gg.fillRect(rnd(i,2)*256,rnd(i,3)*256,1+rnd(i,4)*2,2+rnd(i,5)*4);}
  const grassTex=track(new THREE.CanvasTexture(gc));grassTex.wrapS=grassTex.wrapT=THREE.RepeatWrapping;grassTex.repeat.set(4,2.5);grassTex.colorSpace=THREE.SRGBColorSpace;
  const grass=box(6.85,.01,4.25,mat(0xffffff,{map:grassTex,roughness:1}),0,.003,0);grass.castShadow=false;
  const tc=document.createElement('canvas');tc.width=256;tc.height=32;const tg=tc.getContext('2d');tg.fillStyle='#a07c55';tg.fillRect(0,0,256,32);
  for(let i=0;i<500;i++){tg.fillStyle=rnd(i,7)<.5?'#8b6a47':'#b48d63';tg.fillRect(rnd(i,8)*256,rnd(i,9)*32,2+rnd(i,10)*5,1+rnd(i,11)*2);}
  for(const y of [8,23]){tg.fillStyle='#7a5c3d';tg.fillRect(0,y,256,3);}
  const trackTex=track(new THREE.CanvasTexture(tc));trackTex.wrapS=THREE.RepeatWrapping;trackTex.repeat.set(5,1);trackTex.colorSpace=THREE.SRGBColorSpace;
  const dirt=box(6.85,.006,.72,mat(0xffffff,{map:trackTex,roughness:1}),0,.01,TRACK_Z);dirt.castShadow=false;

  // ---- Eucalypt-style trees: pale trunk, a few limbs, clumped crowns (deformed icosahedra, faceted) ----
  const clumpGeo=[0,1,2].map(j=>{const g=track(new THREE.IcosahedronGeometry(1,1)),a=g.attributes.position;
    for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),n=1+.18*Math.sin(x*4.1+z*3.3+j*2)+.12*Math.cos(y*5.7-x*2.9+j);a.setXYZ(i,x*n,y*n*.72,z*n);}g.computeVertexNormals();return g;});
  const leaves=[mat(0x5b733a,{roughness:.9,flatShading:true}),mat(0x6b8243,{roughness:.9,flatShading:true}),mat(0x4b6232,{roughness:.9,flatShading:true})];
  const barkM=mat(0xd8cfbe,{roughness:.85}),barkDark=mat(0x9c8f7a,{roughness:.9});
  const trees=[];
  function tree(x,z,{h=1.5,crown=.5,seed=0,lean=0,parts=6}={}){
    const g=new THREE.Group();g.name='tree';g.position.set(x,0,z);root.add(g);
    const trunk=mesh(track(new THREE.CylinderGeometry(.045+h*.012,.07+h*.02,h,8)),barkM,0,h/2,0);g.add(trunk);trunk.position.set(0,h/2,0);trunk.rotation.z=lean;
    const top=V(-Math.sin(lean)*h,h,0);
    for(let i=0;i<parts;i++){
      const a=rnd(seed,i)*Math.PI*2,r=crown*(.35+rnd(seed,i+20)*.45),y=h+crown*(.05+rnd(seed,i+40)*.5);
      const p=V(top.x+Math.cos(a)*r,y,Math.sin(a)*r*.85),c=mesh(clumpGeo[(seed+i)%3],leaves[(seed+i)%3]);g.add(c);c.position.copy(p);
      const sc=crown*(.42+rnd(seed,i+60)*.25);c.scale.set(sc,sc*(.8+rnd(seed,i+70)*.3),sc);c.rotation.y=rnd(seed,i+80)*6;
      if(i<3){const l=strut([top.x*.6,h*.72,0],[p.x*.8,p.y-sc*.4,p.z*.8],.018+h*.004,barkDark,g);}
    }
    trees.push({g,seed});return g;
  }
  // Near side (camera side) and far side of the corridor, clear of the towers, track, hut and pad.
  // The corridor itself is kept clear; trees stand back at its edges, lower than the conductors.
  for(const [x,z,h,c,s] of [[-.2,1.9,.95,.42,1],[3.05,1.85,.95,.4,4],
    [-2.85,-1.75,1.15,.48,5],[-1.75,-1.9,1.3,.52,6],[-.55,-1.85,1.05,.45,7],[2.95,-1.85,1.2,.5,10],[3.2,-1.15,.95,.42,11]])
    tree(x,z,{h,crown:c,seed:s,lean:(rnd(s,90)-.5)*.12});
  // Scrub.
  for(let i=0;i<16;i++){const x=-3.2+rnd(i,101)*6.4,z=rnd(i,102)<.5?1.0+rnd(i,103)*1.0:-1.2-rnd(i,104)*.85;
    if(Math.abs(x-HUT[0])<.8&&z>.5||Math.abs(x-PAD[0])<.6&&z>.8||Math.abs(x-1.2)<.75&&z>.8)continue;
    const c=mesh(clumpGeo[i%3],leaves[(i+1)%3],x,.08,z);c.scale.set(.16+rnd(i,105)*.1,.12,.16+rnd(i,106)*.1);}

  // ---- The tree at span 2: taller than its neighbours, its upper crown reaching toward the near conductor ----
  const T=[1.35,1.0];
  const t2=new THREE.Group();t2.name='span2-tree';t2.position.set(T[0],0,T[1]);root.add(t2);trees.push({g:t2,seed:12});
  const TOP=[.01,1.32,-.1];
  t2.add(strut([0,0,0],TOP,.075,barkM));
  for(const [i,[x,y,z,r]] of [[.24,1.24,-.02,.26],[-.24,1.28,-.04,.26],[0,1.44,.06,.28],[.08,1.16,.16,.22]].entries()){
    const c=mesh(clumpGeo[i%3],leaves[i%3]);t2.add(c);c.position.set(x,y,z);c.scale.set(r,r*.85,r);c.rotation.y=i*1.9;
    if(i<3)t2.add(strut([TOP[0]*.8,.95,TOP[2]*.8],[x*.85,y-.12,z*.85],.022,barkDark));}
  // The encroaching part (the mask target): limbs rising off the line side of the crown, fresh growth on top.
  const encroach=new THREE.Group();encroach.name='encroaching-canopy';root.add(encroach);
  const limbM=barkDark,LB=[T[0]+.01,1.2,T[1]-.1];
  encroach.add(strut(LB,[T[0]+.03,2.02,.66],.032,limbM));
  for(const tip of [[T[0]+.2,2.48,.54],[T[0]-.18,2.44,.56],[T[0]+.04,2.58,.5],[T[0]+.32,2.34,.6],[T[0]-.3,2.3,.64]])
    encroach.add(strut([T[0]+.03,2.02,.66],tip,.012+.006*(tip[1]<2.3),limbM));
  const freshLeaf=mat(0x86a24f,{roughness:.88,flatShading:true}),freshLeaf2=mat(0x6f8d42,{roughness:.88,flatShading:true});
  // Leafy tips at conductor height, a hand's width short of the near phase (z .39, sagging to y 2.5 here).
  for(const [dx,y,z,r,j] of [[-.16,2.3,.66,.17,0],[.17,2.36,.63,.16,1],[.03,2.48,.66,.13,2],[-.32,2.18,.72,.15,0],[.33,2.22,.69,.15,1],[.04,2.08,.76,.18,2],[-.05,1.84,.8,.17,1]]){
    const c=mesh(clumpGeo[j],j===1?freshLeaf:freshLeaf2);encroach.add(c);c.position.set(T[0]+dx,y,z);c.scale.set(r*1.1,r*.85,r);c.rotation.y=j*1.3+dx*4;}
  // Subject zone for the overlay box (invisible): the limb reaching up under the near conductor.
  const zone=new THREE.Group();zone.name='canopy-zone';root.add(zone);
  const zm=mesh(track(new THREE.BoxGeometry(.86,.78,.42)),mat(0xffffff),T[0],2.2,.64);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);

  // ---- Lattice towers and conductors (electrical.js forms, scaled up for the close-up) ----
  const towerM=mat(0x8d9ca5,{metalness:.6,roughness:.4}),porcelain=mat(0xa6c0bc,{roughness:.3,metalness:.1}),fitting=mat(0x92745c,{metalness:.5,roughness:.4});
  const attach=[];
  function insulator(x,y,z){strut([x,y,z],[x,y-INS,z],.012,fitting);for(let i=0;i<5;i++){const d=cylinder(.042,.018,porcelain,x,y-.04-i*INS*.17,z);d.castShadow=false;}}
  for(const [n,px] of TOWERS.entries()){
    const levels=[0,.85,1.7,2.45,ARM_Y,H],widths=[.36,.27,.19,.13,.1,.04];
    for(const sx of [-1,1])for(const sz of [-1,1]){
      box(.16,.08,.16,concrete,px+sx*.36,.04,LINE_Z+sz*.36);
      for(let j=0;j<levels.length-1;j++){
        const a=[px+sx*widths[j],levels[j],LINE_Z+sz*widths[j]],b=[px+sx*widths[j+1],levels[j+1],LINE_Z+sz*widths[j+1]];strut(a,b,.02,towerM);
        if(j<levels.length-2){strut(a,[px-sx*widths[j+1],levels[j+1],LINE_Z+sz*widths[j+1]],.009,towerM);strut(a,[px+sx*widths[j+1],levels[j+1],LINE_Z-sz*widths[j+1]],.009,towerM);}
      }
    }
    // Crossarm (two chords tapering to the tips) and the peak arm for the middle phase.
    for(const s of [-1,1]){strut([px-.08,ARM_Y,LINE_Z+s*.1],[px,ARM_Y,LINE_Z+s*(ARM+.04)],.016,towerM);strut([px+.08,ARM_Y,LINE_Z+s*.1],[px,ARM_Y,LINE_Z+s*(ARM+.04)],.016,towerM);
      strut([px,ARM_Y-.2,LINE_Z+s*.1],[px,ARM_Y,LINE_Z+s*(ARM+.04)],.01,towerM);}
    strut([px-.06,H-.06,LINE_Z],[px+.06,H-.06,LINE_Z],.016,towerM);
    const a=[];for(const off of [-ARM,0,ARM]){const y=off===0?H-.08:ARM_Y;insulator(px,y,LINE_Z+off);a.push([px,y-INS,LINE_Z+off]);}
    attach.push(a);
    if(n>0)props.plate('TOWER '+(n+1),.46,.13,{x:px,y:1.0,z:LINE_Z+.3});
  }
  const cableM=mat(0x2c3a44,{metalness:.7,roughness:.35});
  const conductors=[];
  function conductor(a,b,sag){const pts=[];for(let i=0;i<=24;i++){const u=i/24;pts.push(V(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u-4*sag*u*(1-u),a[2]+(b[2]-a[2])*u));}
    const o=mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,.016,6,false)),cableM);o.castShadow=false;conductors.push(o);return o;}
  for(let p=0;p<3;p++){
    for(let i=0;i<2;i++)conductor(attach[i][p],attach[i+1][p],SAG);
    // The line continues off the plinth both ways: back to the substation, on to the town.
    conductor([-EDGE,attach[0][p][1]+.12,attach[0][p][2]],attach[0][p],SAG*.4);
    conductor(attach[2][p],[EDGE,attach[2][p][1]+.12,attach[2][p][2]],SAG*.4);
  }
  // Span marker on the camera side of the flagged tree, mid-span between towers 2 and 3.
  const SIGN=[.82,1.32];strut([SIGN[0],0,SIGN[1]],[SIGN[0],1.05,SIGN[1]],.022,steel);props.plate('SPAN 2',.56,.17,{x:SIGN[0],y:1.07,z:SIGN[1]+.02});

  // ---- Depot hut with the site GPU, radio mast, drone pad ----
  const hutWall=mat(0x9aa8ad),HW=.9,HD=.7,HH=1.15;
  box(HW+.1,.05,HD+.1,concrete,HUT[0],.025,HUT[1]);
  box(HW,HH,.05,hutWall,HUT[0],HH/2,HUT[1]-HD/2);for(const s of [-1,1])box(.05,HH,HD,hutWall,HUT[0]+s*HW/2,HH/2,HUT[1]);
  box(HW,.22,.05,hutWall,HUT[0],HH-.11,HUT[1]+HD/2);
  const roof=box(HW+.16,.05,HD+.2,mat(0x3d5560),HUT[0],HH+.05,HUT[1]);roof.rotation.x=.1;
  props.plate('SITE GPU',.62,.17,{x:HUT[0],y:HH-.11,z:HUT[1]+HD/2+.03});
  const cabinet=props.siteCabinet(HUT[0]+.08,HUT[1]-.08,{label:null});cabinet.group.scale.setScalar(.62);
  strut([MAST[0],0,MAST[1]],[MAST[0],1.85,MAST[1]],.025,steel);
  box(.07,.22,.04,mat(0xdfe6ea,{roughness:.5}),MAST[0],1.78,MAST[1]+.03);
  const linkLedM=mat(0x47e3a6,{emissive:0x1fbf84,emissiveIntensity:.4});const linkLed=box(.04,.04,.02,linkLedM,MAST[0],1.62,MAST[1]+.04);linkLed.castShadow=false;
  const MAST_TOP=V(MAST[0],1.8,MAST[1]+.06);
  const port=cabinet.port();
  const pulse=props.pulse([[MAST[0]+.03,1.7,MAST[1]+.03],[MAST[0]+.03,.03,MAST[1]+.03],[HUT[0]+.08,.03,MAST[1]+.03],[HUT[0]+.08,.03,HUT[1]-.08],port.map((v,i)=>i===1?.03:v),port]);
  box(.72,.03,.72,mat(0x2b3338,{roughness:.8}),PAD[0],.015,PAD[1]);
  const ringM=mat(0xf2b134,{roughness:.6});const ring=mesh(track(new THREE.RingGeometry(.24,.29,32).rotateX(-Math.PI/2)),ringM,PAD[0],.032,PAD[1]);ring.castShadow=false;
  strut([PAD[0]+.45,0,PAD[1]+.3],[PAD[0]+.45,.5,PAD[1]+.3],.015,steel);props.plate('DRONE CAMERA',.6,.15,{x:PAD[0]+.45,y:.52,z:PAD[1]+.32});

  // ---- The drone and its gimbal camera (the sensor) ----
  const drone=createDrone(k,{size:.95});
  const Y0=.03+.152*.95;
  const PAD_P=[PAD[0],Y0,PAD[1]];
  // Paths keep clear of the towers: they cross the line high over the middle of span 1, never near a tower top.
  const OUT=[PAD_P,[PAD[0],1.3,PAD[1]],[-1.45,3.3,1.15],[-1.0,3.9,-.25],[-.35,3.75,-1.25],[.6,3.5,-1.25],HOVER];
  const BACK=[HOVER,[.5,3.85,-1.3],[-.95,4.35,-.25],[-1.45,3.5,1.15],[PAD[0],1.0,PAD[1]],PAD_P];
  const AGAIN=[HOVER,[1.75,4.45,-.3],[1.7,3.65,1.95]];      // variation: another pass from the near side
  const sensorCam=new THREE.PerspectiveCamera(46,1,.05,40);sensorCam.userData.portraitWidth=1.05;root.add(sensorCam);
  const tgt=V(...TARGET);
  // Sensor-only surroundings: a graded sky-and-paddock dome around the lens, so the camera view reads as footage
  // from the air, not a model on a table (it hides the plinth edge and the void beyond). Kept out of the mask swap.
  const sk=document.createElement('canvas');sk.width=8;sk.height=256;const skc=sk.getContext('2d'),sg=skc.createLinearGradient(0,0,0,256);
  sg.addColorStop(0,'#2a3540');sg.addColorStop(.44,'#56606a');sg.addColorStop(.5,'#6a6f6e');sg.addColorStop(.515,'#5a5c45');sg.addColorStop(.6,'#5a5d38');sg.addColorStop(1,'#565a35');skc.fillStyle=sg;skc.fillRect(0,0,8,256);
  const skyTex=track(new THREE.CanvasTexture(sk));skyTex.colorSpace=THREE.SRGBColorSpace;
  const dome=mesh(track(new THREE.SphereGeometry(30,24,16)),track(new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false})));
  dome.userData.sensorKeep=true;dome.userData.noFit=true;dome.castShadow=dome.receiveShadow=false;dome.renderOrder=-10;dome.visible=false;
  // The paddock carries on past the plinth edge in the camera view (same grass, already in the camera's grade).
  const farTex=track(grassTex.clone());farTex.repeat.set(23,23);farTex.needsUpdate=true;
  const paddock=mesh(track(new THREE.PlaneGeometry(40,40).rotateX(-Math.PI/2)),track(new THREE.MeshBasicMaterial({map:farTex,color:0xc3d0d0,fog:false,toneMapped:false})),0,-.004,0);
  paddock.userData.sensorKeep=true;paddock.userData.noFit=true;paddock.castShadow=paddock.receiveShadow=false;paddock.visible=false;
  // In-camera uplink tag: the frames go to the site GPU in one short burst, then the result comes back.
  const hudC=document.createElement('canvas');hudC.width=512;hudC.height=64;const hud=hudC.getContext('2d');
  const hudTex=track(new THREE.CanvasTexture(hudC));hudTex.colorSpace=THREE.SRGBColorSpace;
  const hudM=track(new THREE.MeshBasicMaterial({map:hudTex,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,fog:false}));
  const hudTag=mesh(track(new THREE.PlaneGeometry(1,.125)),hudM);hudTag.userData.sensorKeep=true;hudTag.userData.noFit=true;hudTag.renderOrder=20;hudTag.castShadow=false;hudTag.visible=false;
  root.remove(hudTag);sensorCam.add(hudTag);
  let hudKey='';
  function drawHud(text,u){const key=text+'|'+Math.round(u*20);if(key===hudKey)return;hudKey=key;
    hud.clearRect(0,0,512,64);hud.fillStyle='rgba(0,0,0,.72)';hud.fillRect(0,6,512,52);hud.fillStyle='#19c9ff';hud.fillRect(0,6,6,52);
    hud.font='600 24px Arial,Helvetica,sans-serif';hud.fillStyle='#e8f6ff';hud.textBaseline='middle';hud.fillText(text,22,30);
    hud.fillStyle='rgba(255,255,255,.18)';hud.fillRect(22,48,468,4);hud.fillStyle='#19c9ff';hud.fillRect(22,48,468*u,4);hudTex.needsUpdate=true;}

  // ---- Upload burst: packets from the drone antenna to the hut mast, only while hovering ----
  const packetM=mat(0x9ff0ff,{emissive:0x19c9ff,emissiveIntensity:1.4});
  const packetGeo=track(new THREE.SphereGeometry(.035,10,8));
  const packets=[];for(let i=0;i<5;i++){const o=mesh(packetGeo,packetM);o.castShadow=false;o.visible=false;o.userData.noFit=true;packets.push(o);}
  const from=V(),mid=V();

  // ---- Glare (the "unsure" variation): low sun ahead of the gimbal, flare on the lens ----
  const gl=document.createElement('canvas');gl.width=gl.height=64;const glc=gl.getContext('2d'),gr=glc.createRadialGradient(32,32,1,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,248,220,.8)');gr.addColorStop(1,'rgba(255,240,200,0)');glc.fillStyle=gr;glc.fillRect(0,0,64,64);
  const glareTex=track(new THREE.CanvasTexture(gl));
  // The glare lives in the lens only: in the scene the day looks the same, which is the point.
  const lensGlare=new THREE.Sprite(track(new THREE.SpriteMaterial({map:glareTex,color:0xfff6dc,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,opacity:0,fog:false})));lensGlare.position.set(.02,.03,-.42);lensGlare.scale.set(.95,.62,1);lensGlare.renderOrder=15;sensorCam.add(lensGlare);
  const veil=mesh(track(new THREE.PlaneGeometry(2,2)),track(new THREE.MeshBasicMaterial({color:0xc9c6bb,transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false,fog:false})));
  veil.userData.sensorKeep=true;veil.userData.noFit=true;veil.renderOrder=14;veil.castShadow=false;veil.visible=false;root.remove(veil);sensorCam.add(veil);veil.position.set(0,0,-.4);

  // ---- Vegetation crew: a ute drives the track to span 2; the crew member walks to the tree and looks up ----
  const ute=new THREE.Group();ute.name='crew-ute';root.add(ute);
  const uteWhite=mat(0xeef1f2,{roughness:.45,metalness:.2}),uteDark=mat(0x1e262c,{roughness:.6}),tyre=mat(0x15191c,{roughness:.9}),rim=mat(0xaab4ba,{metalness:.6,roughness:.35});
  const U=(o,x,y,z)=>{ute.add(o);o.position.set(x,y,z);return o;};
  U(box(.6,.12,1.7,uteDark,0,0,0),0,.2,0);
  U(box(.6,.2,.48,uteWhite,0,0,0),0,.36,.6);                          // bonnet
  U(box(.6,.34,.62,uteWhite,0,0,0),0,.43,.08);                        // cab
  U(box(.56,.2,.6,mat(0x23323c,{metalness:.5,roughness:.2}),0,0,0),0,.5,.1).scale.set(1.02,1,1.01); // glass band
  U(box(.6,.16,.72,uteWhite,0,0,0),0,.34,-.47);                       // tray
  U(box(.5,.12,.3,mat(0xe07a1f,{roughness:.5}),0,0,0),0,.48,-.62);   // toolbox
  U(box(.62,.04,.02,mat(0xe07a1f),0,0,0),0,.3,.84);
  const beaconM=mat(0xffb030,{emissive:0xff8a00,emissiveIntensity:.6});U(box(.14,.05,.06,beaconM,0,0,0),0,.62,.12);
  props.plate('VEGETATION CREW',.62,.12,{parent:ute,x:-.305,y:.34,z:-.42,ry:-Math.PI/2});
  props.plate('VEGETATION CREW',.62,.12,{parent:ute,x:.305,y:.34,z:-.42,ry:Math.PI/2});
  const wheels=[];for(const sx of [-1,1])for(const sz of [-1,1]){const hub=new THREE.Group();ute.add(hub);hub.position.set(sx*.3,.13,sz*.52);
    const w=cylinder(.13,.1,tyre,0,0,0);hub.add(w);w.position.set(0,0,0);w.rotation.z=Math.PI/2;const r=cylinder(.07,.105,rim,0,0,0);hub.add(r);r.position.set(0,0,0);r.rotation.z=Math.PI/2;
    const spoke=box(.11,.02,.11,rim,0,0,0);hub.add(spoke);spoke.position.set(0,0,0);wheels.push(hub);}
  const UTE_PATH=[[-2.55,0,TRACK_Z],[.72,0,TRACK_Z]];
  const crew=actors.person({vest:0xff7a1a,shirt:0x3b5a3a,name:'vegetation-crew',scale:.6});
  // Out of the driver's door (the far side), round the bonnet, then stop where the limb is in view overhead.
  // He ends on the camera side of the tree, next to the SPAN 2 post, with nothing between him and the camera.
  const C_END=[1.95,0,1.55],C_PATH=[[.88,0,.0],[1.78,0,.08],[2.05,0,.75],C_END],C_FACE=Math.atan2(TARGET[0]-C_END[0],TARGET[2]-C_END[2]);
  // Variation: the pilot steps out of the hut to watch the second pass.
  // He walks out along the near side of the pad to where he can see span 2 and the drone's second pass.
  const P_END=[.45,0,1.78],PILOT_PATH=[[HUT[0]+.15,0,HUT[1]+.5],[-1.2,0,1.95],P_END],PILOT_FACE=Math.atan2(1.7-P_END[0],1.95-P_END[2]);

  function update(t,ctx){
    const unsure=ctx.variation==='glare';
    // Drone flight: out along the far side, hover at span 2, then home (or another pass from the near side).
    let yaw=0,aimU=0,hovering=false;
    if(t<ARRIVE){drone.fly(OUT,LIFT,ARRIVE,t);aimU=smooth(ARRIVE-.6,ARRIVE,t)*.3;}
    else if(t<DEPART){drone.group.position.set(...HOVER);hovering=true;aimU=smooth(AIM0,AIM1,t);}
    else if(!unsure){drone.fly(BACK,DEPART,HOME_T,t);aimU=1-smooth(DEPART,DEPART+1.2,t);}
    else{const f=drone.fly(AGAIN,DEPART,DEPART+3.8,t);yaw=Math.PI*smooth(DEPART+.4,DEPART+3.6,t);aimU=smooth(DEPART+2.6,DEPART+4.4,t);hovering=f.done;}
    drone.update(t,{spinOn:SPIN_ON,spinOff:unsure?1e9:SPIN_OFF,yaw});
    drone.aim(tgt,aimU);
    drone.lensPose(sensorCam,tgt);
    dome.visible=paddock.visible=!!ctx.sensor;if(ctx.sensor)dome.position.copy(sensorCam.position);
    // Upload: one short burst of packets to the hut mast once the drone holds position (same burst either way).
    const uploading=t>=UP0&&t<UP1;
    drone.antenna.getWorldPosition(from);root.worldToLocal(from);
    mid.copy(from).lerp(MAST_TOP,.5);mid.y+=.35;
    for(const [i,o] of packets.entries()){const u=((t*.9+i/packets.length)%1+1)%1;o.visible=uploading&&!ctx.sensor&&ctx.chapterId!=='review';
      const a=1-u;o.position.set(a*a*from.x+2*a*u*mid.x+u*u*MAST_TOP.x,a*a*from.y+2*a*u*mid.y+u*u*MAST_TOP.y,a*a*from.z+2*a*u*mid.z+u*u*MAST_TOP.z);o.scale.setScalar(.7+.5*Math.sin(u*Math.PI));}
    linkLedM.emissiveIntensity=uploading?.9+.8*Math.max(0,Math.sin(t*14)):.4;linkLedM.emissive.set(uploading?0x19c9ff:0x1fbf84);
    // The site GPU works from the moment the burst lands until the camera view has its answer.
    const active=t>=UP0+.4&&ctx.chapterId!=='review'&&(ctx.chapterId==='aiView'||t<UP1+.6);
    cabinet.update(t,active);pulse.update(t,t>=UP0+.4&&t<UP1+.6&&!ctx.sensor);
    // Camera-view tag: frames sent, then the site GPU's answer (or the lack of one) back on the drone camera.
    const aiT=t-10;hudTag.visible=!!ctx.sensor&&ctx.chapterId==='aiView';
    if(hudTag.visible){
      const sent=smooth(0,.7,aiT);drawHud(sent<1?'Frames sent to site GPU':unsure?'Site GPU: view unclear':'Site GPU: result back',sent);
      const a=sensorCam.aspect||1,hh=.4*Math.tan(THREE.MathUtils.degToRad(sensorCam.fov/2)),hw=hh*a,wTag=Math.min(hw*.9,hh*.95);
      hudTag.scale.set(wTag,wTag,1);hudTag.position.set(-hw+hh*.16+wTag/2,hh-hh*.2-wTag*.0625-(a<1?hh*.12:0),-.4);}
    // Trees sway a little; the limb barely moves so the mask stays put.
    for(const T of trees)T.g.rotation.z=.012*Math.sin(t*.9+T.seed);
    encroach.rotation.set(0,0,0);
    // Glare variation.
    const glare=unsure?smooth(4.4,8,t):0,inLens=!!(glare&&ctx.sensor);
    lensGlare.material.opacity=inLens?1:0;lensGlare.visible=inLens;
    veil.material.opacity=inLens?.32*glare:0;veil.visible=inLens;
    if(inLens){const a=sensorCam.aspect||1,hh=.4*Math.tan(THREE.MathUtils.degToRad(sensorCam.fov/2));veil.scale.set(hh*a*1.1,hh*1.1,1);lensGlare.scale.set(Math.max(.8,hh*a*2.1),Math.max(.52,hh*1.6),1);}
    // Vegetation crew (not sent when the view was unclear: the drone flies another pass instead).
    const f=actors.followPath(ute,UTE_PATH,UTE0,UTE1,unsure?0:t,{ease:1.1});
    for(const w of wheels)w.rotation.x=f.distance/.13;
    beaconM.emissiveIntensity=f.moving?.6+.8*Math.max(0,Math.sin(t*8)):.5;
    if(!unsure){
      const shown=t>=P_T0;crew.group.visible=shown;
      if(shown){const g=actors.followPath(crew.group,C_PATH,P_T0,P_T1,t,{ease:.4});
        if(g.done){const turn=smooth(P_T1,P_T1+.7,t);crew.group.rotation.y=g.heading+Math.atan2(Math.sin(C_FACE-g.heading),Math.cos(C_FACE-g.heading))*turn;}
        const up=g.done?smooth(P_T1+.3,P_T1+1.3,t):0;
        crew.pose({distance:g.distance/.6,weight:g.moving?g.weight:0,look:-.55*up,lean:-.05*up,point:g.done?smooth(P_T1+.9,P_T1+1.8,t):0,pointPitch:2.4});}
    }else{
      const shown=t>=DEPART;crew.group.visible=shown;
      if(shown){const g=actors.followPath(crew.group,PILOT_PATH,DEPART,DEPART+3.4,t,{ease:.5});
        if(g.done){const turn=smooth(DEPART+3.4,DEPART+4.1,t);crew.group.rotation.y=g.heading+Math.atan2(Math.sin(PILOT_FACE-g.heading),Math.cos(PILOT_FACE-g.heading))*turn;}
        crew.pose({distance:g.distance/.6,weight:g.moving?g.weight:0,look:g.done?-.5*smooth(DEPART+3.6,DEPART+4.4,t):0,point:g.done?smooth(DEPART+4.2,DEPART+5.0,t):0});}
    }
  }
  return{anchors:{canopy:zone,limb:encroach},
    sensors:{'drone-cam':{camera:sensorCam,mode:'mask',targets:[encroach],label:'Drone camera'}},
    update,
    metrics:()=>({drone:drone.group.position.toArray().map(v=>+v.toFixed(3)),ute:ute.position.toArray().map(v=>+v.toFixed(3)),crewVisible:crew.group.visible,packets:packets.filter(p=>p.visible).length,conductors:conductors.length,towers:TOWERS.length})};
}
