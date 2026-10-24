// L1 "Notes from a meeting, without the cloud" (Local AI Lab, CPU). Storyboard: docs/three-worlds/LOCAL-LAB-PLAN.md s3.
// A person at the desk joins a video call (three tiles on the laptop screen); three voices leave the laptop speakers
// as soft speech ribbons; they try to keep up writing by hand and fall behind. Ask: they click "Transcribe locally";
// the ribbons bend into the microphone and a pulse runs from the mic into the laptop. On the chip: the deck turns to
// glass, the CPU cores light in sequence, the data path runs mic -> CPU -> screen and lines of text appear in a
// notes panel. You decide: the call ends, the notes fill the screen, they fix one misheard name and send a summary.
// Variation "crosstalk": two ribbons overlap and the transcript marks that line instead of inventing words.
// The call itself needs the network, so the Wi-Fi glyph stays on; the screen's notes panel carries the
// "on this laptop" badge and the data path never leaves the laptop (WIFI_ON_CHIP flips that if the owner prefers).
// No figures: nothing here is measured. Everything is a pure function of t and ctx.
import {buildLaptop,buildDesk,seatedPerson,chipView,pointIn} from '../rigs/laptop.js';

const S=3.5,DESK_Z=-.8,LAP_Z=.1;                                   // stage scale, desk centre (world), laptop on desk (m)
const WIFI_ON_CHIP='on';                                           // 'on' (the call stays connected) or 'offline'
const VOICES=[{name:'Priya',css:'#ffb84d',hex:0xffb84d},{name:'Tom',css:'#5ad1c8',hex:0x5ad1c8},{name:'Mei',css:'#e48bf2',hex:0xe48bf2}];
// Who speaks when: [t0, t1, voice]. In the AI view each turn ends one transcript line (LINES).
const TURNS=[[1.0,2.2,0],[2.3,3.3,1],[3.4,4.6,2],[4.7,5.8,0],[5.9,7.0,1],[7.1,8.3,2],[8.4,9.5,0],[9.6,10.3,1],
  [10.4,11.1,0],[11.2,12.0,1],[12.1,12.9,2],[13.0,13.8,0],[13.9,14.7,1],[14.8,15.6,2],[15.7,16.6,0]];
const LINES=[
  {t:11.2,v:0,text:'Let’s lock the launch date for the pilot.'},
  {t:12.1,v:1,text:'Finance wants the numbers by Friday.'},
  {t:13.0,v:2,pre:'I’ll ask ',name:['Shivon','Siobhan'],post:' to pull the usage report.'},
  {t:13.9,v:0,text:'Then we go through it together on Monday.',cross:true},
  {t:14.8,v:1,text:'And the training plan goes to the team.'},
  {t:15.7,v:2,text:'I’ll draft that today.'},
];
const CROSS=[13.0,13.8];                                           // the variation: Tom talks over Priya here
const T={join:.9,write:[1.5,4.9],btn:5.0,hover:6.0,press:6.6,bend:[6.8,7.8],cloud:[7.6,9.9],ai:[10,10.9],cores:[10.6,12.2],
  end:17.0,fix:19.6,summary:21.0,send:22.8,sent:23.05};
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const lerp=(a,b,u)=>a+(b-a)*u;

