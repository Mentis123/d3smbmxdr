// L3 "Ask your own files, see the source" (Local AI Lab, NPU). A warm desk with the laptop rig: a folder of forty
// fictional documents (Meridian Technologies policies, Ashfield Commercial Services contracts, NovaCraft delivery
// docs, from the Agentic AI Builder workshop packs). The person scrolls filenames and a filename search finds
// nothing; they ask a local "Ask my files" box in plain words. On the chip: the deck turns to glass, the on-device
// index (a grid of forty file tiles above the SSD) is read, three tiles pulse, the NPU lights and the path runs
// SSD -> NPU -> screen; Wi-Fi is offline. The answer arrives with two citations. Review: the person opens the cited
// clause, checks the highlighted sentence and replies to the email. Variation "versions": two versions of the
// agreement match, and the answer asks which is current, showing both dates.
// The board layout is the rig's artistic licence; clause text, names and dates are fictional. Pure function of t.
import {buildLaptop,buildDesk,seatedPerson,chipView,pointIn} from '../rigs/laptop.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const S=4,GZ=-.3;                                             // rig built in metres, scaled 4x on the plinth
// Key times (seconds). The camera eases ~2 s from each chapter's start, so visible changes start a beat after it.
const T={scroll:[.6,2.5],search:[2.6,3.3],noMatch:3.45,ask:6.0,type:[6.4,8.8],enter:9.1,
  scan:[10.7,12.3],match:12.3,answer:13.2,cites:14.0,
  click:18.7,doc:19.1,mark:19.7,checked:21.3,email:22.3,reply:[22.7,24.6],sent:25.1};
const QUESTION='What payment terms did we agree with Ashfield?';
const SEARCH='payment terms';
// Forty documents, newest first. Company: M Meridian Technologies, A Ashfield Commercial Services, N NovaCraft.
const FILES=[
  ['NovaCraft · Delivery Plan Phase 2.docx','N','21/10/2026'],['Meridian · Board Paper October.pptx','M','20/10/2026'],
  ['Ashfield · Rate Card FY27.xlsx','A','17/10/2026'],['Meridian · Travel Policy.pdf','M','15/10/2026'],
  ['NovaCraft · Change Request 14.docx','N','14/10/2026'],['Meridian · Procurement Policy v4.docx','M','09/10/2026'],
  ['NovaCraft · Status Report Week 40.pdf','N','06/10/2026'],['Ashfield · Site Access Schedule.pdf','A','02/10/2026'],
  ['Meridian · Information Security Policy.pdf','M','29/09/2026'],['NovaCraft · Risk Register.xlsx','N','25/09/2026'],
  ['Meridian · Expense Policy.pdf','M','22/09/2026'],['NovaCraft · Acceptance Certificate M3.pdf','N','18/09/2026'],
  ['Ashfield · Insurance Certificate.pdf','A','12/09/2026'],['Meridian · Code of Conduct.pdf','M','08/09/2026'],
  ['NovaCraft · Test Plan Release 2.docx','N','03/09/2026'],['Meridian · Board Paper September.pptx','M','28/08/2026'],
  ['Ashfield · Monthly Service Review Aug.pptx','A','25/08/2026'],['NovaCraft · Statement of Work 02.pdf','N','19/08/2026'],
  ['Meridian · Leave Policy.pdf','M','14/08/2026'],['NovaCraft · Delivery Plan Phase 1.docx','N','07/08/2026'],
  ['Meridian · Records Retention Policy.pdf','M','31/07/2026'],['Ashfield · Cleaning Scope Floors 1-6.docx','A','24/07/2026'],
  ['NovaCraft · Handover Checklist.xlsx','N','17/07/2026'],['Meridian · AI Acceptable Use Policy.pdf','M','10/07/2026'],
  ['Ashfield · Supplier Agreement.pdf','A','03/07/2026'],['NovaCraft · Change Request 09.docx','N','26/06/2026'],
  ['Meridian · Privacy Policy.pdf','M','19/06/2026'],['NovaCraft · Lessons Learned.docx','N','12/06/2026'],
  ['Meridian · Delegations of Authority.pdf','M','05/06/2026'],['Ashfield · Purchase Order 4471.pdf','A','29/05/2026'],
  ['NovaCraft · Architecture Overview.pdf','N','22/05/2026'],['Meridian · Board Paper May.pptx','M','15/05/2026'],
  ['NovaCraft · Status Report Week 18.pdf','N','08/05/2026'],['Meridian · Business Continuity Plan.docx','M','01/05/2026'],
  ['Ashfield · Services Agreement.pdf','A','03/03/2026'],['NovaCraft · Statement of Work 01.pdf','N','20/02/2026'],
  ['Meridian · Whistleblower Policy.pdf','M','13/02/2026'],['Ashfield · Services Agreement (2025).pdf','A','12/02/2025'],
  ['NovaCraft · Kickoff Deck.pptx','N','30/01/2026'],['Meridian · Onboarding Guide.pdf','M','23/01/2026'],
];
const REPLY=['Hi Sam, we agreed 30 days from a valid invoice','(Services Agreement §7.2). Invoices must quote','our purchase order number (Supplier Agreement §4).'];
const REPLY_V=['Hi Sam, the current agreement (signed 3 Mar 2026)','says 30 days from a valid invoice, §7.2.','The 2025 version said 45 days; it is superseded.'];
const IDX={services:34,supplier:24,rate:2,servicesOld:37};
const COL={M:'#4c9dff',A:'#ffb84d',N:'#5fd68a'};
const NPU='#c24dff',INK='#1b2330',SUB='#5b6675',PAPER='#ffffff';
const FONT='"Segoe UI",Arial,Helvetica,sans-serif';

