// DC2 "Too hot: cooling reality check". One row on a slab-on-grade floor (no raised floor, DATACENTER-DESIGN.md):
// conventional racks with in-row air coolers between them, cold aisle in front, hot aisle behind. Cold air leaves the
// coolers, crosses the aisle and enters the rack fronts; warm air leaves the backs and returns to the coolers.
// An AI rack powers up: its exhaust plume grows, spills over the top back into the cold aisle, and the coolers' fans
// run flat out. A thermal camera on a tripod shows it hot against cooler neighbours. Then liquid-assisted cooling is
// fitted (a CDU, an overhead supply and return loop, a manifold down the rack front), the plume dies away, the fans
// settle, and a facilities engineer checks the rack. Everything is a pure function of t.
import {createFlowMaterial} from '../../flow-effects.js';

const RZ=-.6,RD=1.0,RH=2.0,FRONT=RZ+RD/2,REAR=RZ-RD/2;      // row centre line, depth, height, front and rear faces
const AI_X=-1.0,AI_W=.66;
const RACKS=[{x:-2.55},{x:-1.65},{x:-.05},{x:.55}];          // conventional racks, .6 wide
const IRCS=[{x:-2.1,feeds:[0,1]},{x:-.5,feeds:['ai',2,3]}];   // in-row air coolers, .3 wide
const CDU_X=1.35;
const TRIPOD=[-2.3,1.95],LENS_Y=1.45;
// Timeline (s). Change starts at 4; the camera arrives about 6.
const T_POWER=[6.2,7.4],T_HEAT=[6.6,9.4],T_FAN=[7.0,9.6],T_LIMIT=8.6;
const T_CDU=[17.0,17.8],T_SUP=[17.8,19.6],T_RET=[18.1,19.9],T_FLOW=19.6,T_COOL=[20.0,23.0],T_FAN_DOWN=[20.0,23.0],T_LIQ=20.4;
const E_T0=18.0,E_T1=21.4;
const TAU=Math.PI*2;
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
// Integral of smooth(a,b,.) from a to t, so a fan's angle stays a pure function of t through a speed ramp.
const ramp=(a,b,t)=>{if(t<=a)return 0;if(t>=b)return (b-a)*.5+(t-b);const u=(t-a)/(b-a);return (b-a)*(u*u*u-u*u*u*u/2);};
const bez=(p,u,out)=>{const a=(1-u)*(1-u),b=2*(1-u)*u,c=u*u;out[0]=a*p[0][0]+b*p[1][0]+c*p[2][0];out[1]=a*p[0][1]+b*p[1][1]+c*p[2][1];out[2]=a*p[0][2]+b*p[1][2]+c*p[2][2];return out;};

