// D1 "Too hungry: power density shock" (Data#3 infographic, Your journey to AI-ready infrastructure).
// A row of ten traditional racks, each fed by a thin whip from the row panel and showing one 10 kW gauge segment.
// One modern AI rack is wheeled in on the same panel; its gauge, on the SAME scale (one segment = 10 kW), climbs past
// the whole row's design (10 x 10 kW) to 250 kW. The power view follows its thin feed: over capacity, the breaker
// trips. Review: a new high-capacity feed and a fat overhead busway power it; gauges go green; the engineer signs off.
// Figures are the infographic's (10 kW racks, 5-20 kW traditional, 100-250+ kW AI). Everything is a function of t.

const BLUE='#2aa8ff',AMBER='#ffb02e',GREEN='#5dff6a',RED='#ff4b3e';
const KW=.008,SEG=10*KW;                                           // one gauge segment = 10 kW, 8 cm, on every rack
const ROW_Z=-1.15,RACK_W=.42,PITCH=.46,RACK_H=1.8,RACK_D=.8,X0=-2.95,N=10;
const PANEL={x:1.95,z:-1.3,w:.6,d:.45,h:1.8},TRAY_Y=2.05;
const AI={x:2.6,z0:1.62,z1:.35,w:.8,h:2.0,d:1.1},AI_SEGS=25;      // 25 x 10 kW = 250 kW
const BOARD={x:3.0,z:-1.6,w:.62,d:.45,h:2.1},BUS_Y=2.6,BUS_END=.15;
const T_IN=[4.35,4.6],T_ROLL=[4.6,7.0],T_LIVE=7.4,T_CLIMB=[7.8,9.8],T_TRIP=13.9;
const T_PULL=17.3,T_BOARD=[16.9,17.8],T_BUS=[17.7,19.0],T_LIVE2=19.3,T_CLIMB2=[19.5,20.9];
const P_T0=17.4,P_T1=21.4,T_SIGN=22.9;
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};

