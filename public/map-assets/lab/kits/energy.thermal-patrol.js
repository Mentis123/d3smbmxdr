// E2 "A robot spots an unusual hot connection": one substation bay. Transformer T1 carries three low-voltage
// bushings on its near face; each ends in a bolted cable connector (phases A, B, C). A four-legged robot leaves its
// dock inside the live yard, walks to its inspection point, stops and aims its camera head at the three connectors.
// In visible light they look the same; its thermal camera shows phase B warmer than A and C. An inspector reviews the
// image on a tablet at the gate, outside the fence, while the robot walks back to its dock. Everything is a function of t.
import {createQuadruped} from '../rigs/quadruped.js';

const TX={x:1.75,z:-.45,w:1.0,d:1.3,y0:.14,h:1.0};            // transformer tank
const FACE=TX.x-TX.w/2;                                        // near (-x) face with the LV bushings
const PHASES=[{id:'A',z:-.85},{id:'B',z:-.45},{id:'C',z:-.05}],HOT=1;
const BUSH_Y=.78,BUSH_LEN=.34,CLAMP_X=FACE-BUSH_LEN-.05;
const FENCE_Z=1.32,FENCE_X=-2.05,GATE=[-1.25,-.55];
const HUT=[-2.75,-.5];
const DOCK=[-1.62,-1.45];
const STOP=[-.72,-.45];
const T_RISE=[.3,1.3],T_OUT=[2.0,6.6],T_AIM=[6.7,7.9],T_SHOT=8.0,T_UNAIM=[17.6,18.4],T_BACK=[18.6,23.4],T_DOCK=[23.9,24.9];
const P_T0=17.0,P_T1=20.4;
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};

