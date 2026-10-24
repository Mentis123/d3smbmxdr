// L2 "The agent fills it in, you press send" (GPU: browser computer use). A person at a desk with a long expense claim
// open in the browser (fictional Meridian Technologies portal, ten fields) and a small pile of paper receipts. They type
// one line to the browser agent ("Fill this claim from my receipts"; the receipts are photos already on the laptop).
// On the chip: the GPU reads the page (a box on each field it finds, numbered), then fills the fields one by one; the
// die pulses with each field; Wi-Fi shows offline. You decide: the agent stops at Submit and asks; the person checks two
// amounts and presses Submit; the page shows Submitted. Variation 'login': a sign-in box appears and the agent stops.
// Everything is a pure function of t (and the variation). The screen canvas is redrawn only when its state key changes.
import {buildLaptop,buildDesk,seatedPerson,chipView,deskOn} from '../rigs/laptop.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const S=4,ROOM_Z=-.5;                                   // the desk diorama is built in metres and scaled 4x
// Timeline (seconds). Chapters: scene 0, change 4, aiView 10, review 16.5.
const T_TYPE=[5.9,8.3],T_SEND=8.5,T_REPLY=8.9;
const BOX0=11.0,BOX_DT=.15,FILL0=12.9,FILL_DT=.32,T_DONE=FILL0+FILL_DT*9+.25;   // fields fill 12.9 .. 15.8
const T_STOP=17.2,T_CHECK1=18.7,T_CHECK2=19.8,T_CLICK=21.0,T_SUBMITTED=21.3;
// The person's cursor (moved on the touchpad): to the hotel amount, the total, then Submit. [time, x, y] in page pixels.
const CURSOR=[[17.7,560,430],[18.4,700,318],[19.2,700,318],[19.6,700,594],[20.3,700,594],[20.9,720,682]];
const V_FILLED=3,T_LOGIN=14.0,T_PW=[18.6,20.2],T_SIGNED=21.0;                     // variation: sign-in wall
const PROMPT='Fill this claim from my receipts';

// ---- The page (canvas 1152 x 768; the taskbar takes the bottom 50 px) ----
const CW=1152,CH=768,PANE=836;
const FIELDS=[
  ['Claim title','Brisbane client visit'],['Dates','14–16 Oct 2026'],['Cost centre','CC-410 · Sales'],['Project code','MER-2291'],['Receipts','4 photos attached'],
  ['Flights','$412.60'],['Hotel','$538.00'],['Taxis','$86.40'],['Meals','$121.75'],['Total (AUD)','$1,158.75'],
];
const CHECK=[6,9];                                      // the two amounts the person checks
const fieldRect=i=>{const c=i<5?0:1,r=i%5;return{x:24+c*400,y:172+r*92,w:376,h:48,ly:172+r*92+13,by:172+r*92+31};};
const SUBMIT={x:600,y:654,w:204,h:52};
const FONT='"Segoe UI",Arial,Helvetica,sans-serif';
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function wrap(g,text,max){const out=[];let line='';for(const w of text.split(' ')){const t=line?line+' '+w:w;if(g.measureText(t).width>max&&line){out.push(line);line=w;}else line=t;}if(line)out.push(line);return out;}

function cursorAt(t){let i=0;while(i<CURSOR.length-1&&t>=CURSOR[i+1][0])i++;const a=CURSOR[i],b=CURSOR[Math.min(i+1,CURSOR.length-1)];
  const u=b===a?0:smooth(a[0],b[0],t);return[Math.round(a[1]+(b[1]-a[1])*u),Math.round(a[2]+(b[2]-a[2])*u)];}