function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function text(g,s,x,y,{size=32,weight=600,color=INK,align='left',max=0}={}){
  let z=size;g.font=`${weight} ${z}px ${FONT}`;if(max)while(g.measureText(s).width>max&&z>10){z-=1;g.font=`${weight} ${z}px ${FONT}`;}
  g.fillStyle=color;g.textAlign=align;g.textBaseline='middle';g.fillText(s,x,y);return g.measureText(s).width;}
function docIcon(g,x,y,s,c){rr(g,x,y,s*.8,s,s*.12);g.fillStyle=c;g.fill();g.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<3;i++)g.fillRect(x+s*.16,y+s*(.34+i*.18),s*.48,s*.07);}
function windowFrame(g,w,h,title){
  g.fillStyle='#eef2f7';g.fillRect(0,0,w,h);g.fillStyle='#dfe6ef';g.fillRect(0,0,w,70);
  text(g,title,36,36,{size:34,weight:600,color:INK});
  g.strokeStyle='#5b6675';g.lineWidth=3;const bx=w-60;g.beginPath();g.moveTo(bx-12,24);g.lineTo(bx+12,48);g.moveTo(bx+12,24);g.lineTo(bx-12,48);g.stroke();
  g.strokeRect(w-160,26,22,22);g.beginPath();g.moveTo(w-250,37);g.lineTo(w-226,37);g.stroke();
}
function cursor(g,x,y){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+44);g.lineTo(x+12,y+33);g.lineTo(x+22,y+54);g.lineTo(x+30,y+50);g.lineTo(x+20,y+30);g.lineTo(x+36,y+30);g.closePath();
  g.fillStyle='#fff';g.fill();g.lineWidth=3;g.strokeStyle='#111';g.stroke();}

