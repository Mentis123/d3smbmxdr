// M3 "See around the loading-bay corner": the workshop yard. A shipping container stands in the corner between the
// loader route (down the right lane, round the container, along the front lane) and the painted walkway out of the
// workshop. Neither the loader operator nor the worker can see round the container; a fixed camera on a pole by the
// workshop sees both once they are in the painted review zone. Barriers, rails and bollards stay in place: the
// advisory adds awareness, it does not replace them. Everything is a function of t (and the variation).
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

// Layout (stage metres; x across the plinth, z towards the viewer).
// The container sits back right and the workshop back left, so the fitted home view (from the front right) sees the
// loader, the walkway and the workshop without the container hiding any of them.
const CONT={x0:-.2,x1:1.8,z0:-2.02,z1:.1,h:2.45};                 // the container that makes the blind corner
const SHED={x0:-3.38,x1:-.32,z0:-2.05,z1:-.75,h:2.9};             // workshop, open front facing the yard
const WALK={x0:-1.1,x1:-.5,cx:-.8};                               // painted walkway out of the workshop
const LANE={z0:.3,z1:1.6,cz:.95,lx:2.65};                         // front lane (along x) and right lane centre
const RAIL_Z=1.72;                                                // footpath rail along the front of the lane
const ZONE={x0:-1.6,x1:1.85,z0:-.72,z1:1.62,h:1.95};              // painted review zone at the corner
const STOP_X=.05;                                                 // painted stop line on the front lane
const POLE=[-3.2,-.34],POLE_H=5.3,LENS=[-2.4,5.2,.12];        // yard camera pole in front of the workshop