// The screen state at time t: small integers and flags, so it can be compared as a key.
function screenState(t,v){
  const s={typed:0,sent:t>=T_SEND,boxes:0,filled:0,hot:-1,stop:false,checked:0,cursor:null,clicked:false,submitted:false,login:0,pw:0,signed:false,agent:[]};
  s.typed=t<T_TYPE[0]?0:Math.min(PROMPT.length,Math.floor((t-T_TYPE[0])/(T_TYPE[1]-T_TYPE[0])*PROMPT.length));
  if(t>=T_SEND)s.typed=0;
  const view=t>=BOX0-.01&&t<16.5;                      // the agent's view of the page: boxes, only during On the chip
  if(view)s.boxes=Math.min(11,1+Math.floor((t-BOX0)/BOX_DT));
  const maxFill=v?V_FILLED:10;
  if(t>=FILL0)s.filled=Math.min(maxFill,1+Math.floor((t-FILL0)/FILL_DT));
  if(s.filled&&t<FILL0+FILL_DT*(s.filled-1)+.3)s.hot=s.filled-1;
  if(s.sent)s.agent.push(['you',PROMPT]);
  if(t>=T_REPLY)s.agent.push(['agent','Reading the page…']);
  if(t>=BOX0+1)s.agent.push(['agent','I can see 10 fields and a Submit button.']);
  if(v){
    if(t>=T_LOGIN)s.login=1,s.agent.push(['stop','Sign-in needed · I have stopped. Please sign in yourself.']);
    if(t>=T_PW[0])s.pw=Math.min(10,Math.floor((t-T_PW[0])/(T_PW[1]-T_PW[0])*10)+1);
    if(t>=T_SIGNED)s.signed=true,s.agent.push(['you-ok','Signed in by you. I can carry on.']);
  }else{
    if(t>=FILL0&&t<T_DONE)s.agent.push(['agent',`Filling from your receipts · ${s.filled} of 10`]);
    if(t>=T_DONE)s.agent.push(['agent','All 10 fields filled from 4 receipts.']);
    if(t>=T_STOP)s.stop=true,s.agent.push(['stop','Ready to submit · please check. I will not press Submit.']);
    s.checked=t>=T_CHECK2?2:t>=T_CHECK1?1:0;
    if(t>=CURSOR[0][0]&&t<T_SUBMITTED+.6)s.cursor=cursorAt(Math.floor(t*10)/10);
    s.clicked=t>=T_CLICK&&t<T_SUBMITTED;s.submitted=t>=T_SUBMITTED;
    if(s.submitted)s.agent.push(['you-ok','Submitted by you.']);
  }
  s.agent=s.agent.slice(-3);
  return s;
}