// ---- screen states. Each paints the whole screen; the rig paints the taskbar (clock, Wi-Fi) on top.
function paintExplorer(g,w,h,{scroll=0,query='',noMatch=false,dim=0}){
  windowFrame(g,w,h,'Contracts & Policies');
  g.fillStyle='#f7f9fc';g.fillRect(0,70,w,84);
  text(g,'Documents  ›  Contracts & Policies',36,112,{size:30,weight:500,color:SUB});
  const sx=w-560,sw=520;rr(g,sx,88,sw,50,10);g.fillStyle='#fff';g.fill();g.strokeStyle=query?'#2f7de1':'#c3ccd8';g.lineWidth=3;g.stroke();
  g.beginPath();g.arc(sx+30,111,10,0,Math.PI*2);g.strokeStyle=SUB;g.lineWidth=3;g.stroke();g.beginPath();g.moveTo(sx+37,118);g.lineTo(sx+46,127);g.stroke();
  text(g,query||'Search Contracts & Policies',sx+60,113,{size:28,weight:query?600:400,color:query?INK:'#8a94a3'});
  if(query&&!noMatch){const tw=g.measureText(query).width;g.fillStyle=INK;g.fillRect(sx+62+tw,96,3,34);}
  const top=170,rowH=64,bottom=h-h*.065-56;
  text(g,'Name',96,top+20,{size:26,weight:600,color:SUB});text(g,'Date modified',w-330,top+20,{size:26,weight:600,color:SUB});
  g.fillStyle='#d5dce6';g.fillRect(36,top+44,w-72,2);
  g.save();g.beginPath();g.rect(0,top+48,w,bottom-top-48);g.clip();
  if(noMatch){
    text(g,'No items match your search.',w/2,top+170,{size:44,weight:600,color:INK,align:'center'});
    text(g,'Filename search only looks at names, not what is inside.',w/2,top+240,{size:32,weight:400,color:SUB,align:'center'});
  }else{
    const off=scroll*rowH;
    FILES.forEach(([name,co,date],i)=>{const y=top+52+i*rowH-off;if(y<top-rowH||y>bottom)return;
      if(i%2)g.fillStyle='#f2f5f9',g.fillRect(36,y,w-72,rowH);
      docIcon(g,52,y+12,40,COL[co]);text(g,name,110,y+rowH/2,{size:34,weight:500,color:INK,max:w-560});text(g,date,w-330,y+rowH/2,{size:30,weight:400,color:SUB});});
    const trackH=bottom-top-60,thumb=trackH*13/40,ty=top+54+(trackH-thumb)*Math.min(1,scroll/27);
    rr(g,w-30,top+54,12,trackH,6);g.fillStyle='#e1e6ee';g.fill();rr(g,w-30,ty,12,thumb,6);g.fillStyle='#9aa6b6';g.fill();
  }
  g.restore();
  g.fillStyle='#e6ebf2';g.fillRect(0,bottom,w,56);text(g,noMatch?'0 items':'40 items',36,bottom+28,{size:28,weight:500,color:SUB});
  if(dim){g.fillStyle=`rgba(10,18,30,${.55*dim})`;g.fillRect(0,0,w,h);}
}
// The local "Ask my files" box: a card over the dimmed folder.
function paintAsk(g,w,h,s){
  paintExplorer(g,w,h,{scroll:9,dim:1});
  const cx=110,cy=96,cw=w-220,ch=h-h*.065-150;
  rr(g,cx,cy,cw,ch,28);g.fillStyle='#fbfcfe';g.fill();g.lineWidth=5;g.strokeStyle=NPU;g.stroke();
  text(g,'Ask my files',cx+48,cy+62,{size:46,weight:700,color:INK});
  const chipW=330;rr(g,cx+cw-chipW-40,cy+36,chipW,52,26);g.fillStyle='#f1e4fb';g.fill();text(g,'On this laptop',cx+cw-chipW/2-40,cy+63,{size:30,weight:600,color:'#7a2bb0',align:'center'});
  // Question box.
  const qy=cy+118;rr(g,cx+40,qy,cw-80,96,18);g.fillStyle='#fff';g.fill();g.lineWidth=3;g.strokeStyle='#b9a2cf';g.stroke();
  const q=QUESTION.slice(0,s.typed);text(g,q||'Ask a question about your files',cx+72,qy+49,{size:40,weight:q?600:400,color:q?INK:'#98a1ae',max:cw-200});
  if(s.typed<QUESTION.length&&s.caret){g.font=`600 40px ${FONT}`;const tw=q?g.measureText(q).width:0;g.fillStyle=INK;g.fillRect(cx+74+tw,qy+26,4,46);}
  const ay=qy+140;
  if(s.mode==='ask'){text(g,'Answers come from the files on this laptop, with their sources.',cx+48,ay+34,{size:32,weight:500,color:'#8a94a3',max:cw-96});}
  else if(s.mode==='searching'){
    text(g,'Searching your files on this laptop'+'.'.repeat(s.dots),cx+48,ay+30,{size:36,weight:500,color:SUB});
  }else if(s.mode==='answer'&&!s.versions){
    text(g,'Payment is due 30 days from a valid invoice.',cx+48,ay+34,{size:48,weight:700,color:INK,max:cw-96});
    text(g,'A valid invoice quotes the Meridian purchase order number.',cx+48,ay+104,{size:36,weight:500,color:'#2c3644',max:cw-96});
    if(s.cites){text(g,'Sources',cx+48,ay+178,{size:28,weight:700,color:SUB});
      const cites=[['1','Services Agreement §7.2'],['2','Supplier Agreement §4']];let x=cx+48;
      cites.forEach(([n,label],i)=>{g.font=`600 34px ${FONT}`;const bw=g.measureText(label).width+110;rr(g,x,ay+208,bw,68,34);g.fillStyle=s.hot===i?'#e7d3f7':'#f3ecfa';g.fill();g.lineWidth=s.hot===i?5:3;g.strokeStyle=NPU;g.stroke();
        g.beginPath();g.arc(x+36,ay+242,18,0,Math.PI*2);g.fillStyle=NPU;g.fill();text(g,n,x+36,ay+243,{size:24,weight:700,color:'#fff',align:'center'});
        text(g,label,x+66,ay+243,{size:34,weight:600,color:'#4a1c6e'});x+=bw+24;});}
  }else if(s.mode==='answer'){
    rr(g,cx+40,ay,cw-80,72,16);g.fillStyle='#eef0f3';g.fill();
    text(g,'Two versions found · which is current?',cx+72,ay+37,{size:42,weight:700,color:INK,max:cw-140});
    const rows=[['Services Agreement (2025)','12 Feb 2025','§7.2 · 45 days from invoice'],['Services Agreement','3 Mar 2026','§7.2 · 30 days from a valid invoice']];
    rows.forEach(([name,date,terms],i)=>{const y=ay+96+i*100;rr(g,cx+40,y,cw-80,86,16);g.fillStyle='#fff';g.fill();g.lineWidth=3;g.strokeStyle='#a4aeb6';g.setLineDash([12,8]);g.stroke();g.setLineDash([]);
      docIcon(g,cx+64,y+20,46,COL.A);text(g,name,cx+130,y+30,{size:32,weight:600,color:INK});text(g,terms,cx+130,y+64,{size:28,weight:500,color:SUB});
      text(g,date,cx+cw-72,y+44,{size:36,weight:700,color:'#2c3644',align:'right'});});
  }
  if(s.cursor)cursor(g,s.cursor[0],s.cursor[1]);
}
// The cited clause, opened from the source chip, with the sentence highlighted.
function paintDoc(g,w,h,{mark=0,checked=false,versions=false}){
  windowFrame(g,w,h,versions?'Ashfield · Services Agreement: both versions':'Ashfield · Services Agreement.pdf');
  g.fillStyle='#c9d0da';g.fillRect(0,70,w,h-70);
  const page=(x,pw,{title,date,days,current})=>{const y=96,ph=h-h*.065-130;g.fillStyle=PAPER;g.fillRect(x,y,pw,ph);g.fillStyle='rgba(0,0,0,.08)';g.fillRect(x+pw,y+8,8,ph);
    text(g,title,x+48,y+56,{size:32,weight:700,color:INK,max:versions?pw-330:pw-96});text(g,date,x+48,y+100,{size:26,weight:500,color:SUB});
    text(g,'7. Fees and payment',x+48,y+168,{size:34,weight:700,color:INK});
    text(g,'7.1 Fees. Fees are set out in the Rate Card.',x+48,y+226,{size:30,weight:400,color:'#2c3644',max:pw-96});
    const hy=y+296,lines=[`7.2 Payment. Meridian will pay each invoice`,`within ${days} from a valid invoice.`];
    if(current&&mark>0){g.fillStyle='rgba(255,224,80,.85)';g.fillRect(x+40,hy-28,(pw-80)*mark,118);}
    lines.forEach((l,i)=>text(g,l,x+48,hy+i*58,{size:36,weight:current?600:400,color:current?INK:'#7a8494',max:pw-96}));
    text(g,'7.3 Disputes. Disputed amounts are raised in writing.',x+48,hy+150,{size:30,weight:400,color:'#2c3644',max:pw-96});
    if(versions){rr(g,x+pw-260,y+30,220,52,10);g.fillStyle=current?'#e3f6e8':'#eceef1';g.fill();text(g,current?'Current':'Superseded',x+pw-150,y+57,{size:28,weight:700,color:current?'#1d7a3c':'#7a8494',align:'center'});}
  };
  if(versions){page(70,w/2-100,{title:'Services Agreement (2025)',date:'Signed 12 Feb 2025',days:'45 days',current:false});
    page(w/2+30,w/2-100,{title:'Services Agreement',date:'Signed 3 Mar 2026',days:'30 days',current:true});}
  else page(220,w-440,{title:'Services Agreement · Ashfield Commercial Services',date:'Signed 3 Mar 2026',days:'30 days',current:true});
  if(checked){const bw=470,bx=w-bw-60,by=h-h*.065-110;rr(g,bx,by,bw,76,38);g.fillStyle='#1d7a3c';g.fill();text(g,'✓  Checked against source',bx+bw/2,by+39,{size:32,weight:700,color:'#fff',align:'center'});}
}
function paintEmail(g,w,h,{typed=0,sent=false,versions=false}){
  windowFrame(g,w,h,'Mail');
  g.fillStyle='#fff';g.fillRect(60,96,w-120,h-h*.065-130);
  text(g,'Re: Ashfield invoice terms',100,150,{size:40,weight:700,color:INK});
  text(g,'To: Sam Okafor (Finance)',100,204,{size:30,weight:500,color:SUB});g.fillStyle='#e1e6ee';g.fillRect(100,236,w-200,2);
  const reply=versions?REPLY_V:REPLY;
  let left=typed;reply.forEach((l,i)=>{const s=l.slice(0,Math.max(0,left));left-=l.length;text(g,s,100,300+i*62,{size:36,weight:500,color:INK,max:w-200});});
  text(g,'> What payment terms did we agree with Ashfield?',100,520,{size:28,weight:400,color:'#8a94a3'});
  const bx=w-330,by=h-h*.065-120;rr(g,bx,by,230,72,12);g.fillStyle=sent?'#1d7a3c':'#2f7de1';g.fill();text(g,sent?'✓ Sent':'Send',bx+115,by+37,{size:34,weight:700,color:'#fff',align:'center'});
}

