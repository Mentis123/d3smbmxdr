// M2 "A robot finds a new wet area by a pump": a plant pump bay. Two pumps (P-11, P-12) on skids against the back
// wall, discharge pipes up to a header, a drain grate in front, a painted walkway. The four-legged robot (the same rig
// as the energy patrol) stops at P-11 (dry, ordinary), walks on and stops at P-12, where water is dripping from the
// casing and a new wet patch is spreading towards the drain. The robot camera's view is compared with the stored
// baseline; the changed area is masked. A fitter comes to the pump. Everything is a function of t.
import {createQuadruped} from '../rigs/quadruped.js';

const PUMPS=[{id:'P-11',x:-1.35},{id:'P-12',x:1.0}],LEAK=1;
const SKID_Z=-.75,AXIS_Y=.45,WALL_Z=-2.0,HEADER=[1.45,-1.72],DRAIN_Z=.2,WALK_Z=.62;
const DRIP=[PUMPS[LEAK].x+.48,.3,-.47];                  // underside of P-12's casing, front
const T_LEG1=[.3,2.7],T_GLANCE=[2.7,3.7],T_LEG2=[3.8,6.6],T_AIM=[6.7,7.9],T_SHOT=8.0,T_UNAIM=[16.9,17.5],T_TURN=[17.4,18.5],T_LEG3=[18.9,22.4];
const DRIP0=4.6,GROW0=5.0,GROW1=10.5,F_T0=18.6,F_T1=22.4;
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};