function paintPage(g,w,h,s){
  // Browser chrome.
  g.fillStyle='#dfe3ea';g.fillRect(0,0,w,56);
  rr(g,16,8,250,40,10);g.fillStyle='#f7f8fa';g.fill();g.fillStyle='#27303c';g.font=`600 20px ${FONT}`;g.textBaseline='middle';g.textAlign='left';g.fillText('Meridian · Expenses',52,28);
  g.fillStyle='#1f5fbf';g.fillRect(28,20,14,14);
  rr(g,290,10,500,36,18);g.fillStyle='#ffffff';g.fill();g.fillStyle='#4b5563';g.font=`500 19px ${FONT}`;g.fillText('expenses.meridian.example/claims/new',312,28);
  // Portal header.
  g.fillStyle='#14305a';g.fillRect(0,56,PANE,60);
  g.fillStyle='#ffffff';g.font=`700 26px ${FONT}`;g.fillText('Meridian Technologies',70,86);
  g.fillStyle='#4fb3ff';g.beginPath();g.moveTo(26,100);g.lineTo(40,72);g.lineTo(54,100);g.closePath();g.fill();
  g.fillStyle='#b9cbe6';g.font=`500 20px ${FONT}`;g.textAlign='right';g.fillText('Expenses  ·  New claim',PANE-24,86);g.textAlign='left';
  // Form.
  g.fillStyle='#ffffff';g.fillRect(0,116,PANE,h-116);
  if(s.submitted){rr(g,20,124,PANE-40,40,8);g.fillStyle='#dff6e4';g.fill();g.fillStyle='#17803a';g.font=`700 26px ${FONT}`;g.fillText('✓  Claim submitted for approval',36,145);}
  else{g.fillStyle='#111827';g.font=`700 30px ${FONT}`;g.fillText('New expense claim',24,146);}
  FIELDS.forEach(([label,value],i)=>{
    const r=fieldRect(i),filled=i<s.filled,check=CHECK.indexOf(i),checked=check>=0&&check<s.checked,ask=check>=0&&s.stop&&!checked&&!s.submitted;
    g.fillStyle='#4b5563';g.font=`600 20px ${FONT}`;g.fillText(label,r.x+2,r.ly);
    rr(g,r.x,r.by,r.w,r.h,8);g.fillStyle=i===s.hot?'#e6f9e9':filled?'#f8fafc':'#ffffff';g.fill();
    g.lineWidth=checked?4:ask?4:2;g.strokeStyle=checked?'#1f6fe0':ask?'#f0a020':'#c3cad4';g.stroke();
    if(filled){g.fillStyle='#0f172a';g.font=`700 27px ${FONT}`;g.fillText(value,r.x+14,r.by+r.h/2+1);}
    if(checked){g.fillStyle='#1f6fe0';g.font=`700 20px ${FONT}`;g.textAlign='right';g.fillText('✓ checked',r.x+r.w-12,r.by+r.h/2+1);g.textAlign='left';}
  });
  // Submit and the agent's stop prompt beside it.
  rr(g,SUBMIT.x,SUBMIT.y,SUBMIT.w,SUBMIT.h,10);g.fillStyle=s.submitted?'#1e9e4a':s.clicked?'#0d3f8f':'#1f5fbf';g.fill();
  if(s.stop&&!s.submitted){g.lineWidth=5;g.strokeStyle='#f0a020';g.stroke();}
  g.fillStyle='#ffffff';g.font=`700 24px ${FONT}`;g.textAlign='center';g.fillText(s.submitted?'Submitted ✓':'Submit claim',SUBMIT.x+SUBMIT.w/2,SUBMIT.y+SUBMIT.h/2+1);g.textAlign='left';
  if(s.stop&&!s.submitted){rr(g,24,SUBMIT.y,556,SUBMIT.h,26);g.fillStyle='#fff3d6';g.fill();g.lineWidth=3;g.strokeStyle='#f0a020';g.stroke();
    g.fillStyle='#8a5200';g.font=`700 25px ${FONT}`;g.fillText('Agent: Ready to submit · please check',46,SUBMIT.y+SUBMIT.h/2+1);}
  // The agent's view: a numbered box on each element it found (fields, then Submit).
  for(let i=0;i<s.boxes;i++){
    const r=i<10?fieldRect(i):{x:SUBMIT.x,by:SUBMIT.y,w:SUBMIT.w,h:SUBMIT.h};
    g.lineWidth=4;g.strokeStyle='#18b04a';g.strokeRect(r.x-5,r.by-5,r.w+10,r.h+10);
    rr(g,r.x+r.w-30,r.by-17,40,26,6);g.fillStyle='#18b04a';g.fill();g.fillStyle='#ffffff';g.font=`700 18px ${FONT}`;g.textAlign='center';g.fillText(String(i+1),r.x+r.w-10,r.by-3);g.textAlign='left';
  }
  // Login wall (variation).
  if(s.login){
    g.fillStyle='rgba(15,23,42,.55)';g.fillRect(0,56,PANE,h-56);
    const mx=150,my=200,mw=536,mh=400;rr(g,mx,my,mw,mh,16);g.fillStyle='#ffffff';g.fill();
    g.fillStyle='#14305a';g.font=`700 30px ${FONT}`;g.fillText('Meridian ID',mx+36,my+50);
    g.fillStyle='#374151';g.font=`600 23px ${FONT}`;g.fillText('Sign in to continue',mx+36,my+92);
    rr(g,mx+36,my+120,mw-72,50,8);g.fillStyle='#f8fafc';g.fill();g.strokeStyle='#c3cad4';g.lineWidth=2;g.stroke();g.fillStyle='#111827';g.font=`600 22px ${FONT}`;g.fillText('you@meridian.example',mx+52,my+146);
    rr(g,mx+36,my+186,mw-72,50,8);g.fillStyle='#f8fafc';g.fill();g.stroke();g.fillStyle=s.pw?'#111827':'#9ca3af';g.font=`600 22px ${FONT}`;g.fillText(s.pw?'•'.repeat(s.pw):'Password',mx+52,my+212);
    g.strokeStyle='#6b7280';g.lineWidth=2;g.strokeRect(mx+36,my+258,26,26);g.fillStyle='#374151';g.font=`600 21px ${FONT}`;g.fillText('Verify it’s you',mx+76,my+272);
    rr(g,mx+36,my+310,mw-72,56,10);g.fillStyle=s.signed?'#1e9e4a':'#1f5fbf';g.fill();g.fillStyle='#ffffff';g.font=`700 24px ${FONT}`;g.textAlign='center';g.fillText(s.signed?'Signed in ✓':'Sign in',mx+mw/2,my+339);g.textAlign='left';
    if(s.boxes){g.setLineDash([14,10]);g.lineWidth=5;g.strokeStyle='#f0a020';g.strokeRect(mx-10,my-10,mw+20,mh+20);g.setLineDash([]);
      rr(g,mx-10,my-48,250,34,8);g.fillStyle='#f0a020';g.fill();g.fillStyle='#ffffff';g.font=`700 20px ${FONT}`;g.fillText('Needs a person · stop',mx+2,my-30);}
  }
  // Cursor (the person's), moving to Submit and clicking.
  if(s.cursor){const [x,y]=s.cursor;
    g.beginPath();g.moveTo(x,y);g.lineTo(x,y+34);g.lineTo(x+9,y+26);g.lineTo(x+17,y+42);g.lineTo(x+23,y+39);g.lineTo(x+15,y+23);g.lineTo(x+26,y+23);g.closePath();
    g.fillStyle='#ffffff';g.fill();g.lineWidth=2.5;g.strokeStyle='#111111';g.stroke();
    if(s.clicked){g.beginPath();g.arc(x,y,22,0,Math.PI*2);g.lineWidth=3;g.strokeStyle='rgba(31,95,191,.8)';g.stroke();}}
  paintAgent(g,w,h,s);
}