export function buildKit(k){
  const {THREE,root,box,cylinder,bar,mesh,mat,steel,dark,track,props,actors}=k;
  const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;return t;};
  const radial=stops=>canvasTex(64,64,(g,w)=>{const r=g.createRadialGradient(32,32,1,32,32,32);stops.forEach(([o,c])=>r.addColorStop(o,c));g.fillStyle=r;g.fillRect(0,0,w,w);});

  // ---- Floor: slab on grade with saw-cut joints; the cold aisle tinted blue, the hot aisle warm ----
  box(6.6,.006,1.25,mat(0x9fb7c4,{roughness:.95}),-.4,.003,FRONT+.62);
  box(6.6,.006,.95,mat(0xb9a79a,{roughness:.95}),-.4,.003,REAR-.5);
  for(let x=-3.2;x<=2.9;x+=1.2)box(.012,.009,4.1,dark,x,.005,0);
  props.plate('COLD AISLE',.9,.18,{x:1.15,y:.012,z:FRONT+1.0,rx:-Math.PI/2,bg:'#0f2c44',fg:'#8fe3ff'});
  props.plate('HOT AISLE',.9,.18,{x:1.15,y:.012,z:REAR-.5,rx:-Math.PI/2,bg:'#3b1d12',fg:'#ffb27a'});

  // ---- Conventional racks: frame, 1U/2U servers, blinking status lights ----
  const frameM=mat(0x1b2329,{metalness:.5,roughness:.5}),serverM=mat(0x5d6a72,{metalness:.45,roughness:.45}),bezel=mat(0x2a343b,{roughness:.6});
  const ledOn=mat(0x6fffb8,{emissive:0x2bd98a,emissiveIntensity:1.0});
  const leds=[];
  function rackShell(x,w,material=frameM){
    const parts=[];
    parts.push(box(w,RH,RD-.04,material,x,RH/2,RZ-.02));                              // body
    parts.push(box(w+.02,.05,RD,material,x,RH-.02,RZ));                               // roof lip
    for(const s of [-1,1])parts.push(box(.035,RH,.04,steel,x+s*(w/2-.02),RH/2,FRONT)); // front posts
    return parts;
  }
  RACKS.forEach((R,ri)=>{
    rackShell(R.x,.6);
    for(let j=0;j<9;j++){const y=.22+j*.19;box(.5,.15,.03,j%3===1?bezel:serverM,R.x,y,FRONT-.005);
      const l=box(.025,.018,.01,ledOn,R.x+.19,y+.03,FRONT+.012);l.castShadow=false;leds.push({o:l,f:1.3+rnd(ri*9+j,3)*2.6,p:rnd(ri*9+j,4)*TAU});}
  });

  // ---- The AI rack: black, purple trim, chunky GPU trays that light up when it powers on ----
  const aiRack=new THREE.Group();aiRack.name='ai-rack';root.add(aiRack);
  const aiFrame=mat(0x101418,{metalness:.55,roughness:.4});
  rackShell(AI_X,AI_W,aiFrame).forEach(o=>aiRack.add(o));
  const trim=mat(0x3a1450,{emissive:0xc24dff,emissiveIntensity:.15});
  for(const s of [-1,1]){const o=box(.018,RH-.1,.012,trim,AI_X+s*(AI_W/2-.045),RH/2,FRONT+.012);o.castShadow=false;aiRack.add(o);}
  const trayM=mat(0x2b3138,{metalness:.6,roughness:.35}),grilleMats=[];
  for(let j=0;j<6;j++){const y=.32+j*.28;aiRack.add(box(AI_W-.1,.24,.035,trayM,AI_X,y,FRONT-.01));
    const gm=mat(0x221030,{emissive:0xc24dff,emissiveIntensity:0});grilleMats.push(gm);
    for(let r=0;r<3;r++){const o=box(AI_W-.22,.022,.01,gm,AI_X,y-.06+r*.06,FRONT+.012);o.castShadow=false;aiRack.add(o);}}
  const aiStatusM=mat(0x47e3a6,{emissive:0x1fbf84,emissiveIntensity:.6});
  const aiStatus=box(AI_W-.16,.035,.012,aiStatusM,AI_X,RH-.1,FRONT+.012);aiStatus.castShadow=false;aiRack.add(aiStatus);
  const aiPlate=props.plate('AI RACK',.5,.12,{x:AI_X,y:RH+.12,z:FRONT-.05,bg:'#c24dff',fg:'#ffffff'});aiPlate.userData.sensorKeep=true;
  // Overlay / subject zone: the AI rack (invisible).
  const zone=new THREE.Group();zone.name='ai-rack-zone';root.add(zone);
  const zm=mesh(track(new THREE.BoxGeometry(AI_W+.04,RH+.05,RD)),mat(0xffffff),AI_X,RH/2,RZ);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);

  // ---- In-row air coolers: white cabinets, three fans each on the cold-aisle face, a status strip ----
  const ircBody=mat(0xc9d3d9,{metalness:.25,roughness:.5}),grille=mat(0x2b3439,{metalness:.5,roughness:.5}),bladeM=mat(0x9aa7ae,{metalness:.6,roughness:.35});
  const ringGeo=track(new THREE.TorusGeometry(.1,.012,6,28)),discGeo=track(new THREE.CircleGeometry(.098,28));
  const fans=[],ircStatus=[];
  IRCS.forEach((C,ci)=>{
    box(.3,RH,RD-.04,ircBody,C.x,RH/2,RZ-.02);
    box(.26,1.62,.012,grille,C.x,1.0,FRONT+.004);
    for(let f=0;f<3;f++){const y=.48+f*.52;
      const ring=mesh(ringGeo,steel,C.x,y,FRONT+.02);ring.castShadow=false;
      const hub=new THREE.Group();hub.position.set(C.x,y,FRONT+.02);root.add(hub);
      for(let b=0;b<5;b++){const blade=box(.03,.085,.008,bladeM,0,0,0);blade.castShadow=false;hub.add(blade);blade.position.set(Math.sin(b/5*TAU)*.05,Math.cos(b/5*TAU)*.05,0);blade.rotation.set(0,.5,-b/5*TAU);}
      const cap=cylinder(.02,.02,dark,0,0,0);cap.rotation.x=Math.PI/2;hub.add(cap);
      const blurM=track(new THREE.MeshBasicMaterial({color:0xb9c6cc,transparent:true,opacity:0,depthWrite:false}));
      const blur=mesh(discGeo,blurM,C.x,y,FRONT+.024);blur.castShadow=blur.receiveShadow=false;
      fans.push({hub,blur,blurM,strain:C.feeds.includes('ai'),p:rnd(ci*3+f,5)*TAU});}
    const sm=mat(0x47e3a6,{emissive:0x1fbf84,emissiveIntensity:.8});const s=box(.2,.04,.012,sm,C.x,1.9,FRONT+.012);s.castShadow=false;ircStatus.push({m:sm,strain:C.feeds.includes('ai')});
  });
  const IRC_LABEL=props.plate('IN-ROW AIR COOLER',.62,.11,{x:IRCS[1].x,y:RH+.1,z:FRONT-.05,bg:'#d9e4ea',fg:'#10161c'});IRC_LABEL.scale.setScalar(.85);
  // Infographic labels: "Air cooled · limited capacity" once the coolers strain; "Liquid cooled · high capacity" once fitted.
  const airSign=props.plate('AIR COOLED · LIMITED CAPACITY',1.4,.19,{x:AI_X+.32,y:2.75,z:FRONT,bg:'#10161c',fg:'#ffb02e'});airSign.userData.sensorKeep=true;
  const liqSign=props.plate('LIQUID COOLED · HIGH CAPACITY',1.5,.2,{x:AI_X+.55,y:2.95,z:FRONT,bg:'#c24dff',fg:'#ffffff'});

  // ---- Air: cold supply from the coolers into rack fronts; warm exhaust from rack backs; the AI plume ----
  const dot=radial([[0,'rgba(255,255,255,1)'],[.35,'rgba(255,255,255,.55)'],[1,'rgba(255,255,255,0)']]);
  function cloud(n,size){
    const geo=track(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(n*3),3));
    const m=track(new THREE.PointsMaterial({size,map:dot,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));
    const pts=new THREE.Points(geo,m);pts.frustumCulled=false;pts.userData.noFit=true;root.add(pts);return{pts,pos:geo.attributes.position,col:geo.attributes.color};
  }
  const xOf=f=>f==='ai'?AI_X:RACKS[f].x;
  const COLD=[],cold=cloud(240,.07);
  for(let i=0;i<240;i++){const C=IRCS[i%2],f=C.feeds[Math.floor(rnd(i,1)*C.feeds.length)],tx=xOf(f)+(rnd(i,2)-.5)*.42,y=.25+rnd(i,3)*1.6;
    COLD.push({p:[[C.x+(rnd(i,4)-.5)*.2,y,FRONT+.05],[C.x+(tx-C.x)*.45,y+(rnd(i,5)-.5)*.3,FRONT+.55+rnd(i,6)*.35],[tx,.2+rnd(i,7)*1.7,FRONT+.02]],rate:1/(2.6+rnd(i,8)*1.4),off:rnd(i,9)});}
  const nearestIrc=x=>IRCS.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a).x;
  const WARM=[],warm=cloud(120,.07);
  for(let i=0;i<120;i++){const R=RACKS[i%4],j=rnd(i,11)-.5;
    WARM.push({p:[[R.x+j*.5,.4+rnd(i,12)*1.4,REAR-.02],[R.x+j*.4,2.15+rnd(i,13)*.2,REAR-.4],[nearestIrc(R.x)+j*.2,.9+rnd(i,14)*.8,REAR-.02]],rate:1/(3+rnd(i,15)),off:rnd(i,16)});}
  const HOT=[],hotCloud=cloud(300,.16);
  for(let i=0;i<300;i++){const j=rnd(i,21)-.5,spill=i%10<4,k0=rnd(i,22);
    const p=spill?[[AI_X+j*.5,1.3+rnd(i,23)*.6,REAR-.02],[AI_X+j*.55,2.4+rnd(i,24)*.25,RZ],[AI_X+j*.8,1.2+rnd(i,25)*.7,FRONT+.75+rnd(i,26)*.3]]
      :[[AI_X+j*.5,.5+rnd(i,23)*1.4,REAR-.02],[AI_X+j*.6,2.1+rnd(i,24)*.3,REAR-.3],[AI_X+j*1.1,2.55+rnd(i,25)*.75,RZ-.25+rnd(i,26)*.4]];
    HOT.push({p,k:k0,rate:1/(1.8+rnd(i,27)*1.0),off:rnd(i,28),red:rnd(i,29)});}
  const plume=new THREE.Sprite(track(new THREE.SpriteMaterial({map:radial([[0,'rgba(255,160,80,1)'],[.35,'rgba(255,80,30,.75)'],[.7,'rgba(210,30,40,.3)'],[1,'rgba(120,20,40,0)']]),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})));
  plume.userData.noFit=true;plume.position.set(AI_X,2.55,RZ-.15);plume.scale.set(1.7,1.4,1);root.add(plume);
  const bloom=new THREE.Sprite(track(new THREE.SpriteMaterial({map:radial([[0,'rgba(255,214,120,.9)'],[.3,'rgba(255,128,40,.7)'],[.6,'rgba(220,40,60,.4)'],[1,'rgba(60,20,90,0)']]),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
  bloom.userData.noFit=true;bloom.position.set(AI_X,1.3,FRONT+.1);bloom.scale.set(1.25,2.5,1);root.add(bloom);

  // ---- Thermal camera on a tripod in the cold aisle (the sensor) ----
  const look=new THREE.Vector3(AI_X+.1,1.1,RZ+.2),lens=new THREE.Vector3(TRIPOD[0],LENS_Y,TRIPOD[1]);
  for(let i=0;i<3;i++){const a=i/3*TAU+.4;bar([TRIPOD[0]+Math.cos(a)*.28,0,TRIPOD[1]+Math.sin(a)*.28],[TRIPOD[0],LENS_Y-.14,TRIPOD[1]],.014,dark);}
  bar([TRIPOD[0],LENS_Y-.16,TRIPOD[1]],[TRIPOD[0],LENS_Y-.06,TRIPOD[1]],.02,steel);
  const head=new THREE.Group();head.position.copy(lens);head.lookAt(look);root.add(head);
  const hb=box(.14,.12,.24,mat(0x2a3238,{roughness:.45,metalness:.3}),0,0,0);head.add(hb);hb.position.set(0,0,0);
  const lensRing=cylinder(.05,.04,mat(0xff8a3d,{roughness:.4,emissive:0x5a1e00,emissiveIntensity:.4}),0,0,0);head.add(lensRing);lensRing.rotation.x=Math.PI/2;lensRing.position.set(0,0,.13);
  const glass=cylinder(.038,.02,mat(0x0a1720,{metalness:.8,roughness:.08}),0,0,0);head.add(glass);glass.rotation.x=Math.PI/2;glass.position.set(0,0,.145);
  props.plate('THERMAL CAMERA',.46,.1,{x:TRIPOD[0],y:LENS_Y+.16,z:TRIPOD[1],ry:.35});
  const sensorCam=new THREE.PerspectiveCamera(62,1,.05,30);sensorCam.position.copy(lens).add(new THREE.Vector3().subVectors(look,lens).normalize().multiplyScalar(.2));sensorCam.lookAt(look);root.add(sensorCam);
  sensorCam.userData.portraitWidth=.9;

  // ---- Liquid-assisted cooling (review): CDU, overhead supply and return, a manifold down the rack front ----
  const cdu=new THREE.Group();cdu.name='cdu';root.add(cdu);
  const cduBody=mat(0x2f3b44,{metalness:.5,roughness:.45});
  cdu.add(box(.6,1.8,.85,cduBody,CDU_X,.9,RZ));
  cdu.add(box(.5,.5,.012,mat(0x1a2228),CDU_X,1.35,RZ+.43));
  const cduLed=mat(0x7fe8ff,{emissive:0x19c9ff,emissiveIntensity:1});cdu.add(box(.3,.04,.012,cduLed,CDU_X,1.66,RZ+.432));
  for(const s of [-1,1]){const g=mesh(track(new THREE.CircleGeometry(.07,20)),mat(0xc9d0d4,{metalness:.7,roughness:.3}),CDU_X+s*.13,.75,RZ+.432);g.castShadow=false;cdu.add(g);}
  const cduPlate=props.plate('CDU · COOLANT',.5,.12,{x:CDU_X,y:1.2,z:RZ+.45,bg:'#0d2230',fg:'#8fe3ff'});cdu.add(cduPlate);
  cdu.visible=false;
  const SUP_X=AI_X+AI_W/2-.07,RET_X=AI_X-AI_W/2+.07,MZ=FRONT+.035;
  function loop(points,flowOpts){
    const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));
    const geo=track(new THREE.TubeGeometry(path,points.length*40,.032,8,false));
    const flow=track(createFlowMaterial({speed:.55/Math.max(1,path.getLength()),repeat:5,...flowOpts}));
    const tube=new THREE.Mesh(geo,flow);tube.userData.noFit=true;root.add(tube);
    return{tube,flow,count:geo.index.count};
  }
  const supply=loop([[CDU_X-.13,1.8,RZ+.1],[CDU_X-.13,2.42,RZ+.1],[SUP_X,2.42,RZ+.1],[SUP_X,2.42,MZ],[SUP_X,.25,MZ]],{base:[.01,.08,.14],glow:[.2,1.6,2.4]});
  const ret=loop([[RET_X,.25,MZ],[RET_X,2.56,MZ],[RET_X,2.56,RZ-.1],[CDU_X+.13,2.56,RZ-.1],[CDU_X+.13,1.8,RZ-.1]],{base:[.08,.02,.12],glow:[1.5,.45,2.2]});
  // Hoses from the manifolds to each GPU tray (direct-to-chip, drawn at the front so it can be seen).
  const hoses=new THREE.Group();hoses.name='hoses';root.add(hoses);
  const hoseS=mat(0x2fb8e6,{emissive:0x0c6f9a,emissiveIntensity:.6}),hoseR=mat(0xa24ad6,{emissive:0x5a1a80,emissiveIntensity:.6});
  for(let j=0;j<6;j++){const y=.32+j*.28;hoses.add(bar([SUP_X,y+.04,MZ],[AI_X+.08,y+.04,FRONT+.02],.012,hoseS));hoses.add(bar([RET_X,y-.04,MZ],[AI_X-.08,y-.04,FRONT+.02],.012,hoseR));}
  hoses.visible=false;
  // Pipe supports on the rack roofs.
  const supports=new THREE.Group();root.add(supports);
  for(const x of [RACKS[2].x,RACKS[3].x,CDU_X-.3])supports.add(bar([x,RH,RZ],[x,2.6,RZ],.012,steel)),supports.add(bar([x,2.6,RZ-.15],[x,2.6,RZ+.15],.012,steel));
  supports.visible=false;

  // ---- Facilities engineer: walks in along the cold aisle, stops at the AI rack, checks the manifold ----
  const eng=actors.person({vest:0xff7a1a,shirt:0x2f4f6a,name:'facilities-engineer'});
  const E_END=[AI_X-.62,0,FRONT+.85],E_PATH=[[3.0,0,FRONT+1.7],[.6,0,FRONT+1.35],E_END];
  const E_FACE=Math.atan2(AI_X-E_END[0],RZ-E_END[2]);

  const tmp=[0,0,0];
  function update(t,ctx){
    const power=smooth(T_POWER[0],T_POWER[1],t);
    const cool=smooth(T_COOL[0],T_COOL[1],t),heat=smooth(T_HEAT[0],T_HEAT[1],t)*(1-cool);
    const strain=smooth(T_FAN[0],T_FAN[1],t)*(1-smooth(T_FAN_DOWN[0],T_FAN_DOWN[1],t));
    // Conventional racks: blinking status lights.
    for(const L of leds)L.o.visible=Math.sin(t*L.f+L.p)>-.4;
    // AI rack: trays light up one after another; purple trim; status strip green -> red under heat -> green once liquid cooled.
    grilleMats.forEach((m,j)=>{m.emissiveIntensity=1.6*smooth(T_POWER[0]+j*.15,T_POWER[0]+j*.15+.4,t)*(.85+.15*Math.sin(t*3+j));});
    trim.emissiveIntensity=.15+1.2*power;
    const hotState=smooth(T_LIMIT-.6,T_LIMIT,t)*(1-cool);
    aiStatusM.color.setRGB(.28+.72*hotState,.89-.6*hotState,.65-.45*hotState);aiStatusM.emissive.setRGB(.12+.88*hotState,.75-.6*hotState,.52-.45*hotState);
    aiStatusM.emissiveIntensity=.6+.8*hotState*(.6+.4*Math.sin(t*8));
    // Fans: base speed, flat out next to the AI rack while it heats, settling once liquid takes the heat.
    const W0=2.2,DW=7.5;
    for(const F of fans){const extra=F.strain?DW*(ramp(T_FAN[0],T_FAN[1],t)-ramp(T_FAN_DOWN[0],T_FAN_DOWN[1],t)):DW*.15*(ramp(T_FAN[0],T_FAN[1],t)-ramp(T_FAN_DOWN[0],T_FAN_DOWN[1],t));
      F.hub.rotation.z=-(W0*t+extra)*TAU+F.p;const s=F.strain?strain:strain*.15;F.blurM.opacity=.1+.72*s;F.blur.visible=true;}
    for(const S of ircStatus){const s=S.strain?strain:0;S.m.color.setRGB(.28+.72*s,.89-.3*s,.65-.6*s);S.m.emissive.setRGB(.12+.88*s,.75-.35*s,.52-.5*s);S.m.emissiveIntensity=.8+.6*s*(.5+.5*Math.sin(t*10));}
    airSign.visible=t>=T_LIMIT&&t<T_LIQ&&!ctx.sensor;
    liqSign.visible=t>=T_LIQ;
    // Air.
    const sensor=!!ctx.sensor;
    for(let i=0;i<COLD.length;i++){const P=COLD[i],u=((t*P.rate+P.off)%1+1)%1;bez(P.p,u,tmp);cold.pos.setXYZ(i,tmp[0],tmp[1],tmp[2]);
      const a=sensor?0:Math.sin(Math.PI*u)*.5;cold.col.setXYZ(i,.25*a,.75*a,1*a);}
    for(let i=0;i<WARM.length;i++){const P=WARM[i],u=((t*P.rate+P.off)%1+1)%1;bez(P.p,u,tmp);warm.pos.setXYZ(i,tmp[0],tmp[1],tmp[2]);
      const a=Math.sin(Math.PI*u)*.32;warm.col.setXYZ(i,1*a,.55*a,.25*a);}
    for(let i=0;i<HOT.length;i++){const P=HOT[i],u=((t*P.rate+P.off)%1+1)%1;bez(P.p,u,tmp);
      // Plume reaches higher as the heat grows.
      tmp[1]=P.p[0][1]+(tmp[1]-P.p[0][1])*(.55+.45*heat);hotCloud.pos.setXYZ(i,tmp[0],tmp[1],tmp[2]);
      const a=Math.min(1,Math.sin(Math.PI*u)*1.6)*smooth(P.k-.08,P.k+.08,heat*1.08)*1.2;hotCloud.col.setXYZ(i,1*a,(.42-.3*P.red)*a,(.14-.1*P.red)*a);}
    cold.pos.needsUpdate=cold.col.needsUpdate=warm.pos.needsUpdate=warm.col.needsUpdate=hotCloud.pos.needsUpdate=hotCloud.col.needsUpdate=true;
    plume.material.opacity=1*heat*(.9+.1*Math.sin(t*2.3));plume.visible=heat>.01;plume.scale.set(1.2+1.0*heat,1.0+1.1*heat,1);plume.position.y=2.3+.55*heat;
    bloom.visible=sensor;bloom.material.opacity=.35+.65*Math.max(heat,.2);
    // Liquid-assisted cooling, fitted in review.
    const cduU=smooth(T_CDU[0],T_CDU[1],t);cdu.visible=cduU>0;cdu.scale.set(1,Math.max(.001,cduU),1);
    const sup=smooth(T_SUP[0],T_SUP[1],t),rt=smooth(T_RET[0],T_RET[1],t);
    supply.tube.visible=sup>0;ret.tube.visible=rt>0;
    supply.tube.geometry.setDrawRange(0,Math.ceil(supply.count*sup/6)*6);ret.tube.geometry.setDrawRange(0,Math.ceil(ret.count*rt/6)*6);
    const flowing=t>=T_FLOW?1:0;supply.flow.uniforms.uTime.value=flowing?t-T_FLOW:0;ret.flow.uniforms.uTime.value=flowing?t-T_FLOW:0;
    supply.flow.uniforms.uGlow.value.set(.2,1.6,2.4).multiplyScalar(.25+.75*flowing);ret.flow.uniforms.uGlow.value.set(1.5,.45,2.2).multiplyScalar(.25+.75*flowing);
    hoses.visible=t>=T_RET[1]-.2;supports.visible=t>=T_CDU[0];
    cduLed.emissiveIntensity=1+.6*Math.max(0,Math.sin(t*6))*flowing;
    // Engineer.
    const shown=t>=E_T0-.2;eng.group.visible=shown;
    if(shown){const f=actors.followPath(eng.group,E_PATH,E_T0,E_T1,t);
      if(f.done){const turn=smooth(E_T1,E_T1+.8,t);eng.group.rotation.y=f.heading+Math.atan2(Math.sin(E_FACE-f.heading),Math.cos(E_FACE-f.heading))*turn;}
      const at=f.done?smooth(E_T1+.6,E_T1+1.4,t):0;
      eng.pose({distance:f.distance,weight:f.moving?f.weight:0,look:.1+.2*at,lean:.05*at,point:at*(1-smooth(24.6,25.3,t)),pointPitch:1.3});}
  }
  return{anchors:{aiRack:zone,cdu},sensors:{'thermal-cam':{camera:sensorCam,mode:'thermal',targets:[aiRack],label:'Thermal camera'}},update,
    metrics:()=>({engineerVisible:eng.group.visible,engineer:eng.group.position.toArray(),cduVisible:cdu.visible})};
}
