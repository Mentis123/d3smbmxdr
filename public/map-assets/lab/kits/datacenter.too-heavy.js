// D3 "Too heavy: structural constraints". Left: an older raised access floor (600 mm tiles on steel pedestals),
// front edge cut away to show the void, where power cables and cooling pipes already crowd every path. Ordinary racks
// stand on it. Right: a saw-cut concrete slab on grade, joined to the floor by a ramp. Change: movers roll a heavy AI
// rack from the slab up onto the floor; the tiles under it give, the pedestals bow, the rack sinks and leans forward
// and cracks spread across the tiles round it (exaggerated, illustrative). AI view: a structural view masks the
// overloaded tiles and pedestals, with the congested cables and pipes left in colour. Review: the rack is rolled back
// down to the slab, power and pipes are run overhead, and a structural engineer signs it off. Everything is a function
// of t. The owner's point (design doc): the raised floor appears only as the failure case, never under AI-ready racks.
import {createFlowMaterial} from '../../flow-effects.js';

const FY=.5,TILE=.6,TT=.035,X0=-3.1,NX=6,Z0=-1.7,NZ=5,SL=.04;          // floor top, tile, tile thickness, grid origin, slab top
const RAMP=[.5,1.85],SLAB=[1.85,3.35],AI_X=-.4,PARK_X=2.6,RACK_Z=.7,AI_H=2.25,SKATE=.07,MOVER_DX=.62;
const T_IN=[4.4,7.9],LOAD=[8.0,9.8],CRACK=[8.6,10.6],T_OUT=[17.0,20.0],T_SET=[20.1,20.6];
const T_FRAMES=[19.3,19.9],T_TRAY=[19.9,20.9],T_DROPS=[20.9,21.4],T_POWER=21.4,E_T0=20.5,E_T1=22.7,T_SIGN=23.4;
const SINK=.1,VEE=.11;                                                // max corner sink and extra drop at the split seam
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const ease5=u=>{u=Math.min(1,Math.max(0,u));return u*u*u*(u*(u*6-15)+10);};
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};

