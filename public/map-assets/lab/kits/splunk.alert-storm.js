// S2 "Forty alerts, one cause" (Splunk AI Lab). On the shared network board (lab/rigs/splunk-net.js) at half scale:
// the campus core switch Core A fails, and red alert badges pop up across the board (the campus buildings, the ThousandEyes
// agent, the load balancers, SAP in both data centres, the SaaS tests): 40 alerts from 9 systems, counted over the
// network team. In Splunk's view (buildings greyed, data glowing) Event iQ draws the links back through the topology and
// pulls every alert into one episode at Core A, with a summary: likely root cause, next step, confidence. The team
// approves moving the campus uplinks to Core B; the campus comes back and the episode resolves.
// Variation "two causes": an unrelated Bayside link alert stays its own episode instead of being swept in.
// Capability wording from Splunk's ITSI 5.0 post (Event iQ, GA 30 Jun 2026). Pure function of t and ctx.
import {buildNetwork,pinCards,CSS,P} from '../rigs/splunk-net.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const SCALE=.5,Y=.004;
const T={fail:7,pop0:7.3,links:[13.5,14.3],fly:14.4,episode:16.3,card:16.6,approve:22.5,failover:[23,23.8],recover:[23.6,24.8],clear:[24,27.5],resolved:27.8,cardOff:[26,26.8]};

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
  const {canvas,sprite,rr,font,B,wp}=net.h,X=net.x;
  net.panel.visible=false;

  // ---- where the alerts come from: [anchor position (board-local), count, delay] ----
  const c=P.sites.campus,blocks=[[-1.05,-.2,1.3],[.05,-.35,.85],[1.0,.1,1.05],[-.1,.45,.45]];
  const sources=[
    {p:[P.coreA[0],B+.72,P.coreA[1]],n:5,at:0,id:'core'},
    ...blocks.map(([dx,dz,h],i)=>({p:[c[0]+dx,B+h+.28,c[1]+dz],n:[6,5,4,3][i],at:.3+i*.3,id:'b'+i})),
    {p:wp(net.campus.te,.6).toArray(),n:3,at:1.7,id:'te'},
    {p:[P.hub[0]+.45,B+.95,P.hub[1]],n:4,at:2.1,id:'lb'},
    {p:[P.south[0]-.3,B+1.25,P.south[1]+.3],n:6,at:2.5,id:'sapS'},
    {p:[P.north[0]+.3,B+1.25,P.north[1]+.3],n:2,at:2.9,id:'sapN'},
    {p:[P.cloud[0]+.6,P.cloud[1]-.5,P.cloud[2]+.6],n:2,at:3.3,id:'saas'},
  ];
  const bay={p:[P.sites.bayside[0],B+1.0,P.sites.bayside[1]],n:3,at:3.6,id:'bay'};
  const CORE=[P.coreA[0],B+.72,P.coreA[1]];

  // ---- alert badges: a red tile with a count, popping in and (in Splunk's view) flying to Core A ----
  const badgeCv=(css,txt)=>canvas(160,96,(g,w,h,n=0)=>{g.fillStyle=css;rr(g,4,4,w-8,h-8,20);g.fill();g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=4;g.stroke();
    g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';font(g,800,52);g.fillText((txt||'⚠ ')+n,w/2,h/2+3);});
  const badges=[...sources,bay].map(s=>{const cv=badgeCv(s===bay?CSS.warn:CSS.bad);const sp=sprite(cv,.62,...s.p);sp.visible=false;return{...s,cv,sp,shown:-1};});
  // Topology links drawn back to Core A (lines, so Splunk's view keeps them bright).
  const linkPos=new Float32Array(sources.length*6),linkGeo=k.track(new THREE.BufferGeometry());linkGeo.setAttribute('position',new THREE.BufferAttribute(linkPos,3));
  sources.forEach((s,i)=>{linkPos.set([...s.p,...CORE],i*6);});
  const linkMat=k.track(new THREE.LineBasicMaterial({color:new THREE.Color(CSS.bad),transparent:true,opacity:0,toneMapped:false}));
  const links=new THREE.LineSegments(linkGeo,linkMat);links.userData.noFit=true;links.renderOrder=7;net.group.add(links);
  // The episode badge at Core A, and the count over the network team.
  const epCv=canvas(512,150,(g,w,h,mode='open',n=40,eps=1)=>{const ok=mode==='resolved',css=ok?CSS.ok:CSS.splunk;
    g.fillStyle='rgba(8,6,16,.92)';rr(g,4,4,w-8,h-8,22);g.fill();g.strokeStyle=css;g.lineWidth=6;g.stroke();g.textAlign='center';g.textBaseline='middle';
    g.fillStyle=css;font(g,800,46);g.fillText(ok?'✓ RESOLVED':eps>1?'EPISODE 1 OF 2':'1 EPISODE',w/2,52);g.fillStyle='#e8eef5';font(g,600,32);g.fillText(ok?'Campus on Core B · 10:16':`${n} alerts · one cause`,w/2,108);});
  const ep=sprite(epCv,1.55,CORE[0],CORE[1]+.75,CORE[2]);ep.visible=false;let epKey='';
  const ep2Cv=canvas(512,150,(g,w,h)=>{g.fillStyle='rgba(16,10,4,.92)';rr(g,4,4,w-8,h-8,22);g.fill();g.strokeStyle=CSS.warn;g.lineWidth=6;g.stroke();g.textAlign='center';g.textBaseline='middle';
    g.fillStyle=CSS.warn;font(g,800,46);g.fillText('EPISODE 2 OF 2',w/2,52);g.fillStyle='#e8eef5';font(g,600,32);g.fillText('Bayside link · separate cause',w/2,108);});
  const ep2=sprite(ep2Cv,1.55,bay.p[0],bay.p[1]+.55,bay.p[2]);ep2.visible=false;
  const cntCv=canvas(420,130,(g,w,h,open=0,res=false)=>{const css=open>0?CSS.bad:res?CSS.ok:CSS.cyan;g.fillStyle='rgba(4,8,16,.9)';rr(g,4,4,w-8,h-8,20);g.fill();g.strokeStyle=css;g.lineWidth=5;g.stroke();
    g.textAlign='center';g.textBaseline='middle';g.fillStyle=css;font(g,800,58);g.fillText(open>0?`${open} ALERTS`:res?'0 OPEN':'ALL CLEAR',w/2,58);g.fillStyle='#9fb3c8';font(g,600,26);g.fillText(open>0?'at the network team':res?'1 episode resolved':'network team',w/2,104);});
  const cnt=sprite(cntCv,1.3,P.noc[0],B+1.55,P.noc[1]-.1);let cntKey='';

  // ---- the Event iQ card, pinned to the rendering camera from the AI view on ----
  const cardCv=canvas(900,520,(g,w,h,mode='propose',two=false)=>{const ok=mode==='approved';
    g.fillStyle='rgba(12,6,18,.94)';rr(g,4,4,w-8,h-8,24);g.fill();g.strokeStyle=CSS.splunk;g.lineWidth=6;g.stroke();
    g.fillStyle=CSS.splunk;rr(g,4,4,w-8,74,22);g.fill();g.fillStyle='#fff';font(g,800,36);g.textBaseline='middle';g.textAlign='left';g.fillText('SPLUNK ITSI · EVENT iQ',30,42);
    const L=two?[[`43 alerts → 2 episodes`,'#ffffff',40,800],['1: Campus Core A down (power supply)','#ffd38a',28,700],['2: Bayside internet link flapping','#ffd38a',28,700],['Next step: move campus uplinks to Core B','#dfe8f2',27,600],['Confidence: high','#9df5c0',25,600]]
      :[['40 alerts → 1 episode','#ffffff',40,800],['Likely root cause: Campus Core A down','#ffd38a',29,700],['(power supply) · started 10:12 · 9 systems','#dfe8f2',26,600],['Next step: move campus uplinks to Core B','#dfe8f2',27,600],['Confidence: high','#9df5c0',25,600]];
    L.forEach(([s,c2,z,wt],i)=>{g.fillStyle=c2;font(g,wt,z);g.fillText(s,30,126+i*52);});
    const by=h-78;g.fillStyle=ok?CSS.ok:'rgba(63,224,138,.18)';rr(g,30,by,300,56,14);g.fill();g.strokeStyle=CSS.ok;g.lineWidth=3;g.stroke();
    g.fillStyle=ok?'#06180e':CSS.ok;font(g,800,29);g.fillText(ok?'✓ Approved':'Approve',ok?62:94,by+29);
    g.strokeStyle='#7f93a8';rr(g,350,by,230,56,14);g.stroke();g.fillStyle='#9fb3c8';font(g,700,29);g.fillText('Decline',410,by+29);
    if(ok){g.fillStyle='#bfffd9';font(g,600,25);g.fillText('Network team · 10:15',610,by+29);}});
  const card=sprite(cardCv,3.3,0,B+2,0);card.visible=false;let cardKey='';
  let pinned=false;pinCards(k,net,SCALE,()=>pinned?card:null,{side:'top-right'});

  // ---- Splunk's view: high over the front edge, the whole board ----
  const cam=new THREE.PerspectiveCamera(45,1.6,.05,60);cam.position.set(-.2,4.45,3.95);cam.lookAt(-.2,.25,-.2);cam.userData.portraitWidth=1.4;root.add(cam);

  const anchorAt=(name,p,s=[.8,.8,.8])=>{const g=new THREE.Group();g.name=name;g.position.set(...p);net.group.add(g);const m=new THREE.Mesh(k.track(new THREE.BoxGeometry(...s)),k.mat(0xffffff));m.visible=false;g.add(m);return g;};
  const nocZone=anchorAt('noc-zone',[P.noc[0],B+.7,P.noc[1]-.1],[1.8,1.6,1.2]);
  let last={};
  function update(t,ctx){
    const v=!!ctx.variation;
    net.update(t,{clock:72});
    const down=t>=T.fail,fo=smooth(T.failover[0],T.failover[1],t),rec=smooth(T.recover[0],T.recover[1],t);
    // Core A fails; Core B takes the campus uplinks once the team approves.
    X.coreA.set(down?'down':'ok',t);X.coreB.set(fo>.5?'active':'standby',t);
    X.uplinkA.set(down?.35*(1-fo):.9,t);X.uplinkA.m.uniforms.uColor.value.set(down?CSS.bad:CSS.campus);X.uplinkB.set(fo,t);
    const out=down?1-rec:0;
    net.campus.winM.emissiveIntensity=.9-.65*out;
    X.access[0].set(.85*(1-out)+.08,t);X.toSouth[0].set(1-out*.9,t);
    X.tePaths[0].set(.75,t);X.tePaths[0].m.uniforms.uColor.value.set(out>.5?CSS.bad:CSS.te);
    // Alerts pop, then (Splunk's view) fly along their links into Core A.
    let open=0,bayOpen=0;const clearU=smooth(T.clear[0],T.clear[1],t);
    badges.forEach((b,i)=>{
      if(b===badges[badges.length-1]&&!v){b.sp.visible=false;return;}
      const t0=T.pop0+b.at,pop=smooth(t0,t0+.25,t),n=Math.round(b.n*smooth(t0,t0+.8,t));
      if(b.id==='bay'){b.sp.visible=pop>0;if(n!==b.shown){b.shown=n;b.cv.redraw(n);}bayOpen=n;b.sp.position.set(...b.p);b.sp.scale.set(.62,.62*b.sp.userData.aspect,1);return;}
      const f0=T.fly+i*.12,fly=smooth(f0,f0+1.4,t);
      if(n!==b.shown){b.shown=n;b.cv.redraw(n);}
      const p=b.p,lift=Math.sin(fly*Math.PI)*.6;
      b.sp.position.set(p[0]+(CORE[0]-p[0])*fly,p[1]+(CORE[1]-p[1])*fly+lift,p[2]+(CORE[2]-p[2])*fly);
      const sc=(.62+.18*Math.max(0,Math.sin((t-t0)*3))*(1-smooth(t0+1,t0+2,t)))*(1-.5*fly);b.sp.scale.set(sc,sc*b.sp.userData.aspect,1);
      b.sp.visible=pop>0&&fly<.98;open+=n;});
    // The campus fix clears the campus episode; Bayside's separate episode stays open (variation).
    open=Math.round(open*(1-clearU))+bayOpen;
    linkMat.opacity=smooth(T.links[0],T.links[1],t)*(1-smooth(T.fly+1.2,T.episode+.4,t))*.9;
    // Episode badge(s): one episode at Core A (two with the variation), resolved after the failover.
    const epOn=smooth(T.episode,T.episode+.3,t),resolved=t>=T.resolved;
    const ek=[resolved?'resolved':'open',v].join('|');if(ek!==epKey){epKey=ek;epCv.redraw(resolved?'resolved':'open',40,v?2:1);}
    ep.visible=epOn>.01;ep.material.opacity=epOn;ep2.visible=v&&epOn>.01;ep2.material.opacity=epOn;
    if(v&&epOn>.01)badges[badges.length-1].sp.visible=false;
    const ck=[open,resolved].join('|');if(ck!==cntKey){cntKey=ck;cntCv.redraw(open,resolved);}
    // The Event iQ card.
    const mode=t>=T.approve?'approved':'propose',kk=mode+v;if(kk!==cardKey){cardKey=kk;cardCv.redraw(mode,v);}
    const cOn=smooth(T.card,T.card+.3,t)*(1-smooth(T.cardOff[0],T.cardOff[1],t));
    card.visible=cOn>.01;card.material.opacity=cOn;
    pinned=ctx.chapter>=2;if(!pinned){card.position.copy(card.userData.home.p);card.scale.copy(card.userData.home.s);}
    last={open,episode:epOn>.5,core:down?(fo>.5?'B':'down'):'A'};
  }
  update(0,{variation:null,chapter:0,chapterId:'scene',sensor:false});

  return{
    anchors:{noc:nocZone,coreA:X.coreA.g,coreB:X.coreB.g,bayside:net.bayside.g,campus:net.campus.g},
    sensors:{'splunk-view':{camera:cam,mode:'mask',targets:[X.coreA.g],label:'Splunk ITSI · Event iQ',title:'Splunk view'}},
    update,
    metrics:()=>({...last}),
  };
}