function paintAgent(g,w,h,s){
  const x0=PANE,pw=w-PANE;
  g.fillStyle='#f3f1fb';g.fillRect(x0,56,pw,h-56);g.fillStyle='#d9d4ee';g.fillRect(x0,56,2,h-56);
  g.fillStyle='#3b2a8c';g.font=`700 27px ${FONT}`;g.textBaseline='middle';g.fillText('✦ Agent',x0+20,92);
  rr(g,x0+150,76,148,32,16);g.fillStyle='#e3dcfa';g.fill();g.fillStyle='#4c3aa8';g.font=`600 17px ${FONT}`;g.fillText('On this laptop',x0+164,92);
  g.fillStyle='#4b5563';g.font=`600 19px ${FONT}`;g.fillText('Receipts · 4 photos',x0+20,138);
  for(let i=0;i<4;i++){const rx=x0+20+i*72,ry=154;g.fillStyle='#ffffff';g.fillRect(rx,ry,56,72);g.strokeStyle='#c9cdd6';g.lineWidth=1.5;g.strokeRect(rx,ry,56,72);
    g.fillStyle='#9aa3b2';for(let l=0;l<6;l++)g.fillRect(rx+8,ry+10+l*9,l%3===2?26:40,3);g.fillStyle='#4b5563';g.fillRect(rx+26,ry+60,22,4);}
  // Messages, newest at the bottom, above the input box.
  let y=626;
  for(const [who,text] of [...s.agent].reverse()){
    g.font=`600 21px ${FONT}`;const lines=wrap(g,text,pw-64),bh=lines.length*27+20,you=who==='you'||who==='you-ok';
    y-=bh;if(y<238)break;
    const bx=you?x0+40:x0+16,bw=pw-56;rr(g,bx,y,bw,bh,14);
    g.fillStyle=who==='stop'?'#fff3d6':who==='you-ok'?'#dff6e4':you?'#3b2a8c':'#ffffff';g.fill();
    if(who==='stop'){g.lineWidth=3;g.strokeStyle='#f0a020';g.stroke();}else if(!you){g.lineWidth=1.5;g.strokeStyle='#d9d4ee';g.stroke();}
    g.fillStyle=who==='you'?'#ffffff':who==='stop'?'#8a5200':who==='you-ok'?'#17803a':'#1f2937';
    lines.forEach((l,i)=>g.fillText(l,bx+14,y+23+i*27));
    y-=12;
  }
  // Input box.
  rr(g,x0+14,642,pw-28,66,14);g.fillStyle='#ffffff';g.fill();g.lineWidth=s.typed?3:2;g.strokeStyle=s.typed?'#5b45d6':'#c9c3e6';g.stroke();
  g.font=`600 21px ${FONT}`;
  if(s.typed){const lines=wrap(g,PROMPT.slice(0,s.typed)+'|',pw-60);g.fillStyle='#111827';lines.slice(-2).forEach((l,i,a)=>g.fillText(l,x0+28,675+(i-(a.length-1)/2)*25));}
  else{g.fillStyle='#9ca3af';g.fillText('Ask the agent…',x0+28,675);}
}