export function buildKit(k){
  const {THREE,root,box,cylinder,bar,mesh,mat,steel,dark,track,props,actors}=k;
  const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
  const hazard=mat(0xf2b134,{roughness:.6}),fascia=mat(0x5d6870,{roughness:.8}),pedM=mat(0xa9b4ba,{metalness:.7,roughness:.35}),
    rackM=mat(0x1b2329,{metalness:.45,roughness:.5}),aiM=mat(0x0e1216,{metalness:.55,roughness:.4}),
    cyanLed=mat(0x22d6e8,{emissive:0x22d6e8,emissiveIntensity:1.1}),greenLed=mat(0x4be38f,{emissive:0x1fbf5a,emissiveIntensity:.9}),
    slabM=mat(0xc3c8c6,{roughness:.95}),jointM=mat(0x3a4044,{roughness:1}),trayM=mat(0x9aa7ae,{metalness:.6,roughness:.4}),
    strutM=mat(0x55626a,{metalness:.5,roughness:.5});

  // ---- Raised access floor: tile grid on pedestals, fascia on the back and left, front edge cut away ----
  const tileTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#c9cfd2';g.fillRect(0,0,w,h);g.fillStyle='#b9c0c4';for(let i=0;i<40;i++)g.fillRect(rnd(i,1)*w,rnd(i,2)*h,3,3);g.strokeStyle='#7f898f';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);});
  const tileM=mat(0xffffff,{map:tileTex,roughness:.7});
  box(.03,FY-TT,NZ*TILE,fascia,X0+.015,(FY-TT)/2,Z0+NZ*TILE/2);
  box(NX*TILE,FY-TT,.03,fascia,X0+NX*TILE/2,(FY-TT)/2,Z0+.015);
  box(.03,FY-TT,1.75,fascia,RAMP[0]-.015,(FY-TT)/2,Z0+.875);
  const xEdge=i=>X0+i*TILE,zEdge=j=>Z0+j*TILE;
  // Corner sink under the AI rack: the front pedestals give most, so the rack tips forward, towards the visitor.
  const LOADED_X=[AI_X-.3,AI_X+.3];
  const cornerDrop=(x,z,L)=>{if(!LOADED_X.some(v=>Math.abs(v-x)<1e-3)||z<.05)return 0;return SINK*L*(z>1.2?1.35:z>.6?1:.45);};
  const overload=new THREE.Group();overload.name='overloaded-floor';root.add(overload);
  // Tiles: one mesh each; the two under the rack are split along the seam so they fold into a V.
  const tiles=[];
  for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++){
    const x0=xEdge(i),z0=zEdge(j),split=Math.abs(x0+.3-AI_X)<1e-3&&z0>.05;
    for(const [a,b] of split?[[x0,x0+.3],[x0+.3,x0+.6]]:[[x0,x0+.6]]){
      const o=box(b-a-.004,TT,TILE-.004,tileM,(a+b)/2,FY-TT/2,z0+.3);
      const T={o,a,b,z0,z1:z0+.6,split,seam:split?(a<x0+.1?'right':'left'):null,loaded:false};
      // Front row: yellow trim on the cut edge (child of the tile, so it moves with it).
      if(j===NZ-1){const tr=box(b-a-.004,TT*.7,.012,hazard,0,0,0);o.add(tr);tr.position.set(0,0,.3);}
      tiles.push(T);
    }
  }
  for(const T of tiles){const touches=[T.a,T.b].some(x=>LOADED_X.some(v=>Math.abs(v-x)<1e-3))&&T.z1>.05;if(touches||T.split){T.loaded=true;overload.add(T.o);}}
  // Cracks: canvas decals on the tiles beside the rack, anchored on the rack-side edge and growing away from it.
  const crackTex=canvasTex(256,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(28,30,32,.95)';g.lineCap='round';
    for(let b=0;b<5;b++){let x=0,y=h*(.15+.7*rnd(b,3));g.lineWidth=5-b*.6;g.beginPath();g.moveTo(x,y);
      for(let s=0;s<9;s++){x+=w*(.07+.06*rnd(b*9+s,4));y+=h*(rnd(b*9+s,5)-.5)*.32;g.lineTo(x,y);if(s===4&&b<3){g.stroke();g.lineWidth*=.55;g.beginPath();g.moveTo(x,y);}}g.stroke();}});
  const crackM=track(new THREE.MeshBasicMaterial({map:crackTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  const crackGeo=track(new THREE.PlaneGeometry(1,1));crackGeo.translate(.5,0,0);crackGeo.rotateX(-Math.PI/2);
  const cracks=[];
  for(const T of tiles){if(!T.loaded||T.split)continue;
    const fromLeft=LOADED_X.some(v=>Math.abs(v-T.a)<1e-3),side=fromLeft?1:LOADED_X.some(v=>Math.abs(v-T.b)<1e-3)?-1:0;if(!side)continue;
    const pivot=new THREE.Group();T.o.add(pivot);pivot.position.set(-side*(T.b-T.a)/2,TT/2+.002,(rnd(T.z0*7,6)-.5)*.2);pivot.rotation.y=side>0?0:Math.PI;
    const c=new THREE.Mesh(crackGeo,crackM);c.scale.set(.5,1,.42);c.castShadow=false;pivot.add(c);cracks.push({pivot,c,delay:rnd(T.z0*5+T.a,7)*.6,len:.42+rnd(T.a*3+T.z0,8)*.12});
  }
  // Pedestals: base plate, a two-segment tube (so a loaded one can bow at its middle), head plate.
  const unit=track(new THREE.CylinderGeometry(1,1,1,10));
  const up=new THREE.Vector3(0,1,0),va=new THREE.Vector3(),vb=new THREE.Vector3();
  const seg=(o,a,b,r)=>{va.fromArray(a);vb.fromArray(b);o.position.copy(va).add(vb).multiplyScalar(.5);const len=va.distanceTo(vb);o.scale.set(r,len,r);o.quaternion.setFromUnitVectors(up,vb.sub(va).normalize());};
  const pedestals=[];
  for(let i=0;i<=NX;i++)for(let j=0;j<=NZ;j++){
    const x=xEdge(i),z=zEdge(j);box(.11,.012,.11,pedM,x,.006,z);
    const lo=mesh(unit,pedM),hi=mesh(unit,pedM),head=box(.1,.014,.1,pedM,x,FY-TT-.007,z);
    const P={x,z,lo,hi,head,loaded:LOADED_X.some(v=>Math.abs(v-x)<1e-3)&&z>.05};
    seg(lo,[x,.012,z],[x,(FY-TT)/2,z],.018);seg(hi,[x,(FY-TT)/2,z],[x,FY-TT-.014,z],.018);
    if(P.loaded){overload.add(lo);overload.add(hi);overload.add(head);}pedestals.push(P);
  }

  // ---- Under-floor void: cable bundles and chilled-water pipes, already crowding every path ----
  // Left in their own colours in the structural view (sensorKeep), so the congestion reads next to the mask.
  const paths=new THREE.Group();paths.name='underfloor-paths';root.add(paths);
  const cableCols=[0x2f7fd8,0xe8c140,0xe0702a,0xd8443a,0x3fae5a,0x8a96a0,0x9b59d0];
  const cable=(pts,r,color)=>{const m=mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),48,r,6,false)),mat(color,{roughness:.6}));m.userData.sensorKeep=true;m.castShadow=false;paths.add(m);return m;};
  [[-1.25,.1],[-.6,.2],[.0,.08],[.55,.17],[1.05,.07]].forEach(([z,y],b)=>{
    for(let c=0;c<7;c++){const dz=(c%4-1.5)*.028,dy=Math.floor(c/4)*.03,pts=[];for(let s=0;s<=8;s++){const x=X0+.05+s*(RAMP[0]-X0-.1)/8;pts.push([x,y+dy+.03*Math.sin(s*1.3+b+c*.4),z+dz+.05*Math.sin(s*.9+b*2+c*.2)]);}
      cable(pts,.014,cableCols[(c+b)%cableCols.length]);}
  });
  for(const [x,col] of [[-2.05,0],[-1.15,3],[.15,5]])for(let c=0;c<5;c++){const dx=(c-2)*.03;cable([[x+dx,.33+c*.012,Z0+.05],[x+dx+.04,.3,-.4],[x+dx-.03,.26+c*.01,.5],[x+dx,.2+c*.015,1.22],[x+dx+.02,.06,1.5]],.012,cableCols[(col+c)%cableCols.length]);}
  for(const [z,col] of [[.33,0x3d7fb8],[.82,0xb84a3d]]){const p=bar([X0+.05,.36,z],[RAMP[0]-.05,.36,z],.055,mat(col,{roughness:.45,metalness:.3}));p.userData.sensorKeep=true;paths.add(p);
    for(let x=-2.8;x<.4;x+=1.2){const f=cylinder(.07,.03,steel,x,.36,z);f.rotation.z=Math.PI/2;f.userData.sensorKeep=true;paths.add(f);}}
  props.plate('RAISED ACCESS FLOOR',1.0,.16,{x:-2.5,y:FY+.003,z:1.0,rx:-Math.PI/2,bg:'#1d2a33',fg:'#d8f6ff'});
  const pathPlate=props.plate('CABLE & PIPE PATHS · CONGESTED',1.35,.17,{x:-2.05,y:.12,z:1.85,rx:-1.05,bg:'#0d2230',fg:'#22d6e8'});pathPlate.userData.sensorKeep=true;
  const limitPlate=props.plate('FLOOR LOADING · LIMIT EXCEEDED',1.35,.17,{x:-.25,y:.12,z:1.85,rx:-1.05,bg:'#c8322a',fg:'#ffffff'});

  // ---- Racks: ordinary racks on the floor, the AI rack (heavy, cyan LEDs, manifold hoses) on movers' skates ----
  const doorTex=canvasTex(64,128,(g,w,h)=>{g.fillStyle='#232d33';g.fillRect(0,0,w,h);g.fillStyle='#11181c';for(let y=6;y<h-6;y+=5)for(let x=5;x<w-5;x+=5)g.fillRect(x,y,2.4,2.4);});
  const doorM=mat(0xffffff,{map:doorTex,metalness:.4,roughness:.55});
  function rack(x,z,h){const g=new THREE.Group();g.position.set(x,FY,z);root.add(g);const add=o=>{g.add(o);return o;};
    add(box(.58,h,1.16,rackM,0,h/2,0));add(box(.54,h-.08,.01,doorM,0,h/2,.585));
    for(let i=0;i<3;i++)add(box(.025,.025,.01,greenLed,.2,h*.3+i*.35,.592)).castShadow=false;return g;}
  for(let i=0;i<5;i++)rack(xEdge(i)+.3,-1.1,2.0);
  for(const i of [1,2])rack(xEdge(i)+.3,RACK_Z,2.0);
  const ai=new THREE.Group();ai.name='ai-rack';root.add(ai);
  const body=new THREE.Group();ai.add(body);const addB=o=>{body.add(o);return o;};
  addB(box(.6,AI_H,1.18,aiM,0,AI_H/2,0));addB(box(.56,AI_H-.1,.01,doorM,0,AI_H/2,.595));
  addB(box(.62,.08,1.2,dark,0,.04,0));addB(box(.62,.06,1.2,dark,0,AI_H-.03,0));
  for(const x of [-.2,.2])addB(box(.03,AI_H-.3,.012,cyanLed,x,AI_H/2,.603)).castShadow=false;
  for(const [dx,c] of [[.2,0x3d7fb8],[.27,0xb84a3d]])addB(bar([dx,.1,-.62],[dx,AI_H+.12,-.62],.025,mat(c,{roughness:.45})));
  props.plate('AI RACK',.46,.11,{parent:body,x:0,y:AI_H-.17,z:.618,bg:'#0d2230',fg:'#22d6e8'});
  props.plate('2,000–5,000+ LBS',.56,.16,{parent:body,x:0,y:AI_H*.62,z:.618,bg:'#22d6e8',fg:'#061418'});
  const skates=new THREE.Group();ai.add(skates);
  for(const z of [-.42,.42]){const s=box(.5,SKATE*.6,.2,hazard,0,SKATE*.55,z);skates.add(s);for(const x of [-.18,.18]){const w=cylinder(.035,.08,dark,x,.035,z);w.rotation.x=Math.PI/2;skates.add(w);}}
  // Load arrow over the rack while it stands on the floor.
  const arrow=new THREE.Group();ai.add(arrow);
  const arrowM=mat(0xffb02e,{emissive:0xd77517,emissiveIntensity:.9});
  arrow.add(cylinder(.05,.45,arrowM,0,.38,0));const cone=mesh(track(new THREE.ConeGeometry(.13,.24,16)),arrowM,0,.06,0);cone.rotation.x=Math.PI;arrow.add(cone);
  arrow.traverse(o=>{o.castShadow=false;});

  // ---- Ramp and slab on grade (saw-cut joints) ----
  const rampLen=Math.hypot(RAMP[1]-RAMP[0],FY),rampA=Math.atan2(FY,RAMP[1]-RAMP[0]);
  const rp=box(rampLen,.035,1.3,mat(0x6f7a80,{metalness:.5,roughness:.5}),(RAMP[0]+RAMP[1])/2,FY/2-.02,RACK_Z);rp.rotation.z=-rampA;
  for(const s of [-1,1]){const e=box(rampLen,.04,.04,hazard,(RAMP[0]+RAMP[1])/2,FY/2,RACK_Z+s*.65);e.rotation.z=-rampA;}
  for(const x of [.75,1.15,1.5])for(const s of [-1,1])bar([x,0,RACK_Z+s*.6],[x,FY*(1-(x-RAMP[0])/(RAMP[1]-RAMP[0]))-.04,RACK_Z+s*.6],.02,steel);
  box(SLAB[1]-SLAB[0],SL,4.1,slabM,(SLAB[0]+SLAB[1])/2,SL/2,0);
  for(const z of [-1.0,0,1.0])box(SLAB[1]-SLAB[0],.004,.014,jointM,(SLAB[0]+SLAB[1])/2,SL+.002,z);
  box(.014,.004,4.1,jointM,PARK_X+.42,SL+.002,0);
  props.plate('SLAB ON GRADE',.9,.17,{x:PARK_X,y:SL+.004,z:1.72,rx:-Math.PI/2,bg:'#1d2a33',fg:'#d8f6ff'});
  const surfaceAt=x=>x<=RAMP[0]?FY:x>=RAMP[1]?SL:FY+(SL-FY)*(x-RAMP[0])/(RAMP[1]-RAMP[0]);

  // ---- Review: overhead tray and pipe routes over the slab, built in as the rack is set down ----
  const over=new THREE.Group();over.name='overhead-paths';root.add(over);
  const frames=new THREE.Group();over.add(frames);
  const PX=[2.05,3.2],BEAM=2.95;
  for(const z of [-1.5,-.2,1.45]){for(const x of PX){frames.add(bar([x,SL,z],[x,BEAM,z],.03,strutM));frames.add(box(.12,.012,.12,dark,x,SL+.006,z));}frames.add(box(PX[1]-PX[0]+.08,.06,.06,strutM,(PX[0]+PX[1])/2,BEAM,z));}
  const routes=new THREE.Group();over.add(routes);
  const TRAY_Y=2.72;
  for(const s of [-1,1])routes.add(box(.025,.08,3.5,trayM,PARK_X+s*.2,TRAY_Y,-.25));
  for(let z=-1.95;z<1.5;z+=.25)routes.add(box(.4,.015,.025,trayM,PARK_X,TRAY_Y-.03,z));
  for(let c=0;c<4;c++)routes.add(box(.05,.04,3.5,mat(cableCols[c],{roughness:.6}),PARK_X-.12+c*.08,TRAY_Y-.005,-.25));
  for(const [x,c] of [[2.98,0x3d7fb8],[3.08,0xb84a3d]])routes.add(bar([x,2.5,-2.0],[x,2.5,.3],.04,mat(c,{roughness:.45,metalness:.3})));
  for(const z of [-1.5,-.2])routes.add(box(.26,.03,.03,strutM,3.03,2.55,z));
  const drops=new THREE.Group();over.add(drops);
  const RTOP=SL+AI_H;
  drops.add(bar([PARK_X,TRAY_Y-.04,.95],[PARK_X,RTOP,.95],.05,mat(0x2a3338,{roughness:.6})));
  for(const [x,c] of [[2.98,0x3d7fb8],[3.08,0xb84a3d]]){const m=mat(c,{roughness:.45,metalness:.3});drops.add(bar([x,2.5,.3],[x,2.5,.05],.04,m));drops.add(bar([x,2.5,.05],[2.82,RTOP+.05,.05],.035,m));}
  const signPlate=props.plate('AI READY · STRUCTURE VALIDATED',1.1,.16,{x:(PX[0]+PX[1])/2,y:BEAM+.15,z:1.48,bg:'#22d6e8',fg:'#061418'});
  // Power runs amber along the tray; coolant cyan along the pipes (the AI-ready hall's convention).
  const tube=(pts,r,material)=>{const path=new THREE.CurvePath();for(let i=1;i<pts.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i-1]),new THREE.Vector3(...pts[i])));
    const m=mesh(track(new THREE.TubeGeometry(path,96,r,6,false)),material);m.castShadow=m.receiveShadow=false;return{m,len:path.getLength()};};
  const powerFlow=track(createFlowMaterial({speed:.5/4.4,repeat:3,base:[.12,.05,.0],glow:[2.6,1.3,.2]}));
  const power=tube([[PARK_X,TRAY_Y+.035,-2.0],[PARK_X,TRAY_Y+.035,.95],[PARK_X,TRAY_Y-.04,.95],[PARK_X,RTOP+.02,.95]],.03,powerFlow).m;over.add(power);
  const coolant=props.pulse([[2.98,2.5,-2.0],[2.98,2.5,.05],[2.82,RTOP+.05,.05]],{radius:.045,speed:.6,repeat:3});over.add(coolant.cable);over.add(coolant.line);coolant.cable.visible=false;

  // ---- People: a mover (pushes the rack up, later pulls it back down) and the structural engineer ----
  const mover=actors.person({vest:0xff7a1a,shirt:0x3a4d5e,name:'mover'});
  const eng=actors.person({vest:0x22d6e8,shirt:0x2b4b6b,helmet:0xf4f4f0,name:'engineer'});
  const tablet=new THREE.Group();eng.group.add(tablet);tablet.position.set(.02,1.12,.3);tablet.rotation.x=-.75;
  tablet.add(box(.3,.21,.02,dark,0,0,0));
  const tabCheck=props.plate('CHECKING…',.26,.17,{parent:tablet,x:0,y:0,z:.011,bg:'#0d2230',fg:'#d8f6ff'});
  const tabOk=props.plate('✓ SIGNED OFF',.26,.17,{parent:tablet,x:0,y:0,z:.012,bg:'#22d6e8',fg:'#061418'});
  const E_PATH=[[2.55,SL,1.95],[3.06,SL,.98]],E_FACE=.15;   // beside the rack, facing out over the slab towards the visitor
  const M_OFF=[[PARK_X+MOVER_DX,SL,RACK_Z],[3.02,SL,-.95]],M_T=[20.95,22.6];

  // ---- Overlay zones (invisible): the overloaded floor under the rack; the rack on its slab ----
  const zone=new THREE.Group();zone.name='floor-zone';root.add(zone);
  const zm=mesh(track(new THREE.BoxGeometry(1.2,.62,1.2)),mat(0xffffff),AI_X,.31,RACK_Z);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);
  const slabZone=new THREE.Group();slabZone.name='slab-zone';root.add(slabZone);
  const sm=mesh(track(new THREE.BoxGeometry(.8,AI_H+.1,1.3)),mat(0xffffff),PARK_X,(AI_H+.1)/2,RACK_Z);sm.visible=false;sm.castShadow=sm.receiveShadow=false;slabZone.add(sm);

  // ---- Structural view: a fixed virtual camera low in front of the cut-away ----
  const sensorCam=new THREE.PerspectiveCamera(40,1,.05,30);sensorCam.position.set(.2,1.4,3.5);sensorCam.lookAt(-.7,.34,.7);sensorCam.userData.portraitWidth=1.05;root.add(sensorCam);

  // Rack x over time, and its stride weight for the mover.
  function rackMotion(t){
    if(t<T_IN[0])return{x:PARK_X,w:0,dir:-1,d:0};
    if(t<T_OUT[0]){const u=(t-T_IN[0])/(T_IN[1]-T_IN[0]),e=ease5(u),d=Math.abs(AI_X-PARK_X)*e,v=u>0&&u<1?30*u*u*(1-u)*(1-u)/1.875:0;return{x:PARK_X+(AI_X-PARK_X)*e,w:Math.min(1,v*1.4),dir:-1,d};}
    const u=(t-T_OUT[0])/(T_OUT[1]-T_OUT[0]),e=ease5(u),v=u>0&&u<1?30*u*u*(1-u)*(1-u)/1.875:0;
    return{x:AI_X+(PARK_X-AI_X)*e,w:Math.min(1,v*1.4),dir:1,d:Math.abs(PARK_X-AI_X)*(1+e)};
  }
  // Floor height at a point: bilinear over the corner sinks of its tile (used for the rack and the mover).
  function floorDrop(x,z,L){const i=Math.max(0,Math.min(NX-1,Math.floor((x-X0)/TILE))),j=Math.max(0,Math.min(NZ-1,Math.floor((z-Z0)/TILE)));
    const x0=xEdge(i),z0=zEdge(j),u=(x-x0)/TILE,v=(z-z0)/TILE;
    return cornerDrop(x0,z0,L)*(1-u)*(1-v)+cornerDrop(x0+TILE,z0,L)*u*(1-v)+cornerDrop(x0,z0+TILE,L)*(1-u)*v+cornerDrop(x0+TILE,z0+TILE,L)*u*v;}
  const state={rackX:PARK_X,load:0,crack:0};

  function update(t,ctx){
    const R=rackMotion(t);
    const L=smooth(LOAD[0],LOAD[1],t)*(t<T_OUT[0]?1:1-.6*smooth(AI_X+.05,AI_X+.7,R.x));   // pedestals stay partly bent after it leaves
    const C=smooth(CRACK[0],CRACK[1],t);state.rackX=R.x;state.load=L;state.crack=C;
    // Tiles: corner drops -> centre drop and tilt; split tiles add the V at their seam.
    for(const T of tiles){if(!T.loaded)continue;
      let dL=(cornerDrop(T.a,T.z0,L)+cornerDrop(T.a,T.z1,L))/2,dR=(cornerDrop(T.b,T.z0,L)+cornerDrop(T.b,T.z1,L))/2;
      const dB=(cornerDrop(T.a,T.z0,L)+cornerDrop(T.b,T.z0,L))/2,dF=(cornerDrop(T.a,T.z1,L)+cornerDrop(T.b,T.z1,L))/2;
      if(T.split){const vee=VEE*L;if(T.seam==='right')dR+=vee;else dL+=vee;}
      const w=T.b-T.a;T.o.position.y=FY-TT/2-(dL+dR)/2;T.o.rotation.set((dF-dB)/TILE,0,(dL-dR)/w);
    }
    // Pedestals: a loaded one shortens and kinks forward at its middle.
    for(const P of pedestals){if(!P.loaded)continue;const d=cornerDrop(P.x,P.z,L),top=FY-TT-.014-d,bow=d*1.3;
      const knee=[P.x+(P.x<AI_X?-1:1)*bow*.35,top*.5,P.z+bow];seg(P.lo,[P.x,.012,P.z],knee,.018);seg(P.hi,knee,[P.x,top,P.z],.018);P.head.position.y=top+.007;}
    for(const c of cracks){const g=smooth(0,1,(C*1.4-c.delay*.4));c.c.visible=g>.01;c.c.scale.x=c.len*Math.max(.01,g);}
    // AI rack: rides the floor, ramp and slab; on the floor it sinks and tips forward with the load.
    const yl=surfaceAt(R.x-.3),yr=surfaceAt(R.x+.3);let y=(yl+yr)/2,rz=Math.atan2(yr-yl,.6),rx=0;
    if(R.x<RAMP[0]-.25){y-=floorDrop(R.x,RACK_Z,L);rx=(cornerDrop(AI_X-.3,1.3,L)-cornerDrop(AI_X-.3,.1,L))/1.2*.9;rz+=-.015*L;}
    ai.position.set(R.x,y,RACK_Z);ai.rotation.set(rx,0,rz);
    const set=smooth(T_SET[0],T_SET[1],t);body.position.y=SKATE*(1-set);skates.visible=set<.98;skates.scale.y=1-set*.5;
    const arrowOn=smooth(7.7,8.2,t)*(1-smooth(T_OUT[0]-.4,T_OUT[0],t));arrow.visible=arrowOn>.01;arrow.scale.setScalar(Math.max(.01,arrowOn));
    arrow.position.y=AI_H+SKATE+.42-.09*Math.abs(Math.sin(t*3.2))*smooth(8,9,t);
    limitPlate.visible=t>=9.3&&t<T_OUT[0];pathPlate.visible=t>=10&&t<T_OUT[1];
    // Mover: behind the rack (+x) pushing it up; turns at review and walks ahead, pulling it back down.
    const mx=R.x+MOVER_DX,turnU=smooth(16.55,16.95,t),dir=t<16.5?-1:1;
    mover.group.position.set(mx,mx<RAMP[0]?FY-floorDrop(mx,RACK_Z,L):surfaceAt(mx),RACK_Z);
    mover.group.rotation.y=-Math.PI/2+Math.PI*turnU;
    const pushing=t<T_OUT[0]?smooth(T_IN[0]-.3,T_IN[0],t)*(1-smooth(T_IN[1]+.2,T_IN[1]+.8,t)):smooth(T_OUT[0]-.3,T_OUT[0],t)*(1-smooth(T_OUT[1],T_OUT[1]+.6,t));
    if(t<M_T[0]-.35)mover.pose({distance:R.d,weight:R.w,lean:.22*pushing*(dir<0?1:.4),point:pushing,pointPitch:1.35,look:.05});
    else{// Rack set down: the mover turns and walks off behind it, clearing the shot for the sign-off.
      const f=actors.followPath(mover.group,M_OFF,M_T[0],M_T[1],t),u=smooth(M_T[0]-.35,M_T[0],t);
      mover.group.rotation.y=Math.PI/2+Math.atan2(Math.sin(f.heading-Math.PI/2),Math.cos(f.heading-Math.PI/2))*u;
      mover.pose({distance:f.distance,weight:f.moving?f.weight:0,look:.05});}
    // Overhead routes over the slab: frames rise, the tray and pipes run forward, the drops connect, then power flows.
    const fr=smooth(T_FRAMES[0],T_FRAMES[1],t);frames.visible=fr>.01;frames.scale.y=Math.max(.01,fr);
    const tr=smooth(T_TRAY[0],T_TRAY[1],t);routes.visible=tr>.01;routes.scale.z=Math.max(.01,tr);routes.position.z=-2*(1-Math.max(.01,tr));
    drops.visible=t>=T_DROPS[0];drops.scale.y=1;drops.children.forEach(o=>{o.visible=t>=T_DROPS[0]+.25*drops.children.indexOf(o)/drops.children.length;});
    const flowing=t>=T_POWER;power.visible=flowing;powerFlow.uniforms.uTime.value=t;coolant.cable.visible=false;coolant.update(t,flowing);
    signPlate.visible=t>=T_SIGN+.3;
    // Engineer: walks in along the front of the slab, faces the rack, checks the tablet and signs off.
    const shown=t>=E_T0-.1;eng.group.visible=shown;
    if(shown){const f=actors.followPath(eng.group,E_PATH,E_T0,E_T1,t);
      if(f.done){const turn=smooth(E_T1,E_T1+.7,t);eng.group.rotation.y=f.heading+Math.atan2(Math.sin(E_FACE-f.heading),Math.cos(E_FACE-f.heading))*turn;}
      const settle=f.done?smooth(E_T1+.2,E_T1+1,t):0;
      eng.pose({distance:f.distance,weight:f.moving?f.weight:0,look:.45*settle-.2*smooth(T_SIGN-.6,T_SIGN,t)*settle,lean:.06*settle});
      tabCheck.visible=t<T_SIGN;tabOk.visible=t>=T_SIGN;}
  }
  return{anchors:{floor:zone,slab:slabZone,rack:ai},
    sensors:{'structural-view':{camera:sensorCam,mode:'mask',targets:[overload],label:'Structural view'}},update,
    metrics:()=>({...state,engineerVisible:eng.group.visible,mover:mover.group.position.toArray()})};
}