export function buildKit(k){
  const {THREE,root,box,cylinder,bar,mesh,mat,steel,dark,track,props,actors}=k;
  const glow=(c,i=.9)=>mat(c,{emissive:c,emissiveIntensity:i,roughness:.4});
  const floorM=mat(0x1a242d,{roughness:.9}),cut=mat(0x0d151b),rackM=mat(0x26323c,{metalness:.45,roughness:.5}),doorM=mat(0x33424e,{metalness:.4,roughness:.55});
  const aiBody=mat(0x0e141a,{metalness:.55,roughness:.4}),sled=mat(0x1d2a35,{metalness:.5,roughness:.45}),panelM=mat(0x5d6b75,{metalness:.4,roughness:.5});
  const cableM=mat(0x161d22,{roughness:.8}),busM=mat(0x8c9aa4,{metalness:.7,roughness:.35}),boardM=mat(0x3b4c58,{metalness:.45,roughness:.5});
  const ledG=glow(0x47e39a,.7),aiLed=glow(0x2aa8ff,1),accent=glow(0x2aa8ff,.8);
  const seg=(c,e,i)=>mat(c,{emissive:e,emissiveIntensity:i,roughness:.5});
  const segBlue=seg(0x0f5fa8,0x2aa8ff,.55),segAmber=seg(0xb86a00,0xffa31a,.55),segGreen=seg(0x1f9a3a,0x4cff6a,.45);
  const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
  const rr=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
  // Sprites: always face the camera, untouched by the sensor material swap, ignored by the home fit.
  function sprite(tex,w,h,{x=0,y=0,z=0,parent=root,depth=true}={}){
    const s=new THREE.Sprite(track(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:depth,toneMapped:false})));
    s.scale.set(w,h,1);s.position.set(x,y,z);s.userData.noFit=true;s.renderOrder=5;parent.add(s);return s;}
  // A two-line tag in the infographic's style: dark card, accent border, title + detail.
  function tagTex(lines,css){return canvasTex(768,64+lines.length*62,(g,w,h)=>{g.fillStyle='rgba(2,11,23,.9)';rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle=css;g.lineWidth=5;g.stroke();
    g.textBaseline='middle';g.textAlign='center';lines.forEach((t,i)=>{g.fillStyle=i?'#e8f4ff':css;g.font=(i?'600 46px':'800 50px')+' Arial,Helvetica,sans-serif';
      let s=i?46:50;while(g.measureText(t).width>w-60&&s>20){s-=2;g.font=(i?'600 ':'800 ')+s+'px Arial,Helvetica,sans-serif';}g.fillText(t,w/2,44+i*62);});});}
  const tag=(lines,css,width,pos)=>{const t=tagTex(lines,css);return sprite(t,width,width*t.image.height/t.image.width,{depth:false,...pos});};

  // ---- Floor: a slab on grade (no raised floor under AI racks), saw cuts, the card's title at the front edge ----
  box(6.85,.012,4.25,floorM,0,.004,0);
  for(let x=-3;x<=3.01;x+=1.2)box(.012,.004,4.2,cut,x,.012,0);for(const z of [-1.8,-.6,.6,1.8])box(6.8,.004,.012,cut,0,.012,z);
  box(6.85,.006,.03,accent,0,.012,2.1);
  props.plate('TOO HUNGRY · POWER DENSITY SHOCK',2.9,.22,{x:-1.5,y:.016,z:1.86,rx:-Math.PI/2,bg:'#06121e',fg:BLUE});

  // ---- Ten traditional racks, each with one 10 kW gauge segment on top ----
  const rowGauges=[],rowX=[];
  for(let i=0;i<N;i++){const x=X0+i*PITCH;rowX.push(x);
    box(RACK_W,RACK_H,RACK_D,rackM,x,RACK_H/2+.01,ROW_Z);
    box(RACK_W-.05,RACK_H-.12,.012,doorM,x,RACK_H/2+.01,ROW_Z+RACK_D/2+.006);
    for(let j=0;j<6;j++)box(RACK_W-.12,.05,.006,mat(0x18222a),x,.35+j*.22,ROW_Z+RACK_D/2+.014);
    const led=box(.025,1.2,.008,ledG,x+RACK_W/2-.06,.95,ROW_Z+RACK_D/2+.016);led.castShadow=false;
    const g=box(.28,SEG-.012,.28,segBlue,x,RACK_H+.01+SEG/2,ROW_Z+.15);g.userData.sensorKeep=true;rowGauges.push(g);
  }
  // Row panel (one breaker per rack) and the overhead tray its thin whips run in.
  box(PANEL.w,PANEL.h,PANEL.d,panelM,PANEL.x,PANEL.h/2+.01,PANEL.z);
  const pf=PANEL.z+PANEL.d/2;box(PANEL.w-.08,PANEL.h-.2,.01,mat(0x6f7e88,{metalness:.35,roughness:.5}),PANEL.x,PANEL.h/2+.05,pf+.005);
  for(let r=0;r<5;r++)for(let c=0;c<4;c++)box(.07,.1,.03,mat(0x1f2930),PANEL.x-.2+c*.105,.55+r*.14,pf+.02);
  props.plate('ROW PANEL',.46,.1,{x:PANEL.x,y:1.62,z:pf+.012,bg:'#0d2230',fg:'#d8f6ff'});
  // The AI rack's breaker: one more way on the same panel, sized for a 10 kW rack.
  const breaker=new THREE.Group();breaker.name='ai-breaker';root.add(breaker);
  const BRK=[PANEL.x+.13,1.27,pf+.025];
  breaker.add(box(.12,.17,.045,mat(0x2a343c),...BRK));
  const handle=box(.035,.07,.035,mat(0xe8eef0),0,0,0);const hinge=new THREE.Group();hinge.position.set(BRK[0],BRK[1],BRK[2]+.03);breaker.add(hinge);hinge.add(handle);handle.position.set(0,.03,0);
  const trayM=mat(0x55636d,{metalness:.6,roughness:.4}),trayX0=X0-.2,trayX1=PANEL.x+.05;
  box(trayX1-trayX0,.012,.3,trayM,(trayX0+trayX1)/2,TRAY_Y,ROW_Z-.1);for(const s of [-1,1])box(trayX1-trayX0,.06,.012,trayM,(trayX0+trayX1)/2,TRAY_Y+.03,ROW_Z-.1+s*.15);
  for(const x of [X0-.1,-.7,1.5])bar([x,TRAY_Y,ROW_Z-.1],[x,2.5,ROW_Z-.1],.012,steel);
  const rowFeed=[props.pulse([[PANEL.x,PANEL.h+.01,PANEL.z],[PANEL.x,TRAY_Y+.03,PANEL.z],[PANEL.x,TRAY_Y+.03,ROW_Z-.1],[X0,TRAY_Y+.03,ROW_Z-.1]],{radius:.016,speed:.5,repeat:2})];
  rowX.forEach(x=>rowFeed.push(props.pulse([[x,TRAY_Y+.02,ROW_Z-.2],[x,RACK_H+.01,ROW_Z-.2]],{radius:.012,speed:.3,repeat:1})));

  // ---- The AI rack: dense GPU sleds, blue light strips, castors; its 250 kW gauge cage on top ----
  const rack=new THREE.Group();rack.name='ai-rack';root.add(rack);
  const add=(o,parent=rack)=>{parent.add(o);return o;};
  add(box(AI.w,AI.h-.08,AI.d,aiBody,0,.08+(AI.h-.08)/2,0));
  for(const [sx,sz] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const w=add(cylinder(.035,.03,dark,sx*(AI.w/2-.08),.035,sz*(AI.d/2-.1)));w.rotation.x=Math.PI/2;}
  const front=AI.d/2;
  for(let i=0;i<9;i++){add(box(AI.w-.1,.15,.02,sled,0,.28+i*.19,front+.01));const l=add(box(AI.w-.32,.022,.01,aiLed,-.05,.28+i*.19,front+.024));l.castShadow=false;}
  for(const s of [-1,1]){const e=add(box(.03,AI.h-.2,.012,aiLed,s*(AI.w/2-.03),AI.h/2,front+.02));e.castShadow=false;}
  const aiPlate=props.plate('AI RACK',.5,.12,{parent:rack,x:0,y:AI.h-.08,z:front+.025,bg:'#06121e',fg:BLUE});aiPlate.position.set(0,AI.h-.1,front+.03);
  const G0=AI.h+.01,GZ=.22;                                  // gauge base (local), on the rack top, front half
  for(const [sx,sz] of [[-1,-1],[1,-1],[1,1],[-1,1]])add(bar([sx*.18,G0,GZ+sz*.18],[sx*.18,G0+AI_SEGS*SEG+.06,GZ+sz*.18],.012,steel));
  for(const y of [G0,G0+AI_SEGS*SEG+.06])for(const [a,b] of [[[-.18,y,GZ-.18],[.18,y,GZ-.18]],[[.18,y,GZ-.18],[.18,y,GZ+.18]],[[.18,y,GZ+.18],[-.18,y,GZ+.18]],[[-.18,y,GZ+.18],[-.18,y,GZ-.18]]])add(bar(a,b,.01,steel));
  const aiSegs=[];for(let i=0;i<AI_SEGS;i++){const s=add(box(.28,SEG-.012,.28,segBlue,0,G0+SEG/2+i*SEG,GZ));s.userData.sensorKeep=true;aiSegs.push(s);}
  // The whole row's design line: 10 racks x 10 kW, on the same scale.
  const LINE_Y=G0+10*SEG;const line=new THREE.Group();rack.add(line);
  for(const [a,b] of [[[-.22,LINE_Y,GZ-.22],[.22,LINE_Y,GZ-.22]],[[.22,LINE_Y,GZ-.22],[.22,LINE_Y,GZ+.22]],[[.22,LINE_Y,GZ+.22],[-.22,LINE_Y,GZ+.22]],[[-.22,LINE_Y,GZ+.22],[-.22,LINE_Y,GZ-.22]]]){const o=bar(a,b,.014,glow(0xffffff,.8));o.userData.sensorKeep=true;line.add(o);}
  const lineTag=tag(['WHOLE ROW DESIGN','10 racks × 10 kW'],'#ffffff',.95,{parent:rack,x:-.78,y:LINE_Y,z:GZ});
  const aiTag=tag(['MODERN AI RACK','100–250+ kW in one rack'],BLUE,1.35,{parent:rack,x:-.95,y:G0+AI_SEGS*SEG-.15,z:GZ});
  // Readout that rides the top of the lit column: cached textures, one per value/state.
  const readTex=new Map();
  const readout=sprite(null,.62,.24,{parent:rack,x:.52,y:G0,z:GZ,depth:false});
  function setReadout(text,css){const key=text+css;if(!readTex.has(key))readTex.set(key,canvasTex(320,124,(g,w,h)=>{g.fillStyle='rgba(2,11,23,.92)';rr(g,4,4,w-8,h-8,16);g.fill();g.strokeStyle=css;g.lineWidth=5;g.stroke();
    g.fillStyle=css;g.textAlign='center';g.textBaseline='middle';let s=66;g.font=`800 ${s}px Arial,Helvetica,sans-serif`;while(g.measureText(text).width>w-40){s-=2;g.font=`800 ${s}px Arial,Helvetica,sans-serif`;}g.fillText(text,w/2,h/2+3);}));
    const m=readout.material;if(m.map!==readTex.get(key)){m.map=readTex.get(key);m.needsUpdate=true;}}

  // ---- The old feed to the AI rack: one more thin whip from the row panel, the same size as the others ----
  const WHIP=[[BRK[0],BRK[1]+.03,BRK[2]+.02],[BRK[0],BRK[1]+.03,pf+.14],[BRK[0],2.3,pf+.14],[AI.x-.15,2.3,pf+.14],[AI.x-.15,2.3,AI.z1-.42],[AI.x-.15,AI.h+.02,AI.z1-.42]];
  const whip=props.pulse(WHIP,{radius:.018,speed:.6,repeat:2});
  // In the power view the whip itself is the finding: a target tube over the cable, red when the overlay is.
  const whipHot=mesh(track(new THREE.TubeGeometry((()=>{const p=new THREE.CurvePath();for(let i=1;i<WHIP.length;i++)p.add(new THREE.LineCurve3(new THREE.Vector3(...WHIP[i-1]),new THREE.Vector3(...WHIP[i])));return p;})(),96,.026,8,false)),cableM);
  whipHot.castShadow=false;whipHot.name='whip-hot';
  const feedTarget=new THREE.Group();feedTarget.name='old-feed';root.add(feedTarget);feedTarget.add(whipHot);
  const radial=(stops)=>canvasTex(64,64,(g,w)=>{const r=g.createRadialGradient(32,32,1,32,32,32);stops.forEach(([o,c])=>r.addColorStop(o,c));g.fillStyle=r;g.fillRect(0,0,w,w);});
  const hotTex=radial([[0,'rgba(255,190,140,1)'],[.3,'rgba(255,80,50,.75)'],[1,'rgba(255,40,30,0)']]);
  const hotGlow=[.15,.35,.55,.75,.92].map(u=>{const path=new THREE.CurvePath();for(let i=1;i<WHIP.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...WHIP[i-1]),new THREE.Vector3(...WHIP[i])));
    const s=new THREE.Sprite(track(new THREE.SpriteMaterial({map:hotTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})));s.position.copy(path.getPointAt(u));s.scale.set(.42,.42,1);s.userData.noFit=true;root.add(s);return s;});
  const spark=new THREE.Sprite(track(new THREE.SpriteMaterial({map:radial([[0,'rgba(255,255,230,1)'],[.25,'rgba(255,200,90,.9)'],[1,'rgba(255,120,30,0)']]),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})));
  spark.position.set(BRK[0],BRK[1],BRK[2]+.08);spark.userData.noFit=true;root.add(spark);
  // Subject / overlay zone: breaker, whip and the rack's intake (invisible).
  const zone=new THREE.Group();zone.name='feed-zone';root.add(zone);
  const zx0=PANEL.x-.05,zx1=AI.x+.05,zy0=1.12,zy1=2.42,zz0=pf-.05,zz1=AI.z1-.3;
  const zm=mesh(track(new THREE.BoxGeometry(zx1-zx0,zy1-zy0,zz1-zz0)),mat(0xffffff),(zx0+zx1)/2,(zy0+zy1)/2,(zz0+zz1)/2);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);

  // ---- AI ready: a new high-capacity feed and a fat overhead busway with a tap-off to the AI rack ----
  const board=new THREE.Group();board.name='hc-feed';board.position.set(BOARD.x,0,BOARD.z);root.add(board);
  add(box(BOARD.w,BOARD.h,BOARD.d,boardM,0,BOARD.h/2,0),board);
  add(box(BOARD.w-.08,BOARD.h-.25,.012,mat(0x4d606d,{metalness:.4,roughness:.5}),0,BOARD.h/2,BOARD.d/2+.006),board);
  for(let i=0;i<3;i++)add(box(.16,.24,.04,mat(0x1c252c),-.17+i*.17,1.25,BOARD.d/2+.02),board);
  const bStrip=add(box(BOARD.w-.1,.03,.012,accent,0,1.72,BOARD.d/2+.014),board);bStrip.castShadow=false;
  props.plate('HIGH-CAPACITY FEED',.52,.1,{parent:board,x:0,y:1.9,z:BOARD.d/2+.014,bg:'#06121e',fg:BLUE}).position.set(0,1.92,BOARD.d/2+.014);
  const bus=new THREE.Group();bus.name='busway';root.add(bus);
  const busSegs=[];
  const riser=add(box(.24,BUS_Y-BOARD.h+.08,.18,busM,BOARD.x,(BOARD.h+BUS_Y+.08)/2-.04,BOARD.z),bus);busSegs.push(riser);
  const runZ0=BOARD.z-.09,SEGN=6,segL=(BUS_END-runZ0)/SEGN;
  for(let i=0;i<SEGN;i++){const g=new THREE.Group();bus.add(g);busSegs.push(g);
    add(box(.26,.18,segL-.02,busM,BOARD.x,BUS_Y,runZ0+segL*(i+.5)),g);
    const c=add(box(.28,.2,.04,accent,BOARD.x,BUS_Y,runZ0+segL*i+.02),g);c.castShadow=false;}
  const tap=new THREE.Group();bus.add(tap);busSegs.push(tap);
  add(box(.24,.22,.28,boardM,BOARD.x,BUS_Y-.2,0),tap);add(box(.2,.025,.012,accent,BOARD.x,BUS_Y-.17,.145),tap).castShadow=false;
  add(bar([BOARD.x-.08,BUS_Y-.31,0],[BOARD.x-.08,AI.h+.02,0],.045,cableM),tap);
  for(const z of [-1.0,-.2])add(bar([BOARD.x,BUS_Y+.09,z],[BOARD.x,2.95,z],.012,steel),busSegs[z<-.5?2:5]);
  const busFlow=props.pulse([[BOARD.x,BOARD.h,BOARD.z+.1],[BOARD.x,BUS_Y+.1,BOARD.z+.1],[BOARD.x,BUS_Y+.1,BUS_END-.05]],{radius:.035,speed:.9,repeat:3});busFlow.cable.visible=false;
  const readyTag=tag(['AI READY · HIGH DENSITY POWER','100–250 kW+ per rack'],GREEN,1.7,{x:2.45,y:3.35,z:-1.3});

  // ---- Facilities engineer: asks the question, watches the rack arrive, signs off the new feed ----
  const person=actors.person({vest:0x2aa8ff,shirt:0x26384a,name:'facilities-engineer'});
  const P0=[-2.25,0,.75],P_PATH=[P0,[.2,0,1.55],[2.15,0,1.72]];
  const LOOK_ROW=Math.atan2(-.6-P0[0],ROW_Z-P0[2]),LOOK_AI=Math.atan2(AI.x-P0[0],AI.z1-P0[2]),FACE_RACK=Math.atan2(AI.x-P_PATH[2][0],(AI.z1-.2)-P_PATH[2][2]);
  const bubble=sprite(canvasTex(900,300,(g)=>{g.fillStyle='rgba(2,11,23,.92)';g.strokeStyle=BLUE;g.lineWidth=7;rr(g,8,8,884,220,44);g.fill();g.stroke();
    g.beginPath();g.moveTo(170,224);g.lineTo(130,292);g.lineTo(250,224);g.closePath();g.fill();g.beginPath();g.moveTo(170,228);g.lineTo(130,292);g.lineTo(250,228);g.stroke();
    g.fillStyle='#e8f4ff';g.textAlign='center';g.textBaseline='middle';g.font='700 62px Arial,Helvetica,sans-serif';g.fillText('“I have ten racks.',450,82);g.fillText('I should be good, right?”',450,160);}),1.55,.52,{x:P0[0]+.45,y:2.35,z:P0[2]});
  const signTag=tag(['✓ SIGNED OFF','Feed sized for the AI rack'],GREEN,1.15,{x:P_PATH[2][0]-.75,y:2.45,z:P_PATH[2][2]});

  function gaugeValue(t){
    if(t<T_LIVE)return 0;
    if(t<16.5)return t<T_TRIP?250*smooth(T_CLIMB[0],T_CLIMB[1],t):250*(1-smooth(T_TRIP,T_TRIP+.25,t));
    return t<T_LIVE2?0:250*smooth(T_CLIMB2[0],T_CLIMB2[1],t);
  }
  let lastT=0;
  function update(t,ctx){
    lastT=t;
    const ready=t>=16.5,live2=t>=T_LIVE2,tripped=t>=T_TRIP&&!live2;
    // AI rack: appears at the front, rolls into place, lights when connected.
    rack.visible=t>=T_IN[0];rack.position.set(AI.x,(1-smooth(T_IN[0],T_IN[1],t))*-.15,AI.z0+(AI.z1-AI.z0)*smooth(T_ROLL[0],T_ROLL[1],t));
    const powered=(t>=T_LIVE&&t<T_TRIP)||live2;
    aiLed.emissiveIntensity=powered?1.1:.04;aiLed.color.set(powered?0x2aa8ff:0x1b2731);
    // Gauges: one segment = 10 kW everywhere. Above the row's design line the AI column is amber; green once AI ready.
    const v=gaugeValue(t),lit=Math.round(v/10);
    aiSegs.forEach((s,i)=>{s.visible=i<lit;s.material=live2?segGreen:i>=10?segAmber:segBlue;});
    rowGauges.forEach(g=>{g.material=live2?segGreen:segBlue;});
    const showRead=rack.visible&&t>=T_LIVE;readout.visible=showRead;
    if(showRead){readout.position.y=G0+Math.max(1,lit)*SEG+.16;
      setReadout(tripped?'TRIPPED':Math.round(v)+' kW',tripped?RED:live2?GREEN:v>100.5?AMBER:BLUE);}
    line.visible=t>=T_CLIMB[0]&&!ready;lineTag.visible=line.visible&&!ctx.sensor;
    aiTag.visible=t>=T_CLIMB[1]-.2&&!ready&&!ctx.sensor;
    // Old feed: flows while it carries the AI rack, glows red as it overloads, trips, is pulled out for the busway.
    const whipShown=rack.visible&&t>=T_LIVE-.4&&t<T_PULL;
    whip.cable.visible=whipShown;whip.update(t,whipShown&&t>=T_LIVE&&t<T_TRIP&&!ctx.sensor);
    whipHot.visible=!!ctx.sensor;
    const heat=ctx.chapterId==='aiView'?smooth(11,13.2,t)*(t<T_TRIP?1:1-smooth(T_TRIP,T_TRIP+.6,t)):0;
    hotGlow.forEach((s,i)=>{s.material.opacity=heat*(.55+.3*Math.sin(t*7+i*1.3));s.visible=heat>0;});
    const sp=smooth(T_TRIP-.05,T_TRIP+.05,t)*(1-smooth(T_TRIP+.15,T_TRIP+.7,t));spark.material.opacity=sp;spark.visible=sp>0;spark.scale.setScalar(.3+.5*sp);
    hinge.rotation.x=live2?.55:.55-1.45*smooth(T_TRIP,T_TRIP+.12,t);
    rowFeed.forEach(p=>p.update(t,!ctx.sensor));
    // AI ready: the high-capacity feed rises, the busway assembles toward the rack, power flows.
    const b=smooth(T_BOARD[0],T_BOARD[1],t);board.visible=b>0;board.scale.set(1,Math.max(.001,b),1);
    busSegs.forEach((s,i)=>{const at=T_BUS[0]+(T_BUS[1]-T_BUS[0])*i/(busSegs.length-1);s.visible=t>=at;});
    busFlow.update(t,live2);
    readyTag.visible=t>=T_CLIMB2[1]-.3;
    // Engineer.
    bubble.visible=t>=.3&&t<9.4;
    if(t<P_T0){person.group.position.set(...P0);
      const h=LOOK_ROW+(LOOK_AI-LOOK_ROW)*smooth(6.2,7.2,t);person.group.rotation.y=h;
      person.pose({weight:0,look:.05-.25*smooth(8,9.6,t)*(1-smooth(12,13,t)),lean:0,point:0});}
    else{const f=actors.followPath(person.group,P_PATH,P_T0,P_T1,t);
      if(f.done){const turn=smooth(P_T1,P_T1+.7,t);person.group.rotation.y=f.heading+Math.atan2(Math.sin(FACE_RACK-f.heading),Math.cos(FACE_RACK-f.heading))*turn;}
      const pt=f.done?smooth(P_T1+.5,P_T1+1.2,t)*(1-smooth(24.4,25,t)):0;
      person.pose({distance:f.distance,weight:f.moving?f.weight:0,look:-.3*pt,lean:0,point:pt,pointPitch:2.1});}
    signTag.visible=t>=T_SIGN;
  }
  return{anchors:{feed:zone,aiRack:rack,busway:bus},
    sensors:{'power-view':{camera:(()=>{const c=new THREE.PerspectiveCamera(36,1,.05,40);c.position.set(.55,2.75,2.55);c.lookAt(2.25,1.7,-.55);c.userData.portraitWidth=1.3;return c;})(),mode:'mask',targets:[feedTarget,breaker],label:'Power view'}},
    update,
    metrics:()=>({gauge:Math.round(gaugeValue(lastT)),aiRackZ:rack.position.z,busSegments:busSegs.filter(s=>s.visible).length,person:person.group.position.toArray()})};
}