// Loader route: right lane, a quarter turn round the container corner, front lane (travelling towards -x).
const ARC_S=1.85;                                                 // straight run down the right lane before the turn
const ROUTE=(()=>{const p=[[LANE.lx,-.05-ARC_S],[LANE.lx,-.05]];for(let i=1;i<=24;i++){const f=Math.PI-i/24*Math.PI/2;p.push([1.65-Math.cos(f),-.05+Math.sin(f)]);}p.push([-2.6,LANE.cz]);
  const cum=[0];for(let i=1;i<p.length;i++)cum.push(cum[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return{p,cum,len:cum[cum.length-1]};})();
function routeAt(s){
  s=Math.min(ROUTE.len,Math.max(0,s));let i=1;while(i<ROUTE.cum.length-1&&ROUTE.cum[i]<s)i++;
  const a=ROUTE.p[i-1],b=ROUTE.p[i],f=(s-ROUTE.cum[i-1])/Math.max(1e-9,ROUTE.cum[i]-ROUTE.cum[i-1]);return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
}
const LOADER_FRONT=1.33,LOADER_REAR=.98;                          // bucket lip and counterweight from the loader centre
const S_HOLD=ARC_S+Math.PI/2+(1.65-STOP_X-LOADER_FRONT-.07);          // bucket stops just short of the stop line
const S_END=S_HOLD+3.52;
// Distance along the route against time: monotone cubic through keyframes, at rest at both ends of each stop.
// Down the right lane behind the container (blind corner, Change) -> round the corner while the camera sees both
// (AI view) -> operator holds at the stop line after the advisory -> waits -> proceeds once the worker is clear.
const T_HOLD=17.4,T_GO=22.0;
const KEYS=[[0,0],[.6,0],[4,.55],[9.6,1.62],[12.8,2.8],[15.4,S_HOLD-.2],[T_HOLD,S_HOLD],[T_GO,S_HOLD],[25.8,S_END]];
const TAN=(()=>{const n=KEYS.length,d=[],m=new Array(n).fill(0);for(let i=0;i<n-1;i++)d.push((KEYS[i+1][1]-KEYS[i][1])/(KEYS[i+1][0]-KEYS[i][0]));
  for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
  for(let i=0;i<n-1;i++){if(d[i]===0){m[i]=m[i+1]=0;continue;}const a=m[i]/d[i],b=m[i+1]/d[i],h=Math.hypot(a,b);if(h>3){m[i]=3*a/h*d[i];m[i+1]=3*b/h*d[i];}}return m;})();
function loaderS(t){
  if(t<=KEYS[0][0])return KEYS[0][1];const n=KEYS.length;if(t>=KEYS[n-1][0])return KEYS[n-1][1];
  let i=0;while(t>KEYS[i+1][0])i++;const [t0,s0]=KEYS[i],[t1,s1]=KEYS[i+1],h=t1-t0,u=(t-t0)/h,u2=u*u,u3=u2*u;
  return(2*u3-3*u2+1)*s0+(u3-2*u2+u)*h*TAN[i]+(-2*u3+3*u2)*s1+(u3-u2)*h*TAN[i+1];
}
// Worker: talks by the bench, walks out along the walkway to the kerb, waits, crosses once the loader holds,
// and steps through the rail gap onto the footpath.
// The kerb is level with the container's front face, so the container stands between her and the loader's lane.
const W_START=[-1.32,0,-1.42],W_KERB=[WALK.cx,0,0],W_END=[.75,0,1.93];
const W_OUT=[W_START,[WALK.cx,0,-1.2],W_KERB],W_T0=4.6,W_T1=7.9;
const W_CROSS=[W_KERB,[WALK.cx,0,1.93],W_END],W_C0=18.1,W_C1=21.6;
const SUP=[-1.95,0,-1.05],SUP_FACE=.7,T_ADVISE=16.25;
const T_SIGHT0=5.4,T_SIGHT1=10.0;                                 // sight-line wedges shown during the Change

export function buildKit(k){
  const {THREE,root,box,cylinder,bar,mesh,mat,steel,dark,track,props,actors}=k;
  const asphalt=mat(0x30363a,{roughness:.96}),paintY=mat(0xf2c230,{roughness:.6}),paintW=mat(0xe9edee,{roughness:.6});
  const walkPaint=mat(0x3d8a58,{roughness:.8}),zonePaint=mat(0xffa21a,{roughness:.55,emissive:0x5a3000,emissiveIntensity:.35});
  const railMat=mat(0xf0b323,{roughness:.5,metalness:.2}),blackBand=mat(0x15191c,{roughness:.6});
  const flat=(w,d,m,x,z,y=.012,h=.004)=>{const o=box(w,h,d,m,x,y,z);o.castShadow=false;return o;};
  const groundText=(text,w,h,x,z,rz=0,y=.017,opts={})=>{const p=props.plate(text,w,h,{x,y,z,...opts});p.rotation.set(-Math.PI/2,0,rz);return p;};

  // ---- Yard surface: lanes, walkway, crossing, stop line, review zone ----
  flat(1.32,3.0,asphalt,LANE.lx,-.55,.005,.01);                                          // left lane
  flat(6.75,LANE.z1-LANE.z0,asphalt,0,LANE.cz,.005,.01);                                 // front lane
  for(const x of [LANE.lx-.62,LANE.lx+.62])flat(.04,2.0,paintY,x,-1.0);                  // lane edge lines
  for(const z of [LANE.z0+.04,LANE.z1-.04]){const x1=z<LANE.cz?CONT.x1:3.3;flat(WALK.x0-.06+3.3,.04,paintY,(WALK.x0-.06-3.3)/2,z);flat(x1-WALK.x1-.06,.04,paintY,(WALK.x1+.06+x1)/2,z);}
  flat(WALK.x1-WALK.x0,LANE.z0+.75,walkPaint,WALK.cx,(-.75+LANE.z0)/2);            // walkway from the workshop mouth
  for(const x of [WALK.x0+.03,WALK.x1-.03])flat(.04,LANE.z0+.75,paintW,x,(-.75+LANE.z0)/2,.013);
  for(let z=LANE.z0+.1;z<LANE.z1-.05;z+=.22)flat(WALK.x1-WALK.x0,.11,paintW,WALK.cx,z,.013); // zebra crossing
  flat(.1,LANE.z1-LANE.z0-.1,paintW,STOP_X,LANE.cz,.013);                                // stop line
  groundText('STOP',.56,.2,STOP_X+.36,LANE.cz,Math.PI/2,.018,{bg:'#30363a',fg:'#e9edee'});
  groundText('WALKWAY',.5,.13,WALK.cx,-.3,0,.018,{bg:'#3d8a58',fg:'#f2f6f2'});
  // Review zone: an amber outline with corner hatching, painted on the ground.
  const zw=ZONE.x1-ZONE.x0,zd=ZONE.z1-ZONE.z0,zcx=(ZONE.x0+ZONE.x1)/2,zcz=(ZONE.z0+ZONE.z1)/2;
  // The painted zone keeps its colour in the camera view: it is the rule's boundary, not a detection.
  const keep=o=>{o.userData.sensorKeep=true;return o;};
  for(const z of [ZONE.z0,ZONE.z1])for(let x=ZONE.x0;x<ZONE.x1-.05;x+=.3)keep(flat(Math.min(.2,ZONE.x1-x),.06,zonePaint,x+.1,z,.015));
  for(const x of [ZONE.x0,ZONE.x1])for(let z=ZONE.z0;z<ZONE.z1-.05;z+=.3)keep(flat(.06,Math.min(.2,ZONE.z1-z),zonePaint,x,z+.1,.015));
  groundText('REVIEW ZONE',.9,.17,ZONE.x1-.62,ZONE.z1-.2,0,.019,{bg:'#30363a',fg:'#ffb02e'});

  // ---- Container (stores) standing in the corner ----
  const steelRed=mat(0x9a3a2b,{roughness:.6,metalness:.35}),steelRedDark=mat(0x7a2c21,{roughness:.6,metalness:.35});
  const cw=CONT.x1-CONT.x0,cd=CONT.z1-CONT.z0,ccx=(CONT.x0+CONT.x1)/2,ccz=(CONT.z0+CONT.z1)/2;
  const container=new THREE.Group();container.name='container';root.add(container);
  const cAdd=o=>{container.add(o);return o;};
  cAdd(box(cw,CONT.h-.1,cd,steelRed,ccx,CONT.h/2+.02,ccz));
  for(let z=CONT.z0+.12;z<CONT.z1-.05;z+=.16)for(const x of [CONT.x0-.012,CONT.x1+.012])cAdd(box(.025,CONT.h-.3,.07,steelRedDark,x,CONT.h/2+.02,z));   // corrugation
  for(let x=CONT.x0+.12;x<CONT.x1-.05;x+=.16)cAdd(box(.07,CONT.h-.3,.025,steelRedDark,x,CONT.h/2+.02,CONT.z0-.012));
  for(const y of [.06,CONT.h-.02])cAdd(box(cw+.06,.1,cd+.06,steelRedDark,ccx,y,ccz));                          // rails
  for(const [x,z] of [[CONT.x0,CONT.z0],[CONT.x0,CONT.z1],[CONT.x1,CONT.z0],[CONT.x1,CONT.z1]])cAdd(box(.1,CONT.h,.1,steelRedDark,x,CONT.h/2,z));
  for(const x of [1.38,.95,.45,.05])cAdd(bar([x,.25,CONT.z1+.03],[x,CONT.h-.25,CONT.z1+.03],.018,steel));   // door locking bars
  cAdd(box(.02,CONT.h-.3,.02,dark,(CONT.x0+CONT.x1)/2,CONT.h/2,CONT.z1+.02));
  props.plate('STORES',.7,.2,{x:ccx,y:1.75,z:CONT.z1+.06});
  props.plate('STORES',.7,.2,{x:CONT.x1+.03,y:1.75,z:-1.0,ry:Math.PI/2});
  // Bollards protect the container corner the loader turns round.
  for(const [x,z] of [[CONT.x1+.06,CONT.z1+.12],[CONT.x1-.3,CONT.z1+.14]]){cylinder(.07,.9,railMat,x,.45,z);for(const y of [.55,.75])cylinder(.073,.06,blackBand,x,y,z);}

  // ---- Workshop: open-fronted shed with the site GPU inside ----
  const clad=mat(0x5f7f8c,{roughness:.6,metalness:.35}),cladDark=mat(0x4a6874,{roughness:.6,metalness:.35}),trim=mat(0x2d3f48,{metalness:.5,roughness:.45});
  const sw=SHED.x1-SHED.x0,scx=(SHED.x0+SHED.x1)/2,sd=SHED.z1-SHED.z0,scz=(SHED.z0+SHED.z1)/2;
  box(sw,.03,sd,mat(0xc7cdcf,{roughness:.9}),scx,.015,scz);
  box(sw,SHED.h,.08,clad,scx,SHED.h/2,SHED.z0);
  for(let x=SHED.x0+.15;x<SHED.x1;x+=.2)box(.04,SHED.h-.1,.03,cladDark,x,SHED.h/2,SHED.z0+.05);
  for(const x of [SHED.x0,SHED.x1]){box(.08,SHED.h,sd,clad,x,SHED.h/2,scz);for(let z=SHED.z0+.15;z<SHED.z1;z+=.2)box(.03,SHED.h-.1,.04,cladDark,x+(x===SHED.x0?.05:-.05),SHED.h/2,z);}
  box(sw+.1,.32,.14,trim,scx,SHED.h-.16,SHED.z1);                                            // bay header
  box(sw+.1,.06,.7,trim,scx,SHED.h+.03,SHED.z0+.3);                                          // roof edge (cut away)
  for(const x of [-.9,-1.6,-2.3,-3.0])bar([x,SHED.h-.02,SHED.z0+.05],[x,SHED.h-.02,SHED.z1],.025,steel);  // purlins over the open bay
  props.plate('WORKSHOP',1.2,.26,{x:-2.25,y:SHED.h-.16,z:SHED.z1+.08});
  // Bench and tool board along the back wall.
  box(.9,.08,.45,trim,-1.15,.86,-1.8);for(const x of [-.75,-1.55])box(.06,.82,.4,trim,x,.41,-1.8);
  box(.8,.5,.03,mat(0x9aa7ad),-1.15,1.45,-2.0);
  const cabinet=props.siteCabinet(-2.72,-1.76,{label:'SITE GPU'});
  // Wireless access point on the back wall: how the advisory reaches the supervisor's device.
  const ap=box(.2,.09,.06,mat(0xe9eef0,{roughness:.4}),-2.3,2.25,-1.98);
  for(const x of [-2.23,-2.37])bar([x,2.29,-1.98],[x,2.45,-1.96],.008,dark);
  const apLed=mat(0x47e3a6,{emissive:0x1fbf84,emissiveIntensity:.4});box(.03,.015,.01,apLed,-2.3,2.24,-1.948).castShadow=false;

  // ---- Barriers: pedestrian rails along the walkway and the footpath, open only at the crossing ----
  function rail(a,b){const n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/.55));
    for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;bar([x,0,z],[x,1.05,z],.025,railMat);box(.1,.02,.1,dark,x,.01,z);}
    for(const y of [.55,1.02])bar([a[0],y,a[1]],[b[0],y,b[1]],.02,railMat);}
  rail([WALK.x0-.04,-.7],[WALK.x0-.04,LANE.z0-.06]);rail([WALK.x1+.04,-.7],[WALK.x1+.04,LANE.z0-.06]);
  rail([-3.3,RAIL_Z],[WALK.x0-.04,RAIL_Z]);rail([WALK.x1+.04,RAIL_Z],[3.3,RAIL_Z]);
  props.plate('LOOK BOTH WAYS',.62,.12,{x:WALK.cx,y:1.18,z:LANE.z0-.08,bg:'#e9edee',fg:'#15191c'});

  // ---- Yard camera on a pole (the sensor), cable to the site GPU, link to the access point ----
  bar([POLE[0],0,POLE[1]],[POLE[0],POLE_H,POLE[1]],.06,steel);box(.3,.05,.3,dark,POLE[0],.025,POLE[1]);
  bar([POLE[0],POLE_H-.07,POLE[1]],[LENS[0]-.06,LENS[1]+.03,LENS[2]-.05],.035,steel);
  // Sign faces the fitted home view (angle .55) and sits at eye height on the pole, clear of the rails.
  props.plate('YARD CAMERA',.95,.22,{x:POLE[0]+.07*Math.sin(.55),y:2.35,z:POLE[1]+.07*Math.cos(.55),ry:.55});
  const lens=new THREE.Vector3(...LENS),look=new THREE.Vector3(1.05,0,1.3);
  const housing=new THREE.Group();housing.position.copy(lens);housing.lookAt(look);root.add(housing);
  const camBody=mat(0xdfe4e7,{roughness:.4,metalness:.2});
  const hb=box(.26,.24,.52,camBody,0,0,0);housing.add(hb);
  const hood=box(.32,.03,.62,mat(0xf4f6f7,{roughness:.35}),0,0,0);housing.add(hood);hood.position.set(0,.14,.07);
  const ring=cylinder(.095,.05,mat(0x2a3238,{metalness:.5,roughness:.35}),0,0,0);housing.add(ring);ring.rotation.x=Math.PI/2;ring.position.set(0,0,.28);
  const glass=cylinder(.072,.02,mat(0x0a1720,{metalness:.8,roughness:.08}),0,0,0);housing.add(glass);glass.rotation.x=Math.PI/2;glass.position.set(0,0,.3);
  const camLed=mat(0x47e3a6,{emissive:0x1fbf84,emissiveIntensity:.6});const cl=box(.04,.03,.01,camLed,0,0,0);housing.add(cl);cl.position.set(.08,-.07,.262);cl.castShadow=false;
  const sensorCam=new THREE.PerspectiveCamera(60,1,.05,30);sensorCam.userData.portraitWidth=.92;sensorCam.position.copy(lens).add(new THREE.Vector3().subVectors(look,lens).normalize().multiplyScalar(.42));sensorCam.lookAt(look);root.add(sensorCam);
  const port=cabinet.port();
  const camPulse=props.pulse([[LENS[0]-.06,LENS[1]+.03,LENS[2]-.05],[POLE[0],POLE_H-.07,POLE[1]-.07],[POLE[0],.035,POLE[1]-.07],[POLE[0],.035,-1.3],[port[0],.035,-1.3],[port[0],.035,port[2]],port],{radius:.03});
  const apPulse=props.pulse([[-2.72,1.12,-1.94],[-2.72,2.25,-1.97],[-2.42,2.25,-1.95]],{repeat:2});

  // ---- Loader: compact wheel loader carrying a bucket of stock ----
  const loader=new THREE.Group();loader.name='loader';root.add(loader);
  const lAdd=(o,x,y,z)=>{loader.add(o);o.position.set(x,y,z);return o;};
  const paint=mat(0xf2b51f,{roughness:.45,metalness:.25}),paintDark=mat(0xc78712,{roughness:.5,metalness:.3}),rubber=mat(0x1b1e1f,{roughness:.95});
  const glassMat=mat(0x2c4a5c,{metalness:.3,roughness:.15,transparent:true,opacity:.42});
  lAdd(box(.86,.5,1.0,paint,0,0,0),0,.62,-.5);                          // rear frame and engine
  lAdd(box(.8,.12,.9,paintDark,0,0,0),0,.92,-.55);                      // engine hood
  lAdd(box(.9,.32,.16,paintDark,0,0,0),0,.55,-LOADER_REAR+.08);         // counterweight
  for(const x of [-.25,-.1,.05,.2])lAdd(box(.08,.2,.01,dark,0,0,0),x,.7,-LOADER_REAR);   // grille
  lAdd(box(.72,.36,.78,paint,0,0,0),0,.55,.42);                          // front frame
  // Cab: corner posts, roof and tinted panes so the operator stays visible.
  for(const [x,z] of [[-.38,-.42],[.38,-.42],[-.38,.2],[.38,.2]])lAdd(box(.05,.8,.05,dark,0,0,0),x,1.4,z);
  lAdd(box(.92,.07,.78,paint,0,0,0),0,1.83,-.11);
  for(const [w,d,x,z] of [[.74,.02,0,.21],[.74,.02,0,-.43],[.02,.6,-.39,-.11],[.02,.6,.39,-.11]])lAdd(box(w,.66,d,glassMat,0,0,0),x,1.38,z).castShadow=false;
  lAdd(box(.86,.06,.7,dark,0,0,0),0,1.0,-.11);                           // cab floor
  // Advisory lamp on the cab roof: dark until the advisory reaches the cab, amber while the operator holds.
  const beaconMat=mat(0x6b5a3a,{emissive:0xff7a00,emissiveIntensity:0});
  lAdd(cylinder(.1,.04,dark,0,0,0),0,1.885,-.11).castShadow=false;lAdd(cylinder(.085,.16,beaconMat,0,0,0),0,1.98,-.11).castShadow=false;
  const displayMat=mat(0x1a2a33,{emissive:0x000000,emissiveIntensity:1});lAdd(box(.26,.17,.02,displayMat,0,0,0),.18,1.3,.12).castShadow=false;
  // Operator, seated.
  const opVest=mat(0xff7a1a,{emissive:0xff7a1a,emissiveIntensity:.1,roughness:.7}),skin=mat(0xd6a27e,{roughness:.8}),hat=mat(0xf4f4f0,{roughness:.4});
  lAdd(box(.34,.42,.22,opVest,0,0,0),0,1.3,-.2);lAdd(box(.3,.14,.36,mat(0x1f2a36),0,0,0),0,1.1,-.08);
  const opHead=new THREE.Group();lAdd(opHead,0,1.6,-.18);
  const oh=mesh(new THREE.SphereGeometry(.1,12,8),skin);opHead.add(oh);oh.position.set(0,0,0);
  const ohat=mesh(new THREE.SphereGeometry(.115,12,6,0,Math.PI*2,0,Math.PI/2),hat);opHead.add(ohat);ohat.position.set(0,.04,0);
  // Lift arms and bucket with a load of stock.
  const arms=new THREE.Group();lAdd(arms,0,.95,.1);
  for(const x of [-.34,.34]){const a=bar([0,0,0],[0,-.48,.92],.055,paintDark);arms.add(a);a.position.x=x;}
  const bucket=new THREE.Group();lAdd(bucket,0,.36,1.12);
  const bk=mat(0x5d6468,{metalness:.5,roughness:.5});
  for(const o of [box(1.24,.05,.42,bk,0,-.18,0),box(1.24,.4,.05,bk,0,0,-.2),box(.05,.4,.42,bk,-.6,0,0),box(.05,.4,.42,bk,.6,0,0)])bucket.add(o);
  bucket.add(box(1.26,.04,.06,paintDark,0,-.2,.22));
  const loadGeo=new THREE.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI/2);const heap=mesh(loadGeo,mat(0x8a7a62,{roughness:1}));bucket.add(heap);heap.position.set(0,-.12,0);heap.scale.set(.56,.3,.2);
  // Wheels: tyres with lugs so the roll reads; spin follows distance travelled.
  const R=.33,tyreGeo=track(new THREE.CylinderGeometry(R,R,.24,20));tyreGeo.rotateZ(Math.PI/2);const hubGeo=track(new THREE.CylinderGeometry(.16,.16,.25,12));hubGeo.rotateZ(Math.PI/2);
  const wheels=[];
  for(const z of [-.55,.55])for(const x of [-.5,.5]){
    const w=new THREE.Group();lAdd(w,x,R,z);const ty=mesh(tyreGeo,rubber);w.add(ty);ty.position.set(0,0,0);const hb2=mesh(hubGeo,paint);w.add(hb2);hb2.position.set(0,0,0);
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2,l=box(.26,.05,.07,dark,0,0,0);w.add(l);l.position.set(0,Math.cos(a)*(R-.005),Math.sin(a)*(R-.005));l.rotation.x=a;}
    wheels.push(w);}
  for(const s of [-1,1]){const p=props.plate('LOADER 2',.5,.14,{parent:loader,x:s*.44,y:.72,z:-.45,ry:s*Math.PI/2});p.position.set(s*.435,.72,-.45);}

  // ---- People ----
  const worker=actors.person({vest:0x2fd27a,shirt:0x3b4f63,name:'worker'});
  const supervisor=actors.person({vest:0xff7a1a,shirt:0x24394f,helmet:0xffffff,name:'supervisor'});
  supervisor.group.position.set(...SUP);supervisor.group.rotation.y=SUP_FACE;
  // A large tablet held in the left hand (the right arm is free to signal the operator).
  const tabletScreen=mat(0x1a2a33,{emissive:0x000000,emissiveIntensity:1,toneMapped:false});
  const tablet=new THREE.Group();supervisor.group.add(tablet);
  const tb=box(.46,.32,.03,dark,0,0,0);tablet.add(tb);tb.position.set(0,0,0);
  const ts=box(.42,.28,.006,tabletScreen,0,0,0);tablet.add(ts);ts.position.set(0,0,.018);ts.castShadow=false;

  // ---- Variation: a stack of totes left beside the walkway hides it from the camera ----
  const totes=new THREE.Group();totes.name='totes';root.add(totes);
  const toteTank=mat(0xe8e6dc,{roughness:.55}),cage=mat(0x9aa4a8,{metalness:.6,roughness:.4}),pallet=mat(0x8a6a44,{roughness:.9});
  for(let i=0;i<2;i++){const y=i*1.3,tx=-1.55,tz=-.22;
    totes.add(box(.84,.14,.9,pallet,tx,y+.07,tz));totes.add(box(.74,1.05,.8,toteTank,tx,y+.665,tz));
    for(const [dx,dz] of [[-.4,-.43],[.4,-.43],[-.4,.43],[.4,.43]])totes.add(box(.03,1.14,.03,cage,tx+dx,y+.71,tz+dz));
    for(const yy of [.45,.88,1.26])for(const s of [-1,1]){totes.add(box(.83,.025,.025,cage,tx,y+yy,tz+s*.43));totes.add(box(.025,.025,.89,cage,tx+s*.4,y+yy,tz));}}
  for(let i=0;i<3;i++)totes.add(box(.84,.12,.9,pallet,-1.55,2.66+i*.15,-.22));                  // empty pallets on top

  // ---- Sight lines (Change only): what the operator and the worker could see, each stopped by the container ----
  // A flat wedge at eye height from each eye towards the other, cut off at the container face it runs into, with a
  // dark bar painted on that face where the view ends. Rebuilt every frame from the two eye positions.
  function wedge(colour){
    const g=track(new THREE.BufferGeometry());g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(9),3));
    const m=track(new THREE.MeshBasicMaterial({color:colour,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,depthTest:false,toneMapped:false}));
    const o=mesh(g,m);o.castShadow=o.receiveShadow=false;o.frustumCulled=false;o.renderOrder=30;o.userData.noFit=true;o.visible=false;
    const endM=track(new THREE.MeshBasicMaterial({color:colour,transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false}));
    const end=mesh(track(new THREE.BoxGeometry(1,1,1)),endM);end.castShadow=end.receiveShadow=false;end.renderOrder=31;end.userData.noFit=true;end.visible=false;
    return{o,m,g,end,endM};
  }
  const sightOp=wedge(0x7fd4ff),sightW=wedge(0x3ff08a);
  const HALF=.38;
  function aim(w,from,to,faceX,alpha){
    const dx=to.x-from.x,dz=to.z-from.z,base=Math.atan2(dz,dx),pos=w.g.attributes.position.array,y=from.y;
    pos[0]=from.x;pos[1]=y;pos[2]=from.z;let zs=[];
    for(const [i,da] of [[1,-HALF],[2,HALF]]){const a=base+da,cx=Math.cos(a),cz=Math.sin(a),u=(faceX-from.x)/cx;const z=from.z+u*cz;zs.push(z);pos[i*3]=faceX;pos[i*3+1]=y;pos[i*3+2]=z;}
    w.g.attributes.position.needsUpdate=true;w.g.computeBoundingSphere();
    const show=alpha>.01;w.o.visible=w.end.visible=show;w.m.opacity=.55*alpha;w.endM.opacity=.95*alpha;
    const z0=Math.max(CONT.z0,Math.min(...zs)),z1=Math.min(CONT.z1,Math.max(...zs));
    w.end.position.set(faceX+(faceX>ccx?.03:-.03),y,(z0+z1)/2);w.end.scale.set(.05,.9,Math.max(.05,z1-z0));
  }

  // ---- Overlay anchors (invisible boxes) ----
  // zone: the painted review zone. pair: the worker plus the loader's front half, re-sized every frame, so the AI-view
  // box sits on the two things the rule is about. supervisor: the person who acts in Review.
  const anchorBox=(name,w,h,d,x,y,z)=>{const g=new THREE.Group();g.name=name;root.add(g);const m=mesh(track(new THREE.BoxGeometry(w,h,d)),mat(0xffffff),x,y,z);m.visible=false;m.castShadow=m.receiveShadow=false;m.userData.noFit=true;g.add(m);return{g,m};};
  const zone=anchorBox('review-zone',zw,ZONE.h,zd,zcx,ZONE.h/2,zcz).g;
  const pairA=anchorBox('pair',1,1,1,0,0,0),pair=pairA.g;
  const supA=anchorBox('supervisor',.7,1.95,.6,SUP[0]+.08,.975,SUP[2]+.08),supAnchor=supA.g;
  function fitPair(){
    const lx=loader.position.x,lz=loader.position.z,h=loader.rotation.y,fx=Math.sin(h),fz=Math.cos(h),sx=fz,sz=-fx;
    let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
    const add=(x,z)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);};
    for(const f of [-.2,LOADER_FRONT+.05])for(const sd of [-.62,.62])add(lx+fx*f+sx*sd,lz+fz*f+sz*sd);
    const w=worker.group.position;add(w.x-.22,w.z-.22);add(w.x+.22,w.z+.22);
    pairA.m.position.set((x0+x1)/2,.95,(z0+z1)/2);pairA.m.scale.set(x1-x0,1.9,z1-z0);
  }

  const head=new THREE.Vector3(),ray=new THREE.Raycaster();
  const blockers=()=>[...container.children,...(totes.visible?totes.children:[])];
  function seen(from,to){const d=new THREE.Vector3().subVectors(to,from),len=d.length();ray.set(from,d.normalize());ray.far=len;return ray.intersectObjects(blockers(),false).length===0;}

  let lastS=0;
  const opEye=new THREE.Vector3(),wEye=new THREE.Vector3();
  function update(t,ctx){
    const occluded=ctx.variation==='occlusion';
    totes.visible=occluded;
    // Loader along its route.
    const s=loaderS(t),p=routeAt(s),a=routeAt(s-.06),b=routeAt(s+.06);lastS=s;
    loader.position.set(p[0],0,p[1]);loader.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);
    for(const w of wheels)w.rotation.x=s/R;
    // The advisory reaches the cab: roof lamp and cab display light amber while the operator holds.
    const advised=t>=T_ADVISE&&t<T_GO+.3;
    beaconMat.emissiveIntensity=advised?1.3+.7*Math.max(0,Math.sin((t-T_ADVISE)*7)):0;beaconMat.color.set(advised?0xffc070:0x6b5a3a);
    displayMat.emissive.set(advised?(occluded?0x8d99a1:0xffa21a):0x000000);displayMat.emissiveIntensity=advised?1.1:0;
    // Operator looks along the front lane towards the crossing once holding.
    opHead.rotation.y=-.5*smooth(T_ADVISE,T_ADVISE+.8,t)*(1-smooth(T_GO-.6,T_GO,t));
    // Worker: by the bench with the supervisor, out to the kerb, wait and look, cross, step onto the footpath, look back.
    const g=worker.group;
    if(t<W_C0){
      const f=actors.followPath(g,W_OUT,W_T0,W_T1,t);
      const look=t>W_T1?smooth(W_T1+.2,W_T1+1,t):0;
      if(t<W_T0){const h0=Math.atan2(SUP[0]-W_START[0],SUP[2]-W_START[2]),h1=f.heading;g.rotation.y=h0+wrap(h1-h0)*smooth(W_T0-1.2,W_T0,t);}
      if(f.done){g.rotation.y=wrap(f.heading);}
      worker.pose({distance:f.moving?f.distance:0,weight:f.moving?f.weight:0,turn:.75*look-1.35*smooth(W_C0-1.6,W_C0-.9,t)*look,look:.05});
    }else{
      const f=actors.followPath(g,W_CROSS,W_C0,W_C1,t);
      const back=f.done?smooth(W_C1,W_C1+1,t):0;
      if(f.done)g.rotation.y=f.heading+wrap(Math.PI-f.heading)*back*.75;
      worker.pose({distance:f.moving?f.distance:0,weight:f.moving?f.weight:0,turn:0,look:.05});
    }
    // Supervisor: talks with the worker, turns to watch the corner; the advisory arrives on the tablet, they read it
    // and raise an arm to signal the operator to hold, lowering it once the worker is across.
    const sg=supervisor.group;sg.rotation.y=2.1+wrap(SUP_FACE-2.1)*smooth(W_T0,W_T0+1.5,t);
    const raise=smooth(T_ADVISE,T_ADVISE+.6,t)*(1-smooth(W_C1+.6,W_C1+1.4,t));
    const read=smooth(T_ADVISE+.2,T_ADVISE+.7,t)*(1-smooth(T_ADVISE+1.4,T_ADVISE+1.9,t));
    const signal=smooth(T_ADVISE+1.5,T_ADVISE+2.1,t)*(1-smooth(W_C1-.2,W_C1+.6,t));
    supervisor.pose({distance:0,weight:0,point:signal*.85,look:.05+.45*read,lean:.06*read});
    tablet.position.set(.2-.06*raise,.86+.34*raise,.08+.24*raise);tablet.rotation.set(-1.15*raise,0,0);
    const clear=t>=W_C1+.3;
    tabletScreen.emissive.set(clear?0x3fe08a:advised?(occluded?0xc4ccd2:(t<T_ADVISE+.8?0xffb02e:0xff4b3e)):0x0d1418);
    tabletScreen.emissiveIntensity=raise>.05?1.2:.25;
    // Sight lines in the Change: each view ends at a container face. Hidden in the camera view.
    root.updateMatrixWorld(false);
    const h=loader.rotation.y;opEye.set(p[0]-Math.sin(h)*.18,1.62,p[1]-Math.cos(h)*.18);wEye.set(g.position.x,1.5,g.position.z);
    const out=smooth(-.85,-.55,g.position.z),alpha=ctx.sensor?0:smooth(T_SIGHT0,T_SIGHT0+.6,t)*(1-smooth(T_SIGHT1-.5,T_SIGHT1,t))*out;
    const blind=opEye.x>CONT.x1&&wEye.x<CONT.x0;
    aim(sightOp,opEye,wEye,CONT.x1,blind?alpha:0);aim(sightW,wEye,opEye,CONT.x0,blind?alpha:0);
    fitPair();
    // The pulse runs in the AI view and on into Review while the camera pulls back to show the camera, cable and cabinet.
    const active=ctx.chapterId==='aiView'||(ctx.chapterId==='review'&&t<19.5);
    cabinet.update(t,active);camPulse.update(t,active);apPulse.update(t,active&&t>=14);
    apLed.emissiveIntensity=active&&t>=14?.9+.5*Math.max(0,Math.sin(t*8)):.4;
    camLed.emissiveIntensity=active?1.2:.6;
  }
  return{anchors:{zone,pair,supervisor:supAnchor},sensors:{'yard-cam':{camera:sensorCam,mode:'mask',targets:[loader,worker.group],label:'Yard camera'}},update,
    metrics:()=>{
      root.updateMatrixWorld(true);
      const w=worker.group.position,l=loader.position;head.set(w.x,1.55,w.z);
      const lensW=root.localToWorld(lens.clone()),headW=root.localToWorld(head.clone()),cabW=root.localToWorld(opEye.clone());
      const inZone=(x,z)=>x>=ZONE.x0&&x<=ZONE.x1&&z>=ZONE.z0&&z<=ZONE.z1;
      return{loaderS:+lastS.toFixed(3),loader:[+l.x.toFixed(2),+l.z.toFixed(2)],worker:[+w.x.toFixed(2),+w.z.toFixed(2)],
        loaderInZone:inZone(l.x+Math.sin(loader.rotation.y)*LOADER_FRONT,l.z+Math.cos(loader.rotation.y)*LOADER_FRONT),workerInZone:inZone(w.x,w.z),
        cameraSeesWorker:seen(lensW,headW),cameraSeesHat:seen(lensW,root.localToWorld(new THREE.Vector3(w.x,1.8,w.z))),operatorSeesWorker:seen(cabW,headW),sightLines:sightOp.o.visible,totes:totes.visible};
    }};
}