export function buildKit(k){
  const {THREE,root,mat,track}=k;
  // ---- Warm daylit set, like the retail store: lights, plinth timber, no cyan edge lines.
  const scene=root.parent;
  if(scene){scene.background=new THREE.Color(0x2a221c);if(scene.fog){scene.fog.color.set(0x2a221c);scene.fog.near=22;scene.fog.far=46;}
    scene.traverse(o=>{if(o.isHemisphereLight){o.color.set(0xfff2df);o.groundColor.set(0x8b7a66);o.intensity=2.4;}
      else if(o.isDirectionalLight&&o.castShadow){o.color.set(0xfff0d9);o.intensity=3.0;o.position.set(-4,11,6);Object.assign(o.shadow.camera,{left:-7,right:7,top:8,bottom:-6,far:30});o.shadow.camera.updateProjectionMatrix();}
      else if(o.isDirectionalLight){o.color.set(0xffd2a1);o.intensity=1.0;}});
    const fill=new THREE.DirectionalLight(0xfff6ea,.9);fill.position.set(3,6,7);scene.add(fill);}
  for(const o of [...root.children]){if(!o.isMesh)continue;if(o.material===k.cyan)o.visible=false;else if(o.geometry?.parameters?.width===7&&o.geometry.parameters.height===.3)o.material=mat(0x3b2b20,{roughness:.7,metalness:.05});}
  k.concrete.color.set(0xcdbfae);

  // ---- Desk, laptop and person, built in metres and scaled together.
  const G=new THREE.Group();G.name='files-set';G.position.set(0,0,GZ);G.scale.setScalar(S);root.add(G);
  const desk=buildDesk(k,{parent:G,z:-.15});
  const laptop=buildLaptop(k,{parent:G,x:desk.spots.laptop[0],y:desk.top,z:-.15+desk.spots.laptop[1],finish:'nightfall',screenSize:[1536,1024]});
  root.updateMatrixWorld(true);
  const sitter=seatedPerson(k,{parent:G,x:-.07,z:.42,ry:Math.PI,keyboard:pointIn(laptop,'keyboard',G),screen:pointIn(laptop,'screen',G),touchpad:pointIn(laptop,'touchpad',G),
    shirt:0xcfc8bc,jacket:0x34506e,pants:0x2e323b,hair:0x4a3324,name:'files-person'});

  // ---- The on-device index: forty file tiles on a translucent layer above the SSD (laptop-local metres).
  const IW=.088,IH=.054,IC=[.118,laptop.size.H+.024,.022];
  const icv=document.createElement('canvas');icv.width=640;icv.height=Math.round(640*IH/IW);const ig=icv.getContext('2d');
  const itex=track(new THREE.CanvasTexture(icv));itex.colorSpace=THREE.SRGBColorSpace;itex.anisotropy=8;
  const index=k.mesh(track(new THREE.PlaneGeometry(IW,IH)),track(new THREE.MeshBasicMaterial({map:itex,transparent:true,opacity:0,depthWrite:false,toneMapped:false,side:THREE.DoubleSide})));
  index.castShadow=index.receiveShadow=false;index.renderOrder=5;index.name='files-index';index.position.set(...IC);index.rotation.x=-.62;index.userData.sensorKeep=true;laptop.board.add(index);
  // Thin posts from the SSD up to the index layer, so it reads as stored there.
  const postM=track(new THREE.MeshBasicMaterial({color:0x9fd8ff,transparent:true,opacity:0,toneMapped:false}));
  const posts=[[-1,-1],[1,-1]].map(([a])=>{const p=k.mesh(track(new THREE.CylinderGeometry(.0005,.0005,.03,6)),postM);p.castShadow=false;p.position.set(.122+a*.008,laptop.size.H+.012,-.009);laptop.board.add(p);return p;});
  let indexKey='';
  function paintIndex(scan,hits,pulse,versions){
    const key=[scan,hits.join(','),pulse,versions].join('|');if(key===indexKey)return;indexKey=key;
    const W=icv.width,H=icv.height;ig.clearRect(0,0,W,H);rr(ig,4,4,W-8,H-8,26);ig.fillStyle='rgba(10,14,26,.78)';ig.fill();ig.lineWidth=5;ig.strokeStyle='rgba(194,77,255,.9)';ig.stroke();
    ig.fillStyle='#fff';ig.font=`700 40px ${FONT}`;ig.textAlign='left';ig.textBaseline='middle';ig.fillText('INDEX',28,40);
    ig.fillStyle='#cdb8e6';ig.font=`600 30px ${FONT}`;ig.textAlign='right';ig.fillText('40 files · on this laptop',W-28,41);
    const cols=10,rows=4,m=24,top=78,tw=(W-m*2)/cols,th=(H-top-m)/rows;
    for(let i=0;i<40;i++){const c=i%cols,r=Math.floor(i/cols),x=m+c*tw,y=top+r*th,hit=hits.includes(i),read=(i+1)/40<=scan;
      rr(ig,x+5,y+5,tw-10,th-10,8);
      ig.fillStyle=hit?`rgba(214,140,255,${.75+.25*pulse})`:read?'rgba(120,150,190,.55)':'rgba(80,95,120,.4)';ig.fill();
      if(hit){ig.lineWidth=4+4*pulse;ig.strokeStyle='#ffffff';ig.stroke();}
      ig.fillStyle=COL[FILES[i][1]];ig.fillRect(x+12,y+12,tw*.28,th-24);
      ig.fillStyle=hit?'rgba(255,255,255,.95)':'rgba(255,255,255,.45)';for(let l=0;l<3;l++)ig.fillRect(x+16+tw*.28,y+16+l*(th-30)/3,tw*.42,5);}
    if(scan>0&&scan<1){const i=Math.min(39,Math.floor(scan*40)),c=i%cols,r=Math.floor(i/cols);ig.lineWidth=5;ig.strokeStyle='#9fd8ff';rr(ig,m+c*tw+3,top+r*th+3,tw-6,th-6,8);ig.stroke();}
    itex.needsUpdate=true;
  }
  // Index tiles in a fixed order of the folder (tile i = FILES[i]).
  const HITS=[IDX.services,IDX.supplier,IDX.rate],HITS_V=[IDX.services,IDX.servicesOld];

  // ---- Overlay anchor 'npu': an invisible zone around the NPU and the index layer (sized, so the box reads).
  const zone=k.mesh(track(new THREE.BoxGeometry(.13,.05,.1)),mat(0xffffff),.1,.025,-.01);zone.visible=false;zone.castShadow=zone.receiveShadow=false;zone.name='npu-zone';laptop.group.add(zone);

  // ---- Chip view: SSD -> index -> NPU -> up the hinge to the screen (laptop-local metres).
  const p=n=>laptop.point(n),ssd=p('ssd'),npu=p('npu'),scr=p('screen');
  const path=[[ssd[0],ssd[1]+.001,ssd[2]],[ssd[0],IC[1]-.012,ssd[2]-.006],[IC[0],IC[1]-.01,IC[2]-.012],[npu[0],npu[1]+.002,npu[2]],[npu[0]-.02,npu[1]+.004,-.112],[.05,scr[1]-.08,scr[2]+.03],[.03,scr[1]-.02,scr[2]+.004]];
  const view=chipView(k,laptop,{target:'npu',path});

  // ---- Sensor: a camera framing the open board and the screen behind it.
  const cam=new THREE.PerspectiveCamera(34,1,.05,40);
  const toWorld=v=>laptop.group.localToWorld(new THREE.Vector3(...v));
  cam.position.copy(toWorld([.05,.35,.36]));cam.lookAt(toWorld([.035,.1,-.075]));cam.userData.portraitWidth=1.2;

  // ---- Screen: state key per t; redraw only when it changes.
  let screenKey='';
  function screenState(t,versions){
    const wifi=t>=10&&t<16.5?'offline':'on',badge=wifi==='offline';
    if(t<T.ask){
      const scroll=Math.round(smooth(T.scroll[0],T.scroll[1],t)*22*4)/4,typed=Math.round(SEARCH.length*smooth(T.search[0],T.search[1],t));
      const query=t>=T.search[0]?SEARCH.slice(0,typed):'',noMatch=t>=T.noMatch;
      return{key:['ex',scroll,query,noMatch,wifi].join('|'),wifi,badge,paint:(g,w,h)=>paintExplorer(g,w,h,{scroll,query,noMatch})};}
    if(t<T.click){
      const typed=Math.round(QUESTION.length*Math.min(1,Math.max(0,(t-T.type[0])/(T.type[1]-T.type[0])))),caret=Math.floor(t*2.5)%2===0||typed>0&&typed<QUESTION.length;
      const mode=t<T.enter?'ask':t<T.answer?'searching':'answer',dots=1+Math.floor(t*3)%3,cites=t>=T.cites;
      const hot=!versions&&t>=T.click-.6?0:-1,cm=smooth(17.6,18.4,t),cur=!versions&&t>=17.6?[Math.round(760-400*cm),Math.round(760-164*cm)]:null;
      const s={typed,caret:mode==='ask'&&caret,mode,dots:mode==='searching'?dots:0,cites,versions,hot,cursor:cur};
      return{key:['ask',typed,s.caret,mode,s.dots,cites,versions,hot,cur&&cur.join(','),wifi,badge].join('|'),wifi,badge,paint:(g,w,h)=>paintAsk(g,w,h,s)};}
    if(t<T.email){const mark=Math.round(smooth(T.mark,T.mark+.9,t)*12)/12,checked=t>=T.checked;
      return{key:['doc',mark,checked,versions,wifi].join('|'),wifi,badge,paint:(g,w,h)=>paintDoc(g,w,h,{mark,checked,versions})};}
    const len=(versions?REPLY_V:REPLY).join('').length,typed=Math.round(len*smooth(T.reply[0],T.reply[1],t)),sent=t>=T.sent;
    return{key:['mail',typed,sent,versions,wifi].join('|'),wifi,badge,paint:(g,w,h)=>paintEmail(g,w,h,{typed,sent,versions})};
  }

  let last={t:0,amount:0};
  function update(t,ctx){
    const versions=!!ctx.variation;
    // Screen.
    const s=screenState(t,versions);
    if(s.key!==screenKey){screenKey=s.key;laptop.screen.wifi=s.wifi;laptop.screen.badge=s.badge;laptop.screen.draw(s.paint);}
    // Chip view: in over the start of the AI view, out as the camera pulls back for the review.
    const amount=smooth(10.1,10.9,t)*(1-smooth(16.5,17.4,t));
    view.set(amount,t);last={t,amount};
    // The SSD is read during the scan; the index layer fades in with the cutaway.
    laptop.lightChip('ssd',amount*smooth(T.scan[0]-.4,T.scan[0],t)*(1-.6*smooth(T.scan[1],T.scan[1]+.6,t)));
    const io=amount*smooth(10.5,11.1,t);index.material.opacity=io*.96;index.visible=io>.01;postM.opacity=io*.8;posts.forEach(o=>o.visible=io>.01);
    if(index.visible){const scan=Math.round(smooth(T.scan[0],T.scan[1],t)*40)/40,on=t>=T.match;
      const pulse=on?Math.round((.5+.5*Math.sin((t-T.match)*7))*6)/6:0;paintIndex(scan,on?(versions?HITS_V:HITS):[],pulse,versions);}
    laptop.update(t,{fans:.25+.25*amount});
    // Person: scrolls, searches by filename, gives up; types the question; sits back for the chip view; clicks the
    // source, reads, types the reply. Hidden in the board camera (it would stand between the camera and the desk).
    sitter.group.visible=!ctx.sensor;
    const P=sitter.pose;
    if(t<T.search[0]-.2)P(t,{mode:'mouse'});
    else if(t<T.noMatch)P(t,{mode:'mouse',to:'type',mix:smooth(T.search[0]-.2,T.search[0]+.1,t)});
    else if(t<T.type[0]-.4){const back=smooth(T.noMatch+.1,T.noMatch+.7,t)*(1-smooth(T.type[0]-1.2,T.type[0]-.5,t));P(t,{mode:'type',to:'rest',mix:back,lean:.14-.2*back,turn:-.1*back*Math.sin((t-T.noMatch)*2.2)});}
    else if(t<T.enter+.3)P(t,{mode:'type'});
    else if(t<16.5)P(t,{mode:'type',to:'lap',mix:smooth(T.enter+.3,T.enter+1.1,t)});
    else if(t<T.click+.4)P(t,{mode:'lap',to:'mouse',mix:smooth(17.2,18.0,t)});
    else if(t<T.email){const read=smooth(T.doc+.2,T.doc+1,t)*(1-smooth(T.email-.9,T.email-.3,t));P(t,{mode:'mouse',to:'rest',mix:read,lean:.14-.08*read});}
    else if(t<T.sent+.3)P(t,{mode:'mouse',to:'type',mix:smooth(T.email-.1,T.reply[0],t)});
    else P(t,{mode:'type',to:'rest',mix:smooth(T.sent+.3,T.sent+1,t)});
  }
  return{anchors:{npu:zone},
    sensors:{'npu-view':{camera:cam,mode:'normal',targets:[laptop.chips.npu],label:'On the chip'}},
    update,
    metrics:()=>({chipView:+last.amount.toFixed(2),screen:screenKey.split('|')[0],wifi:laptop.screen.wifi,index:index.visible})};
}