export function buildKit(k){
  const {THREE,root,box,cylinder,bar,mesh,mat,steel,dark,yellow,concrete,track,props,actors}=k;
  const slab=mat(0x8d9597,{roughness:.92}),wallM=mat(0x9aa3a4,{roughness:.95}),paint=mat(0x2f5f86,{roughness:.5,metalness:.35}),motorM=mat(0x41505a,{roughness:.5,metalness:.4}),
    pipeM=mat(0x7d8b92,{roughness:.45,metalness:.55}),guard=mat(0xe2a530,{roughness:.6}),hazard=mat(0xf2b134,{roughness:.6}),grateM=mat(0x2b3237,{metalness:.5,roughness:.5});
  const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;return t;};

  // ---- Bay: slab, back wall, kerb, walkway lines, drain with grate ----
  box(6.7,.025,2.9,slab,0,.0125,WALL_Z+1.45);
  box(6.7,1.25,.2,wallM,0,.625,WALL_Z-.1);
  for(const x of [-3.0,3.0])box(.06,.025,2.9,hazard,x,.03,WALL_Z+1.45);
  for(const z of [.95,1.95])box(6.6,.006,.05,hazard,0,.016,z);
  props.plate('WALKWAY',.5,.12,{x:-1.7,y:.02,z:1.45,rx:-Math.PI/2,bg:'#2c3438',fg:'#f2c14e'});
  box(6.0,.02,.2,mat(0x1a1f22,{roughness:1}),0,.016,DRAIN_Z);
  for(let i=0;i<60;i++)box(.025,.012,.19,grateM,-2.95+i*.1,.03,DRAIN_Z);
  for(const s of [-1,1])box(6.0,.014,.02,grateM,0,.03,DRAIN_Z+s*.1);
  props.plate('PUMP BAY 3',.8,.18,{x:-2.75,y:1.08,z:WALL_Z+.005});

  // ---- Pumps: skid, motor with cooling fins and fan cowl, coupling guard, bearing housing, volute, pipes ----
  const pipe=(a,b,r=.065)=>bar(a,b,r,pipeM);
  const flange=(p,axis,r=.1)=>{const f=cylinder(r,.03,steel,...p);if(axis==='x')f.rotation.z=Math.PI/2;if(axis==='z')f.rotation.x=Math.PI/2;return f;};
  const lamps=[];
  PUMPS.forEach((P,i)=>{
    const x=P.x,z=SKID_Z;
    box(1.55,.14,.5,dark,x+.05,.07,z);
    for(const dx of [-.62,.72])for(const dz of [-.2,.2])cylinder(.025,.03,steel,x+dx,.155,z+dz);
    const motor=cylinder(.22,.66,motorM,x-.32,AXIS_Y,z);motor.rotation.z=Math.PI/2;
    for(let j=0;j<8;j++){const f=cylinder(.24,.022,motorM,x-.58+j*.075,AXIS_Y,z);f.rotation.z=Math.PI/2;}
    const cowl=cylinder(.235,.1,dark,x-.7,AXIS_Y,z);cowl.rotation.z=Math.PI/2;
    box(.3,.08,.3,motorM,x-.32,AXIS_Y-.25,z);box(.14,.12,.12,motorM,x-.3,AXIS_Y+.27,z);   // feet, terminal box
    box(.22,.24,.28,guard,x+.1,AXIS_Y,z);
    const brg=cylinder(.09,.16,paint,x+.29,AXIS_Y,z);brg.rotation.z=Math.PI/2;box(.16,.22,.2,paint,x+.29,.25,z);
    const vol=mesh(track(new THREE.TorusGeometry(.19,.09,12,28)),paint,x+.48,AXIS_Y,z);vol.rotation.y=Math.PI/2;
    const cap=cylinder(.16,.14,paint,x+.55,AXIS_Y,z);cap.rotation.z=Math.PI/2;box(.18,.2,.24,paint,x+.48,.22,z);
    // Suction: axial, then back to the wall. Discharge: up from the casing to the header.
    pipe([x+.62,AXIS_Y,z],[x+.86,AXIS_Y,z]);flange([x+.66,AXIS_Y,z],'x');pipe([x+.86,AXIS_Y,z],[x+.86,AXIS_Y,WALL_Z]);flange([x+.86,AXIS_Y,z-.35],'z');
    pipe([x+.48,AXIS_Y+.2,z],[x+.48,HEADER[0],z]);flange([x+.48,AXIS_Y+.33,z],'y');pipe([x+.48,HEADER[0],z],[x+.48,HEADER[0],HEADER[1]]);
    const valve=box(.12,.16,.12,motorM,x+.48,1.0,z);const wheel=mesh(track(new THREE.TorusGeometry(.08,.012,6,18)),hazard,x+.48,1.0,z+.1);
    props.plate(P.id,.3,.1,{x:x-.1,y:.075,z:z+.252,bg:'#f2c14e',fg:'#10161c'});
    props.plate('PUMP '+P.id,.46,.13,{x:x+.48,y:1.22,z:z+.072});
    // Local control station with a run lamp.
    bar([x-.95,0,z+.15],[x-.95,.95,z+.15],.025,steel);box(.16,.2,.1,dark,x-.95,1.0,z+.15);
    const lamp=box(.05,.05,.02,mat(0x4be38f,{emissive:0x1fbf5a,emissiveIntensity:.9}),x-.95,1.04,z+.205);lamp.castShadow=false;lamps.push(lamp);
  });
  pipe([-3.1,HEADER[0],HEADER[1]],[3.1,HEADER[0],HEADER[1]],.09);
  for(const x of [-2.4,-.2,2.0]){bar([x,HEADER[0]-.09,HEADER[1]],[x,HEADER[0]-.09,WALL_Z],.02,steel);}

  // ---- The leak: a hanging drop that falls, a splash, a dark wet stain on the casing, a spreading floor patch ----
  const water=mat(0x9fd3e6,{roughness:.05,metalness:.1,transparent:true,opacity:.85,emissive:0x2a5868,emissiveIntensity:.35});
  const drop=mesh(track(new THREE.SphereGeometry(.03,10,8)),water,...DRIP);drop.castShadow=false;
  const splash=mesh(track(new THREE.TorusGeometry(.05,.008,6,20)),mat(0x9fd3e6,{roughness:.05,transparent:true,opacity:.85,emissive:0x2a5868,emissiveIntensity:.35}),DRIP[0],.01,DRIP[2]+.03);splash.rotation.x=Math.PI/2;splash.castShadow=false;
  const wet=new THREE.Group();wet.name='wet-area';root.add(wet);
  // Patch outline: an irregular blob that grows from under the drip towards the drain (+z).
  const shape=new THREE.Shape();const N=28;
  for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,r=1+.18*Math.sin(a*3+.7)+.11*Math.sin(a*5+2.1)+.07*Math.cos(a*7);const px=Math.cos(a)*.42*r,pz=.27+Math.sin(a)*.27*r*(Math.sin(a)>0?1.25:.8);i?shape.lineTo(px,pz):shape.moveTo(px,pz);}
  const patchGeo=track(new THREE.ShapeGeometry(shape,24));
  {const uv=patchGeo.attributes.uv,pos=patchGeo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+.6)/1.2,(pos.getY(i)+.1)/.75);}   // UVs over the whole blob
  patchGeo.rotateX(Math.PI/2);   // shape y -> world +z
  const rimGeo=track(new THREE.ShapeGeometry(shape,24));rimGeo.rotateX(Math.PI/2);
  // Water on concrete: a dark blue-grey film with sky highlights and a bright wet edge. Self-lit (emissive map), so a
  // pump's shadow cannot turn it into one more shadow; base colour stays black so the mask paints it a strong colour.
  const sheen=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#35596b';g.fillRect(0,0,w,h);
    const r=g.createRadialGradient(w*.5,h*.4,6,w*.5,h*.45,w*.62);r.addColorStop(0,'rgba(170,215,235,.75)');r.addColorStop(.55,'rgba(95,150,175,.35)');r.addColorStop(1,'rgba(53,89,107,0)');g.fillStyle=r;g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(235,248,255,.8)';g.lineCap='round';for(let i=0;i<6;i++){g.lineWidth=2+3*rnd(i,3);g.beginPath();const x=w*(.18+i*.12),y=h*(.25+.2*rnd(i,4));g.moveTo(x,y);g.lineTo(x+w*.08,y+h*(.18+.2*rnd(i,5)));g.stroke();}});
  const patchMat=mat(0x000000,{side:THREE.DoubleSide,emissive:0xffffff,emissiveMap:sheen,emissiveIntensity:.95,roughness:.06,metalness:.1,transparent:true,opacity:.95,depthWrite:false});
  const patch=mesh(patchGeo,patchMat,DRIP[0],.03,DRIP[2]-.03);patch.castShadow=patch.receiveShadow=false;patch.renderOrder=2;wet.add(patch);
  const rim=mesh(rimGeo,mat(0x000000,{emissive:0xbfe9ff,emissiveIntensity:.9,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false}),DRIP[0],.027,DRIP[2]-.03);rim.castShadow=rim.receiveShadow=false;rim.renderOrder=1;wet.add(rim);
  // A wet streak down the casing front (not part of the floor finding the mask outlines).
  const stain=box(.07,.14,.004,mat(0x1d2a33,{roughness:.1,metalness:.3}),DRIP[0],.34,DRIP[2]+.012);stain.castShadow=false;stain.userData.unmasked=true;wet.add(stain);
  // Overlay / subject zone: the patch's final footprint on the floor (invisible).
  const zone=new THREE.Group();zone.name='wet-zone';root.add(zone);
  const zm=mesh(track(new THREE.BoxGeometry(.9,.12,.68)),mat(0xffffff),DRIP[0],.06,DRIP[2]+.3);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);
  const growth=t=>smooth(GROW0,GROW1,t)**.7;

  // ---- Washdown (the "unsure" variation): the whole floor is wet, a hose lies on it, a wet-floor sign ----
  const washdown=new THREE.Group();washdown.name='washdown';root.add(washdown);
  const washMat=mat(0x000000,{side:THREE.DoubleSide,emissive:0xffffff,emissiveMap:sheen,emissiveIntensity:.8,roughness:.08,metalness:.1,transparent:true,opacity:.8,depthWrite:false});
  for(const [x,z,sx,sz,r] of [[-1.0,-.25,1.3,.55,.2],[.4,.45,1.6,.4,-.1],[1.7,-.2,1.0,.55,.4],[-2.2,.5,1.2,.35,0],[1.2,1.3,1.4,.4,.15],[-.6,1.35,1.1,.35,-.2],[DRIP[0],DRIP[2]+.25,.55,.35,0]]){
    const o=mesh(patchGeo,washMat,x,.026,z-.2);o.scale.set(sx,1,sz/.55*1.4);o.rotation.y=r;o.castShadow=o.receiveShadow=false;washdown.add(o);}
  const hoseCurve=new THREE.CatmullRomCurve3([[-2.9,.03,-1.5],[-2.3,.03,-.2],[-1.6,.03,.35],[-.7,.03,.15],[-.2,.03,.45]].map(p=>new THREE.Vector3(...p)));
  washdown.add(mesh(track(new THREE.TubeGeometry(hoseCurve,40,.025,6,false)),mat(0x2f8f4a,{roughness:.6})));
  const sign=new THREE.Group();sign.position.set(-.35,0,1.32);sign.rotation.y=.3;washdown.add(sign);
  for(const s of [-1,1]){const p=k.box(.32,.5,.012,mat(0xf2c14e),0,.25,s*.07);p.rotation.x=s*.28;sign.add(p);}
  sign.add(props.plate('WET FLOOR',.28,.09,{x:0,y:.3,z:.15,rx:-.28,bg:'#f2c14e',fg:'#10161c'}));
  washdown.visible=false;

  // ---- Site GPU cabinet and the wireless access point on the back wall ----
  const cabinet=props.siteCabinet(2.8,-1.45,{rotation:-.45,label:'SITE GPU'});
  const port=cabinet.port();
  const AP=[2.15,1.0,WALL_Z+.02];box(.14,.1,.05,mat(0xe9eef0),AP[0],AP[1],AP[2]+.025);
  for(const s of [-1,1])bar([AP[0]+s*.05,AP[1]+.05,AP[2]+.03],[AP[0]+s*.05,AP[1]+.22,AP[2]+.03],.008,dark);
  props.plate('SITE WI-FI',.36,.09,{x:AP[0],y:AP[1]-.13,z:AP[2]+.01});
  const F_START=[-3.12,0,1.55];
  const pulse=props.pulse([[AP[0],AP[1],AP[2]+.06],[AP[0]+.25,AP[1],AP[2]+.06],[AP[0]+.25,.03,AP[2]+.06],[port[0],.03,AP[2]+.06],port.map((v,i)=>i===1?.03:v),port,
    port.map((v,i)=>i===1?.03:v),[port[0],.03,WALL_Z+.05],[-3.25,.03,WALL_Z+.05],[-3.25,.03,F_START[2]-.15]]);

  // ---- Robot: P-11 (glance), on to P-12 (stop, aim, capture), then on with its round ----
  const robot=createQuadruped(k,{name:'patrol-robot',fov:64});
  robot.camera.userData.portraitWidth=1.1;
  const STOP1=[PUMPS[0].x-.1,WALK_Z],STOP2=[PUMPS[LEAK].x-.55,WALK_Z],END=[2.55,1.15],H_OUT=.35;
  robot.plan([{route:robot.route([[-2.95,WALK_Z],STOP1]),t0:T_LEG1[0],t1:T_LEG1[1]},{route:robot.route([STOP1,STOP2]),t0:T_LEG2[0],t1:T_LEG2[1]},
    {route:robot.turn(STOP2,Math.PI/2,H_OUT),t0:T_TURN[0],t1:T_TURN[1]},
    {route:robot.route([STOP2,[STOP2[0]+.3*Math.sin(H_OUT),WALK_Z+.3*Math.cos(H_OUT)],[.9,1.4],[1.6,1.55],[2.2,1.45],END]),t0:T_LEG3[0],t1:T_LEG3[1]}]);
  // Review: it turns on the spot towards the walkway, then walks on along it, behind the patch as the camera sees it.
  // Each move starts on the heading the last one ended on, so the feet stay planted across the joins.
  const HEAD=[STOP2[0]+.27,.86,STOP2[1]];
  const air=props.pulse([HEAD,[(HEAD[0]+AP[0])/2,1.25,(HEAD[2]+AP[2])/2],[AP[0],AP[1],AP[2]+.06]],{radius:.014,speed:.9,repeat:2});air.cable.visible=false;
  const LOOK1=[PUMPS[0].x+.48,.1,DRIP[2]+.15],LOOK2=[DRIP[0]+.02,.05,DRIP[2]+.27];

  // ---- Fitter: comes in along the walkway at review, stops at P-12, looks at the floor and points ----
  const fitter=actors.person({vest:0xff7a1a,shirt:0x3a4d5e,name:'fitter'});
  const F_END=[DRIP[0]-.82,0,.5],F_PATH=[F_START,[.0,0,1.55],F_END],F_FACE=Math.atan2(DRIP[0]+.05-F_END[0],DRIP[2]+.2-F_END[2]);

  function update(t,ctx){
    const wash=ctx.variation==='washdown';washdown.visible=wash;
    // Robot head: a short look at P-11 on the way, then aim at P-12's floor and capture.
    const glance=smooth(T_GLANCE[0]-.2,T_GLANCE[0]+.5,t)*(1-smooth(T_GLANCE[1]-.4,T_GLANCE[1]+.1,t));
    const aimW=smooth(T_AIM[0],T_AIM[1],t)*(1-smooth(T_UNAIM[0],T_UNAIM[1],t));
    robot.update(t,{aim:aimW>0?LOOK2:LOOK1,aimWeight:Math.max(aimW,glance),idleTilt:.3,tally:t>=T_SHOT&&t<T_UNAIM[0]});
    robot.group.visible=!ctx.sensor;   // its own camera does not draw the robot's body into the picture
    // Leak: drip cycle (form, fall, splash) and the patch spreading.
    const on=t>=DRIP0,FALL=Math.sqrt(DRIP[1]/4.9),P=.5+FALL+.2,c=((t-DRIP0)%P+P)%P;
    drop.visible=on&&c<.5+FALL;splash.visible=on&&c>=.5+FALL;
    if(on){if(c<.5){drop.position.set(...DRIP);drop.scale.setScalar(.35+.65*c/.5);}
      else if(c<.5+FALL){const f=c-.5;drop.position.set(DRIP[0],DRIP[1]-4.9*f*f,DRIP[2]);drop.scale.set(.8,1.3,.8);}
      else{const u=(c-.5-FALL)/.2;splash.scale.setScalar(.4+1.6*u);splash.material.opacity=.85*(1-u);}}
    const g=growth(t);patch.visible=rim.visible=g>.01;patch.scale.set(.15+.85*g,1,.12+.88*g);rim.scale.set(patch.scale.x*1.07+.01,1,patch.scale.z*1.07+.01);
    stain.visible=t>DRIP0+.4;stain.scale.set(1,smooth(DRIP0,GROW1,t)*.9+.1,1);
    lamps.forEach(l=>{l.material.emissiveIntensity=.9;});
    const active=ctx.chapterId==='aiView'||(ctx.chapterId==='review'&&t<F_T0+.8);
    cabinet.update(t,active||(t>=T_SHOT&&t<T_UNAIM[0]));pulse.update(t,active);air.update(t,t>=T_SHOT&&t<F_T0+.8);
    const shown=t>=F_T0-.2;fitter.group.visible=shown;
    if(shown){const f=actors.followPath(fitter.group,F_PATH,F_T0,F_T1,t);
      if(f.done){const turn=smooth(F_T1,F_T1+.8,t);fitter.group.rotation.y=f.heading+Math.atan2(Math.sin(F_FACE-f.heading),Math.cos(F_FACE-f.heading))*turn;}
      const lookIn=f.done?smooth(F_T1+.3,F_T1+1.3,t):0;
      fitter.pose({distance:f.distance,weight:f.moving?f.weight:0,look:.05+.55*lookIn,lean:.25*lookIn,point:f.done?smooth(F_T1+.8,F_T1+1.7,t):0});}
  }
  return{anchors:{wet:zone,pump:wet},sensors:{'robot-cam':{camera:robot.camera,mode:'mask',targets:[wet],label:'Robot camera'}},update,
    metrics:()=>({robot:{...robot.state},feet:robot.feet(),patchScale:patch.scale.x,fitterVisible:fitter.group.visible,fitter:fitter.group.position.toArray()})};
}
