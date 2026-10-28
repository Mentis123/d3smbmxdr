// S3 "It's not us" (Splunk AI Lab). On the shared network board (lab/rigs/splunk-net.js) at half scale: the board is
// your network; the internet providers float beyond its edge. Microsoft 365 slows for the campus and help desk tickets
// pop up ("Teams is slow"). In the ThousandEyes view (buildings greyed, paths glowing) each segment of the test path is
// labelled with what ThousandEyes measures: your network fine, Telco A slow and dropping packets, Microsoft fine; the
// Cisco AI Assistant in ThousandEyes names the fault domain, and the alert lands in Splunk ITSI as an episode. The team
// moves Microsoft 365 traffic to the second provider and opens a ticket with Telco A.
// Variation "inside": the fault is the campus internet edge, so the red segment is ON the board and the team fixes its
// own router. Credit for the AI is ThousandEyes' (Cisco AI Assistant GA Jul 2025, AI explanations of test rounds GA
// Oct 2025); Splunk receives the alert (ThousandEyes-ITSI integration) and no Splunk AI verdict is claimed. Pure f(t, ctx).
import {buildNetwork,pinCards,CSS,P} from '../rigs/splunk-net.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const SCALE=.5,Y=.004,CISCO='#00bceb';
const T={slow:[7,8.5],tickets:7.6,tags:13.8,edge:14.2,card:15.6,toSplunk:[21.6,22.8],splunkCard:22.8,approve:24.3,move:[24.6,25.6],ticketsOff:[26,27],cardOff:[27.4,28.2]};

function tronStage(k){
  const {THREE}=k;const scene=k.root.parent;if(!scene)return;
  scene.background=new THREE.Color(0x03060d);if(scene.fog){scene.fog.color.set(0x03060d);scene.fog.near=14;scene.fog.far=34;}
  scene.traverse(o=>{if(o.isHemisphereLight){o.color.set(0x9fc8ff);o.groundColor.set(0x0b1220);o.intensity=1.5;}
    else if(o.isDirectionalLight&&o.castShadow){o.color.set(0xdfeaff);o.intensity=2.4;o.position.set(-3,7,5);}
    else if(o.isDirectionalLight){o.color.set(0x2fb8ff);o.intensity=.6;o.position.set(5,3,-3);}});
}