export function buildKit(k){
  const {THREE,root,box,cylinder,bar,mesh,mat,steel,dark,yellow,concrete,track,props,actors}=k;
  const gravel=mat(0x4a5355,{roughness:1}),pad=mat(0x8c9699,{roughness:.95});
  const tank=mat(0x56605a,{roughness:.6,metalness:.3}),fin=mat(0x6f7c80,{roughness:.55,metalness:.35}),porcelain=mat(0x9fb9b6,{roughness:.25,metalness:.1});
  const copper=mat(0xb07a4c,{roughness:.35,metalness:.75}),bolt=mat(0xc9d0d4,{roughness:.3,metalness:.8}),cableM=mat(0x15191c,{roughness:.8});
  const canvasTex=(w,h,draw,{repeat=null,srgb=true}={})=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=track(new THREE.CanvasTexture(c));if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}return t;};

  // ---- Yard: gravel inside the fence, a cable trench under the connectors ----
  box(5.4,.02,3.35,gravel,(FENCE_X+3.35)/2,.01,(FENCE_Z-2.05)/2);
  box(TX.w+.3,TX.y0,TX.d+.3,pad,TX.x,TX.y0/2,TX.z);
  box(.26,.05,1.5,pad,CLAMP_X-.02,.025,TX.z);for(let i=0;i<5;i++)box(.27,.006,.012,dark,CLAMP_X-.02,.052,TX.z-.6+i*.3);

  // ---- Transformer T1: tank, lid, radiator banks, HV bushings to the gantry, LV bushings with connectors ----
  box(TX.w,TX.h,TX.d,tank,TX.x,TX.y0+TX.h/2,TX.z);
  box(TX.w+.08,.07,TX.d+.08,steel,TX.x,TX.y0+TX.h+.035,TX.z);
  for(const s of [-1,1])for(let j=0;j<9;j++)box(.06,.72,.2,j%3?fin:steel,TX.x-.36+j*.09,TX.y0+.48,TX.z+s*(TX.d/2+.1));
  for(const s of [-1,1])bar([TX.x-.4,TX.y0+.86,TX.z+s*(TX.d/2+.02)],[TX.x+.4,TX.y0+.86,TX.z+s*(TX.d/2+.02)],.025,steel);
  const conservator=cylinder(.13,.9,tank,TX.x+.3,TX.y0+TX.h+.42,TX.z);conservator.rotation.x=Math.PI/2;
  for(const z of [TX.z-.3,TX.z+.3])bar([TX.x+.3,TX.y0+TX.h+.07,z],[TX.x+.3,TX.y0+TX.h+.3,z],.025,steel);
  const top=TX.y0+TX.h+.07;
  function sheds(a,b,r,n,m=porcelain){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);bar(a,b,r*.45,m);
    for(let i=0;i<n;i++){const p=A.clone().lerp(B,(i+.5)/n),o=bar(p.clone().addScaledVector(B.clone().sub(A).normalize(),-.008).toArray(),p.clone().addScaledVector(B.clone().sub(A).normalize(),.008).toArray(),r,m);o.castShadow=true;}}
  // Gantry behind the tank: two columns, beam, three suspension insulators.
  const GX=3.05;for(const z of [-1.6,.7]){bar([GX,0,z],[GX,2.45,z],.045,steel);box(.2,.04,.2,dark,GX,.02,z);}
  bar([GX,2.45,-1.65],[GX,2.45,.75],.04,steel);
  PHASES.forEach(P=>{
    const hv=[TX.x-.15,top,P.z];sheds(hv,[hv[0],top+.5,P.z],.06,7);box(.05,.05,.05,copper,hv[0],top+.53,P.z);
    sheds([GX,2.43,P.z],[GX,2.13,P.z],.045,5);
    const a=new THREE.Vector3(hv[0],top+.55,P.z),b=new THREE.Vector3(GX,2.1,P.z),mid=a.clone().lerp(b,.5);mid.y-=.12;
    mesh(track(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a,mid,b),20,.014,6,false)),copper);
  });
  props.plate('TRANSFORMER T1',.8,.12,{x:FACE-.006,y:TX.y0+TX.h-.08,z:TX.z,ry:-Math.PI/2});

  // LV bushings (porcelain sheds out of the near face), bolted connectors, cables down into the trench.
  const hot=new THREE.Group();hot.name='hot-connector';root.add(hot);
  const reflections=new THREE.Group();reflections.name='reflection-patches';root.add(reflections);
  const connectors=[];
  PHASES.forEach((P,i)=>{
    box(.04,.2,.2,steel,FACE-.02,BUSH_Y,P.z);
    sheds([FACE-.04,BUSH_Y,P.z],[CLAMP_X+.06,BUSH_Y,P.z],.068,6);
    bar([CLAMP_X+.07,BUSH_Y,P.z],[CLAMP_X+.02,BUSH_Y,P.z],.02,copper);
    const g=new THREE.Group();g.name='connector-'+P.id;root.add(g);
    g.add(box(.115,.2,.15,copper,CLAMP_X-.02,BUSH_Y-.025,P.z));
    for(const dy of [.045,-.06])for(const dz of [-.04,.04]){const b=cylinder(.016,.03,bolt,CLAMP_X-.088,BUSH_Y+dy-.025,P.z+dz);b.rotation.z=Math.PI/2;b.userData.unmasked=true;g.add(b);}
    g.add(box(.07,.12,.09,copper,CLAMP_X-.02,BUSH_Y-.18,P.z));                          // cable lug
    bar([CLAMP_X-.02,BUSH_Y-.24,P.z],[CLAMP_X-.02,.05,P.z],.032,cableM);
    if(i===HOT)hot.add(g);
    // Sun on bare metal: thin bright patches on every connector face (the reflection variation only).
    const r=box(.004,.14,.12,mat(0xfff6e0,{emissive:0xfff1cc,emissiveIntensity:1.1,roughness:.2}),CLAMP_X-.08,BUSH_Y-.015,P.z+.005);r.castShadow=false;reflections.add(r);
    const tag=props.plate(P.id,.1,.1,{x:FACE-.006,y:BUSH_Y+.165,z:P.z,ry:-Math.PI/2,bg:'#10161c',fg:'#f2c14e'});tag.userData.sensorKeep=true;
    connectors.push(g);
  });
  reflections.visible=false;
  // Overlay / subject zone around connector B (invisible).
  const zone=new THREE.Group();zone.name='connector-zone';root.add(zone);
  const zm=mesh(track(new THREE.BoxGeometry(.14,.5,.18)),mat(0xffffff),CLAMP_X-.03,BUSH_Y-.02,PHASES[HOT].z);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);

  // ---- Fence: chain-link on posts, front gate with a warning sign; the inspector stays outside ----
  const link=canvasTex(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(205,214,219,1)';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(w,h);g.moveTo(w,0);g.lineTo(0,h);g.stroke();},{repeat:[1,1],srgb:true});
  const linkMat=(len,hgt)=>{const t=track(link.clone());t.needsUpdate=true;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(len/.09,hgt/.09);return mat(0xc4ccd0,{map:t,transparent:true,alphaTest:.35,side:THREE.DoubleSide,metalness:.4,roughness:.5});};
  const FH=1.15;
  function fenceRun(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    const m=mesh(track(new THREE.PlaneGeometry(len,FH-.08)),linkMat(len,FH),(a[0]+b[0])/2,.04+(FH-.08)/2,(a[1]+b[1])/2);m.rotation.y=-Math.atan2(dz,dx);m.castShadow=false;
    const n=Math.max(1,Math.round(len/.6));for(let i=0;i<=n;i++){const x=a[0]+dx*i/n,z=a[1]+dz*i/n;bar([x,0,z],[x,FH,z],.022,steel);}
    bar([a[0],FH,a[1]],[b[0],FH,b[1]],.014,steel);}
  fenceRun([FENCE_X,FENCE_Z],[GATE[0],FENCE_Z]);fenceRun([GATE[1],FENCE_Z],[3.38,FENCE_Z]);fenceRun([FENCE_X,-2.08],[FENCE_X,FENCE_Z]);
  // Closed gate.
  const gw=GATE[1]-GATE[0];const gm=mesh(track(new THREE.PlaneGeometry(gw-.06,FH-.14)),linkMat(gw,FH),(GATE[0]+GATE[1])/2,.06+(FH-.14)/2,FENCE_Z);gm.castShadow=false;
  for(const [a,b] of [[[GATE[0]+.03,.06,FENCE_Z],[GATE[1]-.03,.06,FENCE_Z]],[[GATE[0]+.03,FH-.06,FENCE_Z],[GATE[1]-.03,FH-.06,FENCE_Z]],[[GATE[0]+.03,.06,FENCE_Z],[GATE[0]+.03,FH-.06,FENCE_Z]],[[GATE[1]-.03,.06,FENCE_Z],[GATE[1]-.03,FH-.06,FENCE_Z]]])bar(a,b,.016,yellow);
  props.plate('DANGER · LIVE YARD',.62,.15,{x:(GATE[0]+GATE[1])/2,y:.78,z:FENCE_Z+.02,bg:'#c8221a',fg:'#ffffff'});

  // ---- Yard hut outside the fence with the site GPU; a wireless access point on a pole in the yard ----
  const HUT_H=1.9,hutWall=mat(0x9aa8ad);
  box(.9,HUT_H,.05,hutWall,HUT[0],HUT_H/2,HUT[1]-.33);for(const s of [-1,1])box(.05,HUT_H,.66,hutWall,HUT[0]+s*.45,HUT_H/2,HUT[1]);
  box(.9,.24,.05,hutWall,HUT[0],HUT_H-.12,HUT[1]+.31);
  const roof=box(1.04,.05,.82,mat(0x3d5560),HUT[0],HUT_H+.05,HUT[1]-.02);roof.rotation.x=.12;
  props.plate('SITE GPU',.62,.17,{x:HUT[0],y:HUT_H-.12,z:HUT[1]+.34});
  const cabinet=props.siteCabinet(HUT[0]-.08,HUT[1]-.06,{label:null});cabinet.group.scale.setScalar(.9);
  const port=cabinet.port();
  // Wi-Fi access point on the hut's yard-side wall: it covers the yard from outside the fence.
  const AP=[HUT[0]+.5,HUT[1]+.1];box(.06,.14,.12,mat(0xe9eef0),AP[0],1.62,AP[1]);
  for(const s of [-1,1])bar([AP[0]+.02,1.69,AP[1]+s*.04],[AP[0]+.02,1.9,AP[1]+s*.04],.008,dark);
  props.plate('SITE WI-FI',.36,.09,{x:HUT[0]+.478,y:1.4,z:HUT[1],ry:Math.PI/2});
  const GATE_SPOT=[-.9,0,1.72];
  const pulse=props.pulse([[AP[0]-.03,1.6,AP[1]],[HUT[0]+.4,1.6,AP[1]],[HUT[0]+.4,1.6,HUT[1]-.27],[HUT[0]-.08,1.6,HUT[1]-.27],[HUT[0]-.08,port[1]+.2,port[2]-.1],port,
    port.map((v,i)=>i===1?.03:v),[HUT[0]-.12,.03,HUT[1]+.5],[-2.6,.03,1.62],[GATE_SPOT[0]-.25,.03,1.62]]);

  // ---- Dock and robot ----
  box(.62,.03,1.0,dark,DOCK[0],.015,DOCK[1]);box(.5,.006,.85,mat(0xf2c14e),DOCK[0],.032,DOCK[1]);
  box(.5,.32,.06,dark,DOCK[0],.16,DOCK[1]-.53);
  props.plate('ROBOT DOCK',.42,.1,{x:DOCK[0],y:.26,z:DOCK[1]-.495});
  const robot=createQuadruped(k,{name:'patrol-robot',fov:38});
  robot.camera.userData.portraitWidth=1.6;   // all three connectors across a phone
  const PATH=[DOCK,[DOCK[0],-.95],[-1.42,-.56],[-1.05,-.46],STOP];
  const out=robot.route(PATH),back=robot.route([...PATH].reverse(),{back:true});
  robot.plan([{route:out,t0:T_OUT[0],t1:T_OUT[1]},{route:back,t0:T_BACK[0],t1:T_BACK[1]}]);
  const AIM=[CLAMP_X-.04,BUSH_Y-.05,PHASES[HOT].z];

  // ---- Thermal look: a warm bloom around connector B in the thermal view; glare for the variation ----
  const radial=(stops)=>canvasTex(64,64,(g,w)=>{const r=g.createRadialGradient(32,32,1,32,32,32);stops.forEach(([o,c])=>r.addColorStop(o,c));g.fillStyle=r;g.fillRect(0,0,w,w);});
  const bloom=new THREE.Sprite(track(new THREE.SpriteMaterial({map:radial([[0,'rgba(255,214,120,.95)'],[.28,'rgba(255,128,40,.75)'],[.55,'rgba(220,40,60,.45)'],[.8,'rgba(120,30,120,.2)'],[1,'rgba(60,20,90,0)']]),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
  bloom.userData.noFit=true;bloom.position.set(CLAMP_X+.07,BUSH_Y-.06,PHASES[HOT].z);bloom.scale.set(.5,.62,1);root.add(bloom);
  const glareTex=radial([[0,'rgba(255,255,255,1)'],[.25,'rgba(255,250,225,.75)'],[1,'rgba(255,240,200,0)']]);
  const glints=PHASES.map(P=>{const s=new THREE.Sprite(track(new THREE.SpriteMaterial({map:glareTex,color:0xfff3d0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})));s.userData.noFit=true;s.position.set(CLAMP_X-.1,BUSH_Y,P.z);s.scale.set(.3,.3,1);root.add(s);return s;});
  const tankGlint=new THREE.Sprite(track(new THREE.SpriteMaterial({map:glareTex,color:0xfff3d0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})));tankGlint.userData.noFit=true;tankGlint.position.set(FACE-.05,BUSH_Y+.12,TX.z);tankGlint.scale.set(.75,.4,1);root.add(tankGlint);
  const lensGlare=new THREE.Sprite(track(new THREE.SpriteMaterial({map:glareTex,color:0xfff6dc,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})));lensGlare.position.set(.06,.05,-.45);lensGlare.scale.set(.5,.36,1);robot.camera.add(lensGlare);

  // ---- The data hop: the capture leaves the robot's head over site Wi-Fi to the access point on the hut ----
  // (diagrammatic: no cable is drawn through the air, only the pulse while the image is in flight)
  const HEAD=[STOP[0]+.27,.86,STOP[1]];
  const air=props.pulse([HEAD,[(HEAD[0]+AP[0])/2,1.55,(HEAD[2]+AP[1])/2],[AP[0]+.03,1.62,AP[1]]],{radius:.014,speed:.9,repeat:2});air.cable.visible=false;

  // ---- Inspector: walks from the hut to the gate, reviews the image on a tablet, glances into the yard ----
  const person=actors.person({vest:0xff7a1a,shirt:0x2f4f6a,name:'inspector'});
  const P_PATH=[[HUT[0],0,HUT[1]+.55],[-2.62,0,1.7],GATE_SPOT];
  const FACE_YARD=Math.atan2(TX.x-GATE_SPOT[0],TX.z-GATE_SPOT[2]),READ_H=-1.25;   // turns from the yard to read, facing the hut path
  // Tablet held at the chest with both hands; its screen carries the robot's thermal picture: T1, A B C, B warm, boxed.
  const arms=[];person.group.traverse(o=>{if(o.isGroup&&Math.abs(o.position.y-.5)<1e-6&&Math.abs(Math.abs(o.position.x)-.235)<1e-6)arms.push({shoulder:o,elbow:o.children.find(c=>c.isGroup)});});
  const torso=arms[0]?.shoulder.parent;
  const screen=unclear=>canvasTex(256,180,(g,w,h)=>{
    g.fillStyle='#0b0f22';g.fillRect(0,0,w,h);
    g.fillStyle='#1a2448';g.fillRect(14,40,w-28,h-54);
    [[60,'A'],[128,'B'],[196,'C']].forEach(([x,id],i)=>{
      if(i===1&&!unclear){const r=g.createRadialGradient(x,104,3,x,104,46);r.addColorStop(0,'rgba(255,214,120,1)');r.addColorStop(.35,'rgba(255,120,40,.85)');r.addColorStop(.7,'rgba(200,40,70,.45)');r.addColorStop(1,'rgba(90,20,110,0)');g.fillStyle=r;g.fillRect(x-50,54,100,100);}
      g.fillStyle=i===1&&!unclear?'#ffe09a':unclear?'#b9bfc6':'#4a5a8e';g.fillRect(x-14,82,28,40);g.fillRect(x-9,122,18,16);
      g.fillStyle='#e8f0ff';g.font='700 18px Arial';g.textAlign='center';g.fillText(id,x,72);});
    if(unclear){const r=g.createRadialGradient(150,90,4,150,90,120);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);}
    g.strokeStyle=unclear?'#a4aeb6':'#ff4b3e';g.lineWidth=4;if(unclear)g.setLineDash([10,7]);g.strokeRect(unclear?30:104,unclear?50:76,unclear?196:48,unclear?100:70);g.setLineDash([]);
    g.fillStyle='#ffffff';g.font='700 22px Arial';g.textAlign='left';g.fillText(unclear?'T1 · RETAKE':'T1 · PHASE B',14,28);});
  const scrClear=screen(false),scrUnclear=screen(true);
  const tablet=new THREE.Group();tablet.name='tablet';if(torso){torso.add(tablet);tablet.position.set(0,.26,.31);}
  tablet.add(box(.4,.29,.018,dark,0,0,0));const scrMat=track(new THREE.MeshBasicMaterial({map:scrClear,toneMapped:false}));
  const scr=k.mesh(new THREE.PlaneGeometry(.37,.26),scrMat);scr.position.set(0,0,.0105);scr.castShadow=false;tablet.add(scr);

  function update(t,ctx){
    const refl=ctx.variation==='reflection',glare=refl?smooth(4.4,8,t):0;
    // Robot: rises off the dock, walks out, aims, captures, walks back, docks.
    const dock=t<T_RISE[1]?1-smooth(T_RISE[0],T_RISE[1],t):smooth(T_DOCK[0],T_DOCK[1],t);
    const aimW=smooth(T_AIM[0],T_AIM[1],t)*(1-smooth(T_UNAIM[0],T_UNAIM[1],t));
    robot.update(t,{dock,aim:AIM,aimWeight:aimW,idleTilt:.3,tally:t>=T_SHOT&&t<T_UNAIM[0]});
    // Thermal: B's halo only through the robot camera. With sun on the metal every connector flares the same, so the
    // picture cannot single one out: B is drawn like its neighbours and the glare patches are what reads "hot".
    hot.userData.unmasked=refl;
    bloom.visible=!!ctx.sensor&&!refl;
    reflections.visible=refl&&t>=4.4;
    glints.forEach(s=>{s.material.opacity=glare*.75;s.visible=glare>0;});
    tankGlint.material.opacity=glare*.55;tankGlint.visible=glare>0;
    lensGlare.material.opacity=refl&&ctx.sensor?.6:0;lensGlare.visible=!!(refl&&ctx.sensor);
    const active=ctx.chapterId==='aiView'||(ctx.chapterId==='review'&&t<P_T0+1.4);
    cabinet.update(t,active||(t>=T_SHOT&&t<T_UNAIM[0]));pulse.update(t,active);air.update(t,t>=T_SHOT&&t<P_T0+1.4);
    const shown=t>=P_T0-.2;person.group.visible=shown;tablet.visible=shown;
    scrMat.map=refl?scrUnclear:scrClear;
    if(shown){const f=actors.followPath(person.group,P_PATH,P_T0,P_T1,t);
      // Looks into the yard on arrival, then turns to read the tablet; glances up while the robot docks.
      const dh=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
      if(f.done){const h1=f.heading+dh(f.heading,FACE_YARD)*smooth(P_T1,P_T1+.7,t);person.group.rotation.y=h1+dh(FACE_YARD,READ_H)*smooth(P_T1+1.3,P_T1+2.1,t);}
      const read=f.done?smooth(P_T1+1.5,P_T1+2.2,t)*(1-.8*smooth(23.3,23.8,t)*(1-smooth(24.8,25.3,t))):0;
      person.pose({distance:f.distance,weight:f.moving?f.weight:0,look:.1+.42*read,lean:.06});
      // Both hands at the tablet's lower corners (two-bone solve, shoulder (0,.5,0) to hand (.17,.26,.33) in the torso).
      for(const a of arms){const side=Math.sign(a.shoulder.position.x);a.shoulder.rotation.x=-.09;a.shoulder.rotation.z=-side*.12;if(a.elbow)a.elbow.rotation.x=-1.68;}
      tablet.rotation.x=-1.3-.3*(1-read);}
  }
  return{anchors:{connector:zone,transformer:conservator},sensors:{'robot-thermal':{camera:robot.camera,mode:'thermal',targets:[hot,reflections],label:'Robot thermal camera',key:()=>hot.userData.unmasked?'glare':'clear'}},update,
    metrics:()=>({robot:{...robot.state},feet:robot.feet(),inspectorVisible:person.group.visible,inspector:person.group.position.toArray()})};
}