export function buildKit(k){
  const {THREE,root,mesh,mat,track}=k;
  const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
  const rr=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
  const font=(g,w,s)=>{g.font=`${w} ${s}px "Segoe UI",Arial,Helvetica,sans-serif`;};
  function sprite(tex,w,h,{x=0,y=0,z=0,parent=root,depth=false}={}){
    const s=new THREE.Sprite(track(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:depth,toneMapped:false})));
    s.scale.set(w,h,1);s.position.set(x,y,z);s.userData.noFit=true;s.renderOrder=6;s.visible=false;parent.add(s);return s;}
  function tagTex(lines,css){return canvasTex(768,64+lines.length*62,(g,w,h)=>{g.fillStyle='rgba(8,14,24,.9)';rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle=css;g.lineWidth=5;g.stroke();
    g.textBaseline='middle';g.textAlign='center';lines.forEach((t,i)=>{g.fillStyle=i?'#eef4fb':css;let s=i?46:50;font(g,i?600:800,s);
      while(g.measureText(t).width>w-60&&s>20){s-=2;font(g,i?600:800,s);}g.fillText(t,w/2,44+i*62);});});}
  const tag=(lines,css,width,pos)=>{const t=tagTex(lines,css);return sprite(t,width,width*t.image.height/t.image.width,pos);};

  // ---- A warm floor over the plinth, so the desk reads as a room, not a site ----
  const floorTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#8a6a4c';g.fillRect(0,0,w,h);
    for(let i=0;i<8;i++){g.fillStyle=i%2?'rgba(255,230,190,.05)':'rgba(60,35,15,.06)';g.fillRect(0,i*h/8,w,h/8);g.fillStyle='rgba(40,25,10,.35)';g.fillRect(0,i*h/8,w,2);}
    for(let i=0;i<220;i++){g.fillStyle=`rgba(${i%2?70:200},${i%2?45:160},${i%2?20:110},.07)`;g.fillRect(Math.sin(i*91.7)*.5*w+w/2,Math.cos(i*37.1)*.5*h+h/2,40+i%60,1.5);}});
  floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(2,1.3);
  mesh(track(new THREE.BoxGeometry(6.85,.012,4.25)),mat(0xffffff,{map:floorTex,roughness:.7}),0,.006,0);
  const rug=mesh(track(new THREE.BoxGeometry(3.4,.01,2.3)),mat(0x50606e,{roughness:.95}),.15,.017,.9);rug.receiveShadow=true;
  const warm=new THREE.PointLight(0xffd7a8,14,12,1.6);warm.position.set(-2.2,5.2,1.6);root.add(warm);

  // ---- Desk, laptop, notebook, person ----
  const desk=buildDesk(k,{z:DESK_Z,scale:S,width:1.3,depth:.72,window:{offset:.03,width:1.9,height:2.0}});
  const {items}=desk,top=desk.top;
  items.notebook.position.set(.36,top,.19);items.notebook.rotation.y=-.22;
  items.pen.position.set(.5,top,.12);items.mug.position.set(-.46,top,.12);items.phone.position.set(-.27,top,.25);items.plant.position.set(.5,top,-.24);
  const laptop=buildLaptop(k,{parent:desk.group,y:top,z:LAP_Z,finish:'nightfall'});
  const at=name=>pointIn(laptop,name,root);
  const sitter=seatedPerson(k,{x:0,z:DESK_Z+(LAP_Z+.43)*S,ry:Math.PI,scale:S,keyboard:at('keyboard'),screen:at('screen'),touchpad:at('touchpad'),
    shirt:0xd9d2c4,jacket:0x34506e,pants:0x2e323b,hair:0x4a3324,name:'notes-person'});
  // An open page on the notebook: handwriting that grows, then stalls.
  const PAGE=[512,720];let pageKey='';
  const pageCanvas=document.createElement('canvas');pageCanvas.width=PAGE[0];pageCanvas.height=PAGE[1];const pg=pageCanvas.getContext('2d');
  const pageTex=track(new THREE.CanvasTexture(pageCanvas));pageTex.colorSpace=THREE.SRGBColorSpace;
  const page=mesh(track(new THREE.PlaneGeometry(.142,.2)),mat(0xffffff,{map:pageTex,roughness:.9}),0,.0136,0);page.rotation.x=-Math.PI/2;page.castShadow=false;items.notebook.add(page);
  function paintPage(n,behind){
    pg.fillStyle='#fbf8f0';pg.fillRect(0,0,PAGE[0],PAGE[1]);pg.strokeStyle='rgba(90,140,200,.35)';pg.lineWidth=2;for(let y=90;y<PAGE[1];y+=44){pg.beginPath();pg.moveTo(24,y);pg.lineTo(PAGE[0]-24,y);pg.stroke();}
    pg.strokeStyle='rgba(220,90,90,.45)';pg.beginPath();pg.moveTo(70,0);pg.lineTo(70,PAGE[1]);pg.stroke();
    pg.strokeStyle='#1d2c4a';pg.lineWidth=3.2;pg.lineCap='round';
    for(let i=0;i<n;i++){const row=Math.floor(i/3),col=i%3,y=82+row*44,x0=84+col*130;if(y>PAGE[1]-30)break;
      pg.beginPath();for(let s=0;s<=26;s++){const x=x0+s*4.4,yy=y-6-Math.abs(Math.sin(s*1.7+i))*14*(s%5?1:.4);s?pg.lineTo(x,yy):pg.moveTo(x,yy);}pg.stroke();}
    if(behind){const row=Math.floor(n/3),y=82+row*44;pg.fillStyle='#c0392b';font(pg,700,40);pg.fillText('…?',84+(n%3)*130,y);}
    pageTex.needsUpdate=true;}
  // The pen in the hand while writing; the desk pen hides.
  const handPen=new THREE.Group();sitter.hands.right.add(handPen);
  {const b=mesh(track(new THREE.CylinderGeometry(.0045,.0045,.14,10)),mat(0x1b1d22,{metalness:.5,roughness:.3}));b.position.set(0,-.04,.02);b.rotation.x=.5;handPen.add(b);}

  // ---- Speech ribbons: one per voice, from the laptop's speakers to the listener; after Ask, into the microphone ----
  const ribbons=new THREE.Group();ribbons.name='speech-ribbons';root.add(ribbons);
  const N=72,fade=canvasTex(256,8,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.15,'rgba(255,255,255,.95)');gr.addColorStop(.85,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  const v3=a=>new THREE.Vector3(...a);
  const head=v3(sitter.group.position.toArray()).add(new THREE.Vector3(0,1.16*S,-.16*S));
  const speakers=[at('keyboard'),at('screen'),at('keyboard')].map((p,i)=>v3(p).add(new THREE.Vector3([-.155*S,0,.155*S][i],i===1?-.09*S:.002*S,i===1?.01*S:-.02*S)));
  const micW=v3(at('mic'));
  const rib=VOICES.map((v,i)=>{
    const pos=new Float32Array((N+1)*2*3),uv=new Float32Array((N+1)*2*2),idx=[];
    for(let j=0;j<=N;j++){uv.set([j/N,0,j/N,1],j*4);if(j<N){const a=j*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
    const geo=track(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setIndex(idx);
    const m=track(new THREE.MeshBasicMaterial({color:v.hex,map:fade,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    const o=new THREE.Mesh(geo,m);o.frustumCulled=false;o.castShadow=o.receiveShadow=false;o.renderOrder=5;o.userData.noFit=true;o.userData.sensorKeep=true;ribbons.add(o);
    return{o,geo,pos,m,end:v3(at('keyboard')).add(new THREE.Vector3([-.34,.04,.4][i]*S,[.46,.6,.48][i]*S,[.12,.02,.1][i]*S)),phase:i*2.1};
  });
  const P=new THREE.Vector3(),Tg=new THREE.Vector3(),Nn=new THREE.Vector3(),C=new THREE.Vector3(),A0=new THREE.Vector3(),B0=new THREE.Vector3(),X=new THREE.Vector3(1,0,0);
  function bez(a,c,b,u,out){const w=1-u;return out.set(0,0,0).addScaledVector(a,w*w).addScaledVector(c,2*w*u).addScaledVector(b,u*u);}
  function drawRibbon(r,a,b,level,t,amp,lift){
    C.copy(a).lerp(b,.5);C.y+=a.distanceTo(b)*lift;
    for(let j=0;j<=N;j++){const u=j/N;bez(a,C,b,u,P);bez(a,C,b,Math.min(1,u+.01),Tg);Tg.sub(P).normalize();Nn.crossVectors(Tg,X).normalize();if(Nn.y<0)Nn.negate();
      const env=Math.pow(Math.sin(Math.PI*u),.6),wave=Math.sin(u*26-t*9+r.phase)*.7+Math.sin(u*47-t*15+r.phase*2)*.3;
      const d=amp*env*level*wave,h=(.018+.03*level)*S*env*.5;
      r.pos.set([P.x+Nn.x*(d+h),P.y+Nn.y*(d+h),P.z+Nn.z*(d+h),P.x+Nn.x*(d-h),P.y+Nn.y*(d-h),P.z+Nn.z*(d-h)],j*6);}
    r.geo.attributes.position.needsUpdate=true;}
  function level(v,t,variation){let l=0;for(const [a,b,w] of TURNS){let who=w;if(variation&&a===CROSS[0]&&v===1)who=1;if(who!==v)continue;l=Math.max(l,smooth(a-.15,a+.15,t)*(1-smooth(b-.15,b+.15,t)));}return l;}

  // ---- Mic -> laptop pulse (Ask). The chip view draws its own mic -> CPU -> screen path. ----
  const lp=laptop.point.bind(laptop),mic=lp('mic'),cpu=lp('cpu'),scr=lp('screen');
  const hinge=[mic[0],laptop.size.H+.004,-laptop.size.D/2+.012];
  const micFlow=laptop.flowPath([[mic[0],mic[1]-.002,mic[2]+.003],[mic[0],hinge[1]+.02,hinge[2]+.004],[hinge[0],hinge[1],hinge[2]+.01],[cpu[0],laptop.size.H+.002,cpu[2]]],{radius:.0024,speed:.7,repeat:3,glow:[.3,1.4,2.6]});
  const path=[[mic[0],mic[1]-.002,mic[2]+.003],[mic[0],hinge[1]+.02,hinge[2]+.004],[hinge[0],laptop.size.H+.003,hinge[2]+.01],[cpu[0],cpu[1]+.002,cpu[2]],[cpu[0]+.03,cpu[1]+.002,hinge[2]+.01],[cpu[0]+.03,hinge[1]+.03,hinge[2]+.003],[scr[0]-.02,scr[1]-.04,scr[2]+.002]];

  // ---- Overlay / subject zone: the CPU die and its package corner during the AI view, the laptop otherwise ----
  const zone=new THREE.Group();zone.name='cpu-zone';laptop.group.add(zone);
  const zm=k.mesh(track(new THREE.BoxGeometry(1,1,1)),mat(0xffffff));zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);
  const ZCPU={p:[cpu[0]-.002,cpu[1]+.013,cpu[2]+.012],s:[.05,.03,.072]};
  const ZLAP={p:[0,.11,-.06],s:[.34,.22,.24]};

  // ---- Tags (hidden in the chip view; the overlay and the screen carry it there) ----
  const lapW=v3(at('keyboard'));
  const notesTag=tag(['NOTES FALL BEHIND','Three voices, one pen'],'#ffb84d',1.5,{x:1.7,y:2.15,z:.45});
  const cloudTag=(()=>{const t=canvasTex(768,300,(g,w,h)=>{g.fillStyle='rgba(8,14,24,.9)';rr(g,4,4,w-8,h-8,22);g.fill();g.strokeStyle='#2aa8ff';g.lineWidth=5;g.stroke();
      g.save();g.translate(130,150);g.fillStyle='#9fb3c8';for(const [x,y,r] of [[-40,10,38],[0,-14,48],[44,8,36],[0,22,34]]){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
      g.strokeStyle='#ff5a4a';g.lineWidth=14;g.lineCap='round';g.beginPath();g.moveTo(-78,-62);g.lineTo(78,72);g.stroke();g.restore();
      g.textAlign='left';g.textBaseline='middle';g.fillStyle='#2aa8ff';font(g,800,54);g.fillText('NOT THE CLOUD',250,112);g.fillStyle='#eef4fb';font(g,600,40);g.fillText('Audio stays on',250,178);g.fillText('this laptop',250,226);});
    return sprite(t,1.55,1.55*300/768,{x:lapW.x-1.45,y:lapW.y+1.55,z:lapW.z-.4});})();
  const RT={x:.3,y:4.0,z:-1.3};
  const fixTag=tag(['NAME FIXED','Shivon → Siobhan'],'#5dff6a',1.0,RT);
  const sentTag=tag(['SUMMARY SENT','To the three people on the call'],'#2aa8ff',1.0,RT);
  const checkTag=tag(['CHECK THIS LINE','Two voices at once'],'#ffb02e',1.0,RT);

  // ---- The screen: desktop -> call -> call + live notes -> notes, fix, summary, sent. Redrawn on change only ----
  function avatar(g,x,y,w,h,v,talk){
    const gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,['#3a2f28','#22363a','#352a3d'][v]);gr.addColorStop(1,['#5a4636','#2f5052','#4a3a56'][v]);
    rr(g,x,y,w,h,14);g.fillStyle=gr;g.fill();
    g.save();rr(g,x,y,w,h,14);g.clip();
    g.fillStyle=['#e3b48f','#c58f6b','#f0c9a3'][v];g.beginPath();g.arc(x+w/2,y+h*.42,h*.17,0,Math.PI*2);g.fill();
    g.fillStyle=['#3b2a20','#1f1a17','#151515'][v];g.beginPath();g.arc(x+w/2,y+h*.37,h*.18,Math.PI,0);g.fill();
    g.fillStyle=['#9b5d3a','#3f6f86','#7d4a8f'][v];g.beginPath();g.ellipse(x+w/2,y+h*.98,w*.3,h*.34,0,Math.PI,0);g.fill();g.restore();
    g.fillStyle='rgba(0,0,0,.55)';rr(g,x+12,y+h-50,g.measureText(VOICES[v].name).width+70,38,10);g.fill();
    g.fillStyle='#fff';font(g,600,26);g.textAlign='left';g.textBaseline='middle';g.fillText(VOICES[v].name,x+24,y+h-31);
    if(talk){rr(g,x+2,y+2,w-4,h-4,13);g.lineWidth=7;g.strokeStyle=VOICES[v].css;g.stroke();
      g.fillStyle=VOICES[v].css;for(let i=0;i<4;i++){const bh=10+((i*7+v*3)%4)*7;g.fillRect(x+w-56+i*10,y+h-30-bh/2,6,bh);}}
  }
  function badge(g,x,y,text,css){font(g,700,24);const w=g.measureText(text).width+40;rr(g,x,y,w,40,20);g.fillStyle='rgba(10,16,26,.92)';g.fill();g.lineWidth=3;g.strokeStyle=css;g.stroke();
    g.fillStyle=css;g.textAlign='left';g.textBaseline='middle';g.fillText(text,x+20,y+21);return w;}
  function lineText(g,L,x,y,maxW,{fixed,variation,size=27,hilite=true}){
    g.textAlign='left';g.textBaseline='alphabetic';font(g,700,size);g.fillStyle=VOICES[L.v].css;g.fillText(VOICES[L.v].name,x,y);
    const nx=x+size*4.2;
    if(variation&&L.cross){font(g,700,size);const w=g.measureText('Two voices at once · check this line').width+28;rr(g,nx-12,y-size-4,w,size+16,8);g.fillStyle='rgba(255,176,46,.18)';g.fill();g.lineWidth=2.5;g.strokeStyle='#ffb02e';g.stroke();
      g.fillStyle='#ffcf7a';g.fillText('Two voices at once · check this line',nx+2,y);return;}
    font(g,500,size);g.fillStyle='#e8edf4';
    if(!L.name){g.fillText(L.text,nx,y);return;}
    g.fillText(L.pre,nx,y);let cx=nx+g.measureText(L.pre).width;const nm=L.name[fixed?1:0];font(g,700,size);const nw=g.measureText(nm).width;
    if(hilite){rr(g,cx-5,y-size-2,nw+10,size+12,6);g.fillStyle=fixed?'rgba(93,255,106,.22)':'rgba(255,176,46,.22)';g.fill();g.fillStyle=fixed?'#5dff6a':'#ffb02e';g.fillRect(cx,y+6,nw,4);g.fillStyle=fixed?'#bfffc5':'#ffd27f';}
    g.fillText(nm,cx,y);cx+=nw;font(g,500,size);g.fillStyle='#e8edf4';g.fillText(L.post,cx,y);
  }
  function paintCall(g,w,h,s){
    g.fillStyle='#161a21';g.fillRect(0,0,w,h);g.fillStyle='#1f242d';g.fillRect(0,0,w,64);
    g.fillStyle='#e8edf4';font(g,600,28);g.textAlign='left';g.textBaseline='middle';g.fillText('Weekly sync',28,33);g.fillStyle='#8f9bab';font(g,500,22);g.fillText('Project pilot · 4 people',196,34);
    g.fillStyle='#ff5a4a';g.beginPath();g.arc(w-150,33,8,0,Math.PI*2);g.fill();g.fillStyle='#d9dee6';font(g,600,22);g.fillText('Live',w-134,34);
    const panel=s.panel,cw=panel?w*.36:w-40,x0=20,y0=84,ch=h-84-150;
    if(panel){const tw=cw-10,th=(ch-16)/3;for(let v=0;v<3;v++)avatar(g,x0,y0+v*(th+8),tw,th,v,s.talk===v||(s.cross&&v===0&&s.talk===1));}
    else{const tw=(cw-2*14)/3,th=Math.min(ch,tw*1.25);for(let v=0;v<3;v++)avatar(g,x0+v*(tw+14),y0+(ch-th)/2,tw,th,v,s.talk===v);}
    // Control bar.
    const by=h-138;g.fillStyle='#1f242d';rr(g,w/2-330,by,660,74,37);g.fill();
    for(let i=0;i<3;i++){g.fillStyle=i===2?'#e5484d':'#3a4250';g.beginPath();g.arc(w/2-290+i*74,by+37,26,0,Math.PI*2);g.fill();}
    if(s.btn){const bx=w/2-62,bw=380;rr(g,bx,by+9,bw,56,28);g.fillStyle=s.btn==='on'?'#123a2a':s.btn==='hover'?'#2f86d8':'#1f6fbf';g.fill();
      if(s.btn!=='idle'){g.lineWidth=4;g.strokeStyle=s.btn==='on'?'#5dff6a':'#bfe3ff';g.stroke();}
      g.fillStyle='#fff';font(g,700,26);g.textAlign='center';g.fillText(s.btn==='on'?'● Transcribing locally':'Transcribe locally',bx+bw/2,by+38);
      if(s.btn==='hover'){g.fillStyle='#fff';g.beginPath();const px=bx+bw*.62,py=by+44;g.moveTo(px,py);g.lineTo(px,py+34);g.lineTo(px+9,py+26);g.lineTo(px+22,py+30);g.closePath();g.fill();g.strokeStyle='#000';g.lineWidth=2;g.stroke();}}
    if(panel){const px=w*.36+30,pw=w-px-20,py=84,ph=h-84-160;rr(g,px,py,pw,ph,16);g.fillStyle='#0f1520';g.fill();g.lineWidth=3;g.strokeStyle='#2aa8ff';g.stroke();
      g.fillStyle='#fff';font(g,700,30);g.textAlign='left';g.textBaseline='alphabetic';g.fillText('Live notes',px+24,py+48);
      badge(g,px+pw-250,py+18,'On this laptop','#5dd0ff');
      if(!s.lines){g.fillStyle='#8f9bab';font(g,500,26);g.fillText('Listening…',px+24,py+102);
        g.fillStyle='#2aa8ff';for(let i=0;i<22;i++){const bh=8+Math.abs(Math.sin(i*1.9))*40;g.fillRect(px+24+i*14,py+150-bh/2,8,bh);}}
      for(let i=0;i<s.lines;i++){const L=LINES[i];g.save();rr(g,px+10,py+70,pw-20,ph-80,10);g.clip();
        g.globalAlpha=i===s.lines-1?.999:1;lineText(g,L,px+20,py+108+i*56,pw-40,{fixed:false,variation:s.variation,size:23,hilite:false});g.restore();}
    }
  }
  function paintNotes(g,w,h,s){
    g.fillStyle='#10151d';g.fillRect(0,0,w,h);g.fillStyle='#1a212c';g.fillRect(0,0,w,64);
    g.fillStyle='#e8edf4';font(g,700,28);g.textAlign='left';g.textBaseline='middle';g.fillText('Weekly sync · notes',28,33);
    g.fillStyle='#8f9bab';font(g,500,22);g.fillText('Call ended',318,34);
    badge(g,w-330,12,'On this laptop','#5dd0ff');
    const lx=30,lw=s.summary?w*.56:w-60;
    for(let i=0;i<LINES.length;i++)lineText(g,LINES[i],lx,124+i*64,lw,{fixed:s.fixed,variation:s.variation,size:s.summary?25:29});
    if(s.selecting&&!s.fixed){g.fillStyle='#fff';const cx=lx+29*4.2+250,cy=124+2*64-12;g.fillRect(cx,cy-24,3,32);}
    if(s.summary){const px=w*.6,pw=w-px-24,py=88,ph=h-88-90;rr(g,px,py,pw,ph,16);g.fillStyle='#16202c';g.fill();g.lineWidth=3;g.strokeStyle='#2aa8ff';g.stroke();
      g.fillStyle='#fff';font(g,700,30);g.textAlign='left';g.textBaseline='alphabetic';g.fillText('Summary',px+24,py+50);
      const bul=['Pilot launch date to lock',s.variation?'Monday review: check the line':'Numbers to finance by Friday',(s.fixed?'Siobhan':'Shivon')+' pulls the usage report','Mei drafts the training plan'];
      font(g,500,24);g.fillStyle='#dfe6ee';bul.forEach((b,i)=>{g.fillStyle='#2aa8ff';g.fillRect(px+26,py+92+i*52,10,10);g.fillStyle='#dfe6ee';g.fillText(b,px+48,py+104+i*52);});
      const bx=px+24,by=py+ph-84,bw=pw-48;rr(g,bx,by,bw,60,30);g.fillStyle=s.sent?'#123a2a':s.press?'#2f86d8':'#1f6fbf';g.fill();if(s.sent||s.press){g.lineWidth=4;g.strokeStyle=s.sent?'#5dff6a':'#bfe3ff';g.stroke();}
      g.fillStyle='#fff';font(g,700,27);g.textAlign='center';g.fillText(s.sent?'✓ Sent to 3 people':'Send summary',bx+bw/2,by+40);}
  }
  function paintDesk(g,w,h,s){laptop.screen.desktop(g,w,h);
    rr(g,w-440,h-250,410,150,18);g.fillStyle='rgba(22,28,38,.95)';g.fill();g.fillStyle='#fff';font(g,700,28);g.textAlign='left';g.textBaseline='middle';g.fillText('Weekly sync',w-410,h-210);
    g.fillStyle='#9fb0c4';font(g,500,22);g.fillText('Starting now',w-410,h-176);rr(g,w-200,h-160,150,46,23);g.fillStyle=s.click?'#2f86d8':'#1f6fbf';g.fill();g.fillStyle='#fff';font(g,700,24);g.textAlign='center';g.fillText('Join',w-125,h-136);}
  let screenKey='';
  function drawScreen(t,variation){
    let s,fn,key;
    if(t<T.join){s={click:t>.55};key='desk'+s.click;fn=(g,w,h)=>paintDesk(g,w,h,s);}
    else if(t<T.end){
      let talk=-1;for(const [a,b,v] of TURNS)if(t>=a&&t<b)talk=v;
      const btn=t<T.btn?null:t<T.hover?'idle':t<T.press?'hover':'on';
      const lines=LINES.filter(L=>t>=L.t).length,cross=variation&&t>=CROSS[0]&&t<CROSS[1];
      s={talk,btn,panel:t>=T.press,lines,variation:!!variation,cross};key=['call',talk,btn,s.panel,lines,s.variation,cross].join('|');fn=(g,w,h)=>paintCall(g,w,h,s);}
    else{s={fixed:t>=T.fix,selecting:t>=18.4,summary:t>=T.summary,press:t>=T.send,sent:t>=T.sent,variation:!!variation};
      key=['notes',s.fixed,s.selecting,s.summary,s.press,s.sent,s.variation].join('|');fn=(g,w,h)=>paintNotes(g,w,h,s);}
    const wifi=t>=T.ai[0]&&t<16.5?WIFI_ON_CHIP:'on';key+='|'+wifi;
    if(key===screenKey)return;screenKey=key;
    laptop.screen.wifi=wifi;laptop.screen.badge=wifi!=='on';laptop.screen.draw(fn);
  }

  // ---- The chip view (built last, so it dims everything above) ----
  const view=chipView(k,laptop,{target:'cpu',keep:[ribbons]});
  const dataPath=laptop.flowPath(path,{radius:.0019,speed:.6,repeat:4,glow:[.3,1.4,2.6]});
  const sensorCam=new THREE.PerspectiveCamera(40,1,.05,40);
  {const look=new THREE.Vector3(-.014,.066,-.075),eye=new THREE.Vector3(.13,.31,.34).lerp(look,.12);laptop.group.updateWorldMatrix(true,true);
    root.updateWorldMatrix(true,false);const e=root.worldToLocal(laptop.group.localToWorld(eye)),l=root.worldToLocal(laptop.group.localToWorld(look));sensorCam.position.copy(e);sensorCam.lookAt(l);sensorCam.userData.portraitWidth=.65;}

  // ---- The person: join, write, fall behind, click Transcribe, sit back, fix the name, send ----
  const nbLocal=new THREE.Vector3(),tip=new THREE.Vector3();
  function penPoint(t){const u=(t-T.write[0])*1.1;nbLocal.set(-.035+((u*.55)%1)*.07,.016,-.05+Math.floor(u*.55)%5*.022+.01*Math.sin(t*13));
    items.notebook.updateWorldMatrix(true,false);return root.worldToLocal(items.notebook.localToWorld(tip.copy(nbLocal))).toArray();}
  const SEG=[[.0,.0,'mouse','mouse'],[.95,1.55,'mouse','write'],[4.8,5.6,'write','mouse'],[7.1,8.0,'mouse','lap'],[16.6,18.0,'lap','mouse'],[19.2,19.45,'mouse','type'],[20.0,20.5,'type','mouse'],[23.4,24.4,'mouse','rest']];
  const LOOK={mouse:.42,type:.42,rest:.3,lap:.2,write:.5};
  function posePerson(t){
    let cur=SEG[0];for(const s of SEG)if(t>=s[0])cur=s;
    const [a,b,A,B]=cur,m=b>a?smooth(a,b,t):1;
    const wW=(A==='write'?1-m:0)+(B==='write'?m:0);
    const mode=x=>x==='write'?'point':x;
    // A glance up at the screen mid-sentence: the notes are falling behind.
    const glance=smooth(2.8,3.1,t)*(1-smooth(3.5,3.8,t));
    const look=lerp(LOOK[A],LOOK[B],m)-glance*.35*wW,turn=-.16*wW*(1-glance*.8);
    sitter.pose(t,{mode:mode(A),to:mode(B),mix:m,point:penPoint(t),look,turn});
    return wW;
  }

  let last={};
  function update(t,ctx){
    const variation=ctx.variation,ai=ctx.chapterId==='aiView';
    const wW=posePerson(t);
    handPen.visible=wW>.5;items.pen.visible=!handPen.visible;
    sitter.group.visible=!ctx.sensor;
    // Handwriting: strokes keep coming while writing, but slower than the talk (three per voice turn, behind).
    const n=Math.floor(Math.max(0,Math.min(T.write[1],t)-T.write[0])*2.6),behind=t>=3.2;
    const pk=n+'|'+behind;if(pk!==pageKey){pageKey=pk;paintPage(n,behind);}
    drawScreen(t,variation);
    // Ribbons: live while the call is on; after Ask they bend into the microphone.
    const callOn=smooth(T.join,T.join+.4,t)*(1-smooth(T.end-.4,T.end,t)),bend=smooth(T.bend[0],T.bend[1],t);
    rib.forEach((r,i)=>{let l=level(i,t,variation);
      const crossNow=variation&&t>=CROSS[0]-.2&&t<CROSS[1]+.2&&i===1;
      const L=Math.max(.14,l)*callOn;r.o.visible=L>.01;if(!r.o.visible)return;
      A0.copy(speakers[i]);B0.copy(r.end).lerp(micW,bend);
      if(crossNow){A0.lerp(speakers[0],.85);}                         // Tom's ribbon lies over Priya's: two at once
      const amp=lerp(.085,.03,bend)*S*(crossNow?1.3:ai?.7:1);
      drawRibbon(r,A0,B0,L*lerp(1,.6,bend),t,amp,lerp(.3,.25,bend));r.m.opacity=(.25+.75*l)*callOn*lerp(.9,.6,bend)*(ai&&!crossNow?.55:1);});
    // Mic -> laptop pulse during Ask; the chip view's own path takes over on the chip.
    micFlow.update(t,t>=T.press+.2&&ctx.chapterId==='change');
    // On the chip.
    const amount=ai?smooth(T.ai[0],T.ai[1],t):0;
    view.set(amount,t);dataPath.update(t,amount>.5);
    if(ai){const ramp=smooth(T.cores[0],T.cores[1],t),wave=.82+.18*Math.sin(t*7);laptop.lightChip('cpu',amount*(.8+.2*Math.sin(t*5)**2),{cores:ramp*wave});}
    laptop.update(t,{fans:.25+.45*amount});
    // Zone: CPU in the AI view, the laptop elsewhere.
    const Z=ai?ZCPU:ZLAP;zm.position.set(...Z.p);zm.scale.set(...Z.s);
    // Tags.
    const off=!!ctx.sensor;
    notesTag.visible=!off&&t>=2.3&&t<5.4;
    cloudTag.visible=!off&&t>=T.cloud[0]&&t<T.cloud[1];
    fixTag.visible=!off&&!variation&&t>=T.fix+.15&&t<T.send;
    checkTag.visible=!off&&!!variation&&t>=17.6&&t<T.send;
    sentTag.visible=!off&&t>=T.sent+.1;
    last={t,amount,lines:LINES.filter(L=>t>=L.t).length,screen:screenKey,writeStrokes:n};
  }
  return{anchors:{cpu:zone,laptop:zone},
    sensors:{'chip-view':{camera:sensorCam,mode:'normal',targets:[laptop.chips.cpu],label:'On the chip'}},
    update,
    metrics:()=>({...last}),
    dispose(){view.restore();}};
}