export function buildKit(k){
  const {THREE,root}=k;
  tronStage(k);
  const net=buildNetwork(k,{parent:root,scale:SCALE,y:Y,detail:'stage'});
  const {canvas,sprite,rr,font,B}=net.h,X=net.x,S=X.seg;
  net.panel.visible=false;

  // ---- help desk tickets over the campus ----
  const c=P.sites.campus;
  const ticket=(txt,p)=>{const cv=canvas(420,96,(g,w,h)=>{g.fillStyle='rgba(30,22,6,.92)';rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle=CSS.warn;g.lineWidth=4;g.stroke();
    g.fillStyle=CSS.warn;g.textBaseline='middle';font(g,800,34);g.fillText('🎫 '+txt,22,h/2+2);});const sp=sprite(cv,1.45,...p);sp.visible=false;return sp;};
  const tickets=[ticket('Teams is slow',[c[0]-1.3,B+1.75,c[1]-.2]),ticket('Outlook hanging',[c[0]+.1,B+2.35,c[1]+.1]),ticket('SharePoint timing out',[c[0]+1.2,B+2.95,c[1]-.4])];
  tickets.forEach(sp=>sp.scale.multiplyScalar(.85));
  const deskCv=canvas(460,130,(g,w,h,n=0,done=false)=>{const css=done?CSS.ok:n?CSS.warn:CSS.cyan;g.fillStyle='rgba(4,8,16,.9)';rr(g,4,4,w-8,h-8,20);g.fill();g.strokeStyle=css;g.lineWidth=5;g.stroke();
    g.textAlign='center';g.textBaseline='middle';g.fillStyle=css;font(g,800,50);g.fillText(done?'TICKETS CLOSED':`${n} TICKETS`,w/2,54);g.fillStyle='#9fb3c8';font(g,600,26);g.fillText(done?'Microsoft 365 back to normal':'“the network is slow”',w/2,102);});
  const desk=sprite(deskCv,1.35,P.noc[0],B+1.55,P.noc[1]-.1);desk.visible=false;let deskKey='';

  // ---- what ThousandEyes measures on each segment of the path (redrawn per state) ----
  const tagCv=()=>canvas(560,110,(g,w,h,txt='',sub='',css=CSS.ok)=>{g.fillStyle='rgba(4,8,16,.9)';rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle=css;g.lineWidth=5;g.stroke();
    g.textBaseline='middle';g.fillStyle=css;font(g,800,36);g.fillText(txt,22,38);g.fillStyle='#dfe8f2';font(g,600,27);g.fillText(sub,22,80);});
  const mkTag=(p)=>{const cv=tagCv(),sp=sprite(cv,1.55,...p);sp.visible=false;return{cv,sp,key:''};};
  const midIn=S.inside.curve.getPoint(.55),midProv=S.provider.curve.getPoint(.22);
  const tags={inside:mkTag([midIn.x,midIn.y+.45,midIn.z]),isp:mkTag([P.ispA[0]-.25,P.ispA[1]-.75,P.ispA[2]+.6]),provider:mkTag([midProv.x+.3,midProv.y+.35,midProv.z]),ispB:mkTag([P.ispB[0]+.2,P.ispB[1]-.55,P.ispB[2]])};
  const setTag=(tg,on,txt,sub,css)=>{tg.sp.visible=on>.01;tg.sp.material.opacity=on;const kk=txt+sub+css;if(kk!==tg.key){tg.key=kk;tg.cv.redraw(txt,sub,css);}};

  // ---- the alert travelling into Splunk, and the two cards ----
  const pulse=sprite(canvas(64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'#fff');gr.addColorStop(.4,'rgba(255,63,174,.95)');gr.addColorStop(1,'rgba(255,63,174,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}),.7,0,0,0);pulse.visible=false;
  const ring=new THREE.Vector3(P.ring[0]-P.ringR*.7,P.ring[1],P.ring[2]);
  const aiCv=canvas(900,500,(g,w,h,inside=false)=>{
    g.fillStyle='rgba(4,12,20,.95)';rr(g,4,4,w-8,h-8,24);g.fill();g.strokeStyle=CISCO;g.lineWidth=6;g.stroke();
    g.fillStyle=CISCO;rr(g,4,4,w-8,74,22);g.fill();g.fillStyle='#04121c';font(g,800,33);g.textBaseline='middle';g.fillText('CISCO AI ASSISTANT · THOUSANDEYES',30,42);
    const L=inside?[['Microsoft 365 slow from Campus, 10:12','#ffffff',33,800],['Fault domain: your network','#ff8f9b',30,800],['the campus internet edge (35% loss)','#ffd38a',28,700],['Telco A and Microsoft look normal','#dfe8f2',27,600],['No internet outage reported (Internet Insights)','#9fb3c8',25,600]]
      :[['Microsoft 365 slow from Campus, 10:12','#ffffff',33,800],['Fault domain: ISP · Telco A (AS 64500)','#ff8f9b',30,800],['240 ms and 6% loss inside Telco A','#ffd38a',28,700],['Your network and Microsoft look normal','#dfe8f2',27,600],['Other customers see it too (Internet Insights)','#9fb3c8',25,600]];
    L.forEach(([s,c2,z,wt],i)=>{g.fillStyle=c2;font(g,wt,z);g.fillText(s,30,126+i*56);});
    g.fillStyle='#9fb3c8';font(g,600,24);g.fillText('Alert sent to Splunk ITSI →',30,h-34);});
  const aiCard=sprite(aiCv,3.3,0,B+2,0);aiCard.visible=false;let aiKey='';
  const spCv=canvas(900,500,(g,w,h,mode='propose',inside=false)=>{const ok=mode==='approved';
    g.fillStyle='rgba(12,6,18,.94)';rr(g,4,4,w-8,h-8,24);g.fill();g.strokeStyle=CSS.splunk;g.lineWidth=6;g.stroke();
    g.fillStyle=CSS.splunk;rr(g,4,4,w-8,74,22);g.fill();g.fillStyle='#fff';font(g,800,34);g.textBaseline='middle';g.fillText('SPLUNK ITSI · EPISODE',30,42);
    const L=inside?[['Microsoft 365 slow · Campus','#ffffff',34,800],['From ThousandEyes: inside, campus edge','#ffd38a',28,700],['Owner: network team','#dfe8f2',27,600],['Next: fail over the campus edge router','#dfe8f2',27,600]]
      :[['Microsoft 365 slow · Campus','#ffffff',34,800],['From ThousandEyes: outside, Telco A','#ffd38a',28,700],['Owner: network team · ticket to Telco A','#dfe8f2',27,600],['Next: send Microsoft 365 via Telco B','#dfe8f2',27,600]];
    L.forEach(([s,c2,z,wt],i)=>{g.fillStyle=c2;font(g,wt,z);g.fillText(s,30,126+i*56);});
    const by=h-80;g.fillStyle=ok?CSS.ok:'rgba(63,224,138,.18)';rr(g,30,by,300,56,14);g.fill();g.strokeStyle=CSS.ok;g.lineWidth=3;g.stroke();
    g.fillStyle=ok?'#06180e':CSS.ok;font(g,800,29);g.fillText(ok?'✓ Approved':'Approve',ok?62:94,by+29);
    g.strokeStyle='#7f93a8';rr(g,350,by,230,56,14);g.stroke();g.fillStyle='#9fb3c8';font(g,700,29);g.fillText('Decline',410,by+29);
    if(ok){g.fillStyle='#bfffd9';font(g,600,25);g.fillText('Network team · 10:16',610,by+29);}});
  const spCard=sprite(spCv,3.3,0,B+2,0);spCard.visible=false;let spKey='';
  let pin=null;pinCards(k,net,SCALE,()=>pin,{side:'top-right'});

  // ---- the ThousandEyes view: from the front left, along the path as it leaves the board ----
  const cam=new THREE.PerspectiveCamera(52,1.6,.05,60);cam.position.set(-2.4,2.3,3.2);cam.lookAt(-3.0,1.0,-.45);cam.userData.portraitWidth=1.35;root.add(cam);

  const campusZone=new THREE.Group();campusZone.name='campus-zone';campusZone.position.set(c[0],B+.65,c[1]);net.group.add(campusZone);
  {const m=new THREE.Mesh(k.track(new THREE.BoxGeometry(3.0,1.3,1.8)),k.mat(0xffffff));m.visible=false;campusZone.add(m);}
  let last={};
  function update(t,ctx){
    const v=!!ctx.variation;
    net.update(t,{clock:72});
    const slow=smooth(T.slow[0],T.slow[1],t),moved=v?0:smooth(T.move[0],T.move[1],t),fixed=v?smooth(T.move[0],T.move[1],t):0;
    const bad=slow*(1-(v?fixed:0));
    // The red segment is the fault domain: Telco A (or, with the variation, your own campus edge).
    const segCss=(id)=>{const faulty=v?id==='inside':(id==='toIsp'||id==='isp');return faulty&&bad>.3?(moved>.5?'#7a2a34':CSS.bad):id==='b1'||id==='b2'?CSS.ok:CSS.te;};
    for(const [id,f] of Object.entries(S)){const faulty=v?id==='inside':(id==='toIsp'||id==='isp');
      const lvl=id==='b1'||id==='b2'?moved*.95:faulty?(.6+.4*bad)*(1-.7*moved):.6*(1-.6*moved*(id==='provider'?0:id==='inside'?0:1));
      f.set(lvl,t);f.m.uniforms.uColor.value.set(segCss(id));f.m.uniforms.uSpeed.value=faulty&&bad>.3?.7:2.2;}
    if(v)X.edge.set(bad>.3?'down':'ok',t);
    X.ispA.set(!v&&bad>.3?CSS.bad:CSS.te,t,!v&&bad>.3?1:0);X.ispB.set(moved>.5?CSS.ok:CSS.te,t,0);
    // The edge of your network brightens in the ThousandEyes view.
    const edgeOn=smooth(T.edge,T.edge+.6,t);X.curtain.material.opacity=.3+.55*edgeOn;X.edgeLabel.visible=edgeOn>.05;X.edgeLabel.material.opacity=edgeOn;
    // Tickets and the help desk count.
    const tOff=1-smooth(T.ticketsOff[0],T.ticketsOff[1],t);
    // (In the ThousandEyes view the tickets step aside: the view is about the path.)
    tickets.forEach((sp,i)=>{const on=smooth(T.tickets+i*.6,T.tickets+i*.6+.3,t)*tOff*(ctx.sensor?0:1);sp.visible=on>.01;sp.material.opacity=on;});
    const n=Math.round(12*smooth(T.tickets,T.tickets+3,t)),closed=t>=T.ticketsOff[1];
    desk.visible=t>=T.tickets&&!ctx.sensor;const dk=[n,closed].join('|');if(dk!==deskKey){deskKey=dk;deskCv.redraw(n,closed);}
    // Segment tags: what ThousandEyes measures.
    const tg=i=>smooth(T.tags+i*.5,T.tags+i*.5+.4,t);
    if(v){setTag(tags.inside,tg(0),'Your network ✗',fixed>.5?'campus edge · back to normal':'campus edge · 35% loss',fixed>.5?CSS.ok:CSS.bad);
      setTag(tags.isp,tg(1),'Telco A ✓','normal · 14 ms',CSS.ok);setTag(tags.provider,tg(2),'Microsoft ✓','normal',CSS.ok);setTag(tags.ispB,0,'','',CSS.ok);}
    else{setTag(tags.inside,tg(0),'Your network ✓','normal · 3 ms',CSS.ok);
      setTag(tags.isp,tg(1),'Telco A ✗',moved>.5?'ticket open · bypassed':'240 ms · 6% loss',moved>.5?CSS.warn:CSS.bad);
      setTag(tags.provider,tg(2),'Microsoft ✓','normal',CSS.ok);setTag(tags.ispB,moved,'Telco B ✓','normal · 18 ms',CSS.ok);}
    // The alert flies into Splunk.
    const fly=smooth(T.toSplunk[0],T.toSplunk[1],t);pulse.visible=fly>0&&fly<1;
    const from=v?new THREE.Vector3(P.edge[0],B+.4,P.edge[1]):new THREE.Vector3(...P.ispA);pulse.position.copy(from).lerp(ring,fly);pulse.position.y+=Math.sin(fly*Math.PI)*.8;
    // Cards: the Cisco AI Assistant in the ThousandEyes view, then the Splunk episode.
    if(String(v)!==aiKey){aiKey=String(v);aiCv.redraw(v);}
    const mode=t>=T.approve?'approved':'propose',sk=mode+v;if(sk!==spKey){spKey=sk;spCv.redraw(mode,v);}
    const aiOn=smooth(T.card,T.card+.3,t)*(1-smooth(T.toSplunk[0],T.toSplunk[0]+.4,t)),spOn=smooth(T.splunkCard,T.splunkCard+.3,t)*(1-smooth(T.cardOff[0],T.cardOff[1],t));
    aiCard.visible=aiOn>.01;aiCard.material.opacity=aiOn;spCard.visible=spOn>.01;spCard.material.opacity=spOn;
    pin=ctx.chapter>=2?(spOn>.01?spCard:aiCard):null;
    for(const cd of [aiCard,spCard])if(pin!==cd){cd.position.copy(cd.userData.home.p);cd.scale.copy(cd.userData.home.s);}
    last={fault:v?'inside':'telco-a',slow:+bad.toFixed(2),moved:+moved.toFixed(2),tickets:n};
  }
  update(0,{variation:null,chapter:0,chapterId:'scene',sensor:false});

  return{
    anchors:{campus:campusZone,ispA:X.ispA.g,ispB:X.ispB.g,edge:X.edge.g,cloud:net.cloud},
    sensors:{'te-view':{camera:cam,mode:'mask',targets:[X.ispA.g],label:'ThousandEyes · Cisco AI Assistant',title:'ThousandEyes view'}},
    update,
    metrics:()=>({...last}),
  };
}