// ---- Receipts on the desk: four paper slips, a little crumpled, in a loose pile ----
function receiptTexture(k,i){
  const {THREE,track}=k;const c=document.createElement('canvas');c.width=200;c.height=420;const g=c.getContext('2d');
  g.fillStyle='#fbfaf6';g.fillRect(0,0,200,420);g.fillStyle='#2b2b2b';g.textAlign='center';g.font='700 26px Arial,Helvetica,sans-serif';
  g.fillText(['SKYLINE AIR','RIVERSIDE','CITY CABS','HARBOUR CAFE'][i],100,44);
  g.fillStyle='#8a8a8a';for(let l=0;l<11;l++){g.fillRect(22,80+l*24,l%4===3?90:150,7);g.fillRect(150,80+l*24,28,7);}
  g.fillStyle='#2b2b2b';g.fillRect(22,360,156,4);g.fillRect(110,380,68,12);
  const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

export function buildKit(k){
  const {THREE,root,mat,track}=k;
  const room=new THREE.Group();room.name='agent-room';room.position.set(0,0,ROOM_Z);room.scale.setScalar(S);root.add(room);
  const desk=buildDesk(k,{parent:room,z:-.1,width:1.4,depth:.62,phone:false});
  const LZ=-.1+.08;
  const laptop=buildLaptop(k,{parent:room,x:0,y:desk.top,z:LZ,finish:'nightfall',lidAngle:112});
  room.updateMatrixWorld(true);
  const keyboard=deskOn(desk,laptop,'keyboard'),screenPoint=deskOn(desk,laptop,'screen'),touchpad=deskOn(desk,laptop,'touchpad');
  const sitter=seatedPerson(k,{parent:room,x:0,z:LZ+.43,ry:Math.PI,keyboard,screen:screenPoint,touchpad,shirt:0xd9d2c4,jacket:0x3b5a7a,pants:0x2e323b,hair:0x2f2219,skin:0xc99272,name:'agent-person'});

  // Receipts pile, right of the laptop.
  const pile=new THREE.Group();pile.name='receipts';pile.position.set(.34,desk.top,LZ+.1);room.add(pile);
  [[0,0,.25],[.03,-.02,-.2],[-.025,.03,.55],[.01,.01,-.05]].forEach(([dx,dz,r],i)=>{
    const m=k.mesh(track(new THREE.PlaneGeometry(.07,.147,1,4)),mat(0xffffff,{map:receiptTexture(k,i),roughness:.9,side:THREE.DoubleSide}));
    const p=m.geometry.attributes.position;for(let j=0;j<p.count;j++)p.setZ(j,.004*Math.sin(p.getY(j)*40+i));p.needsUpdate=true;m.geometry.computeVertexNormals();
    m.rotation.set(-Math.PI/2,0,r);m.position.set(dx,.002+i*.0016,dz);m.castShadow=false;pile.add(m);});

  // Anchors: the GPU zone (package and its plate, for the overlay box) and the screen.
  const gpuZone=new THREE.Group();gpuZone.name='gpu-zone';gpuZone.userData.noFit=true;laptop.board.add(gpuZone);
  const gp=laptop.chips.gpu.position;gpuZone.position.set(gp.x,0,gp.z);
  const zoneBox=new THREE.Mesh(track(new THREE.BoxGeometry(.075,.03,.07)),track(new THREE.MeshBasicMaterial()));zoneBox.position.set(0,.015,.004);zoneBox.visible=false;gpuZone.add(zoneBox);

  // Data path in laptop metres: up from the lower bezel (the page), down the hinge, into the GPU and back.
  laptop.lid.updateMatrix();
  const lidP=(x,y)=>new THREE.Vector3(x,y,.003).applyMatrix4(laptop.lid.matrix).toArray();
  const hz=-laptop.size.D/2+.012,gy=gp.y+.003,H=laptop.size.H;
  const path=[lidP(-.05,.03),lidP(-.05,.004),[-.05,H*.6,hz],[gp.x-.008,gy,hz],[gp.x-.008,gy,gp.z],[gp.x+.008,gy,gp.z],[gp.x+.008,gy,hz],[.05,H*.6,hz],lidP(.05,.004),lidP(.05,.03)];
  const view=chipView(k,laptop,{target:'gpu',path,keep:[]});

  // Sensor: a camera in front of and above the laptop, framing the screen and the board together.
  const cam=new THREE.PerspectiveCamera(34,1,.05,40);
  const scrW=new THREE.Vector3(...screenPoint).applyMatrix4(room.matrixWorld),gpuW=laptop.chips.gpu.getWorldPosition(new THREE.Vector3());
  const aim=scrW.clone().lerp(gpuW,.38);cam.position.copy(aim).add(new THREE.Vector3(0,Math.sin(.6),Math.cos(.6)).multiplyScalar(2.6));cam.lookAt(aim);cam.userData.portraitWidth=1.05;

  // Screen: redraw only when the state key changes.
  let key='',lastT=0,lastState=null;
  const draw=s=>laptop.screen.draw((g,w,h)=>paintPage(g,w,h,s));
  const fieldTimes=[...Array(10)].map((_,i)=>FILL0+i*FILL_DT),boxTimes=[...Array(11)].map((_,i)=>BOX0+i*BOX_DT);
  const spike=(t,times,rate)=>times.reduce((m,ti)=>t>=ti?Math.max(m,Math.exp(-(t-ti)*rate)):m,0);

  function update(t,ctx){
    lastT=t;const v=!!ctx.variation,ai=ctx.chapterId==='aiView';
    const s=screenState(t,v);lastState=s;
    laptop.screen.setWifi(ai?'offline':'on',{badge:ai});
    const nk=JSON.stringify(s);if(nk!==key){key=nk;draw(s);}
    // On the chip: cutaway, the board lit, the GPU pulsing with each box and each field it fills.
    const amount=ai?smooth(10.1,11.0,t):0;
    view.set(amount,t);
    if(amount>0){const fills=v?fieldTimes.slice(0,V_FILLED):fieldTimes,busy=v?t<T_LOGIN:t<T_DONE;
      const p=Math.max(spike(t,fills,5),.55*spike(t,boxTimes,7));
      laptop.lightChip('gpu',amount*((busy?.5:.3)+.5*p),{cores:busy?.35+.65*p:.25});}
    laptop.update(t,{fans:ai&&(v?t<T_LOGIN:t<T_DONE)?.9:.35});
    // The person.
    sitter.group.visible=!ctx.sensor;
    const pose=sitter.pose;
    if(t<10){
      // The task: hands resting, a glance across at the receipts; Ask: types one line.
      if(t<4.6)pose(t,{mode:'rest',look:.3-.12*smooth(1.2,2,t)*(1-smooth(3.4,4.2,t)),turn:-.5*smooth(1.2,2,t)*(1-smooth(3.4,4.2,t)),lean:.08-.1*smooth(1.2,2,t)*(1-smooth(3.4,4.2,t))});
      else pose(t,{mode:'rest',to:'type',mix:smooth(4.8,5.7,t)});
    }else if(t<16.5)pose(t,{mode:'lap'});                                                       // hands off: the agent works
    else if(v)pose(t,{mode:'lap',to:'type',mix:smooth(17.4,18.4,t)});                          // signs in themselves
    else pose(t,{mode:'lap',to:'mouse',mix:smooth(16.9,17.7,t)});                              // checks and presses Submit
  }
  return{anchors:{gpu:gpuZone,screen:laptop.screen.mesh},
    sensors:{'chip-view':{camera:cam,mode:'normal',targets:[],label:'On the chip'}},
    update,
    dispose(){view.restore();},
    metrics:()=>({time:lastT,filled:lastState?.filled,boxes:lastState?.boxes,stop:lastState?.stop,checked:lastState?.checked,submitted:lastState?.submitted,login:lastState?.login,wifi:laptop.screen.wifi})};
}
