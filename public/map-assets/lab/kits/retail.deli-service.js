// R2 "Help a waiting customer": the deli counter of a fictional store. A colleague prepares an order at the bench
// behind a partition, out of sight of the counter. A customer walks up and waits in the marked service area. The
// overhead camera on the deli gantry sees a person standing in that area; a rule (still there, not just passing)
// raises one notification on the colleague's handheld; the colleague comes to serve. Variation: someone passes
// through the area without stopping, so nothing is raised. Everything is a pure function of t (and the variation).
import {createRetailProps} from '../rigs/retail-props.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const lerpAngle=(a,b,u)=>a+wrap(b-a)*u;

const COUNTER={x:.7,z:-.35,w:2.6};
const SPOT=[.55,0,.66];                                   // where a waiting customer stands, facing the counter
const C_PATH=[[3.3,0,.12],[1.75,0,.8],[SPOT[0],0,SPOT[2]]],C_T0=4.9,C_T1=8.7;
// A browsing passer-by: crosses the mat while the camera looks (about 12 s), never stops, leaves at the front.
const P_PATH=[[2.9,0,.25],[1.5,0,.85],[SPOT[0],0,.92],[-.7,0,1.15],[-1.7,0,1.95]],P_T0=6.0,P_T1=18.5;   // passer-by
const BENCH=[-1.95,0,-1.38],SERVE=[-.2,0,-1.12];
const FACE_C=Math.atan2(SERVE[0]-SPOT[0],SERVE[2]-SPOT[2]),FACE_W=Math.atan2(SPOT[0]-SERVE[0],SPOT[2]-SERVE[2]);   // customer and colleague face each other
// The colleague's way round: from the bench, through the passage behind the partition, to the serving spot.
const W_PATH=[BENCH,[-1.35,0,-1.32],[-.75,0,-1.28],SERVE],W_T0=18.4,W_T1=21.3;
const ALERT=11.7,LOOK0=16.9,ACK=17.8,TURN0=21.0,POINT0=22.2,SERVE0=22.0;

export function buildKit(k){
  const {THREE,root,props,actors}=k;
  const R=createRetailProps(k);
  R.storeStage({wallColour:0xe9dcc6});

  // ---- Deli counter and the gantry that carries the sign and the camera ----
  const deli=R.deliCounter({x:COUNTER.x,z:COUNTER.z,w:COUNTER.w});void deli;
  const GZ=COUNTER.z-.42,GX0=COUNTER.x-COUNTER.w/2+.06,GX1=COUNTER.x+COUNTER.w/2-.06,GY=2.38;
  for(const x of [GX0,GX1])k.box(.06,GY,.06,R.M.stainless,x,GY/2,GZ);
  k.box(GX1-GX0+.06,.07,.07,R.M.stainless,COUNTER.x,GY,GZ);
  props.plate('DELI',.8,.24,{x:COUNTER.x-.35,y:GY-.24,z:GZ+.05,bg:'#2f6b4f',fg:'#f6f1e8'});
  for(const s of [-1,1])k.box(.012,.12,.012,R.M.stainless,COUNTER.x-.35+s*.36,GY-.08,GZ+.04);
  // The deli camera: hung from the front of the gantry, looking steeply down at the service area in front of the
  // glass, so its view is the floor where a customer stands (not the room beyond the counter).
  // Like a ceiling dome camera: on an arm up and forward from the gantry, looking almost straight down at the mat.
  const LENS=[.62,2.78,.02];
  k.bar([LENS[0],GY,GZ],[LENS[0],LENS[1]+.07,LENS[2]-.06],.018,R.M.stainless);
  const cam=R.storeCamera(LENS,[SPOT[0],.3,SPOT[2]-.14],{fov:62});
  props.plate('CAMERA',.3,.09,{x:LENS[0]+.36,y:GY-.1,z:GZ+.05,bg:'#1d2124',fg:'#f6f1e8'});

  // ---- Prep area behind a partition: bench, board, trays ----
  k.box(1.5,.88,.6,R.M.stainless,-2.05,.44,-1.75);
  k.box(1.52,.03,.62,mat2(0xd8dcde),-2.05,.895,-1.75);
  k.box(.42,.025,.3,R.M.wood,-1.95,.92,-1.7);
  for(const [x,c] of [[-2.55,0xe7a0a0],[-2.4,0xf2d27a],[-1.5,0x9cc46a]])k.box(.24,.05,.2,k.mat(c,{roughness:.7}),x,.935,-1.82);
  // A full-height partition between the prep bench and the counter: from the bench the colleague cannot see the
  // service area. The passage behind it (toward the back wall) is how the colleague comes round.
  k.box(.07,2.0,.8,R.M.warmWhite,-1.02,1.0,-.6);k.box(.08,.06,.82,R.M.green,-1.02,2.0,-.6);
  props.plate('STAFF ONLY',.5,.11,{x:-.98,y:1.5,z:-.6,bg:'#f6f1e8',fg:'#2f6b4f',ry:Math.PI/2});
  function mat2(c){return k.mat(c,{metalness:.6,roughness:.35});}

  // ---- Service area: a painted mat in front of the counter (the camera's region) ----
  const mc=document.createElement('canvas');mc.width=256;mc.height=192;const mg=mc.getContext('2d');
  mg.fillStyle='rgba(47,107,79,.16)';mg.fillRect(0,0,256,192);mg.strokeStyle='#2f6b4f';mg.lineWidth=10;mg.setLineDash([26,16]);mg.strokeRect(8,8,240,176);
  const matTex=k.track(new THREE.CanvasTexture(mc));matTex.colorSpace=THREE.SRGBColorSpace;
  const areaMat=k.mesh(k.track(new THREE.PlaneGeometry(1.25,.92)),k.track(new THREE.MeshStandardMaterial({map:matTex,transparent:true,roughness:.8,depthWrite:false})),SPOT[0],.014,SPOT[2]+.02);
  areaMat.rotation.x=-Math.PI/2;areaMat.castShadow=false;areaMat.receiveShadow=true;
  // The rule's region (invisible): the mat and the height of a person standing on it.
  const area=new THREE.Group();area.name='service-area';root.add(area);
  const am=k.mesh(k.track(new THREE.BoxGeometry(1.25,1.0,.92)),k.mat(0xffffff),SPOT[0],.5,SPOT[2]+.02);am.visible=false;am.castShadow=am.receiveShadow=false;area.add(am);

  // ---- Store context: shelves left, a parked trolley ----
  R.shelfBay({x:-2.95,z:.75,ry:Math.PI/2,w:1.5,seed:5});
  R.shoppingTrolley({x:2.75,z:1.55,ry:-.4});

  // ---- Store GPU in the back corner; pulse camera -> gantry -> floor -> cabinet -> along the wall to the colleague ----
  const cabinet=props.siteCabinet(2.72,-1.55,{rotation:-.35,label:'STORE GPU'});
  const port=cabinet.port();
  // Camera -> along the gantry -> down its post -> store GPU -> along the back wall -> the colleague at the bench.
  const pulse=props.pulse([[LENS[0],LENS[1]+.06,LENS[2]-.1],[LENS[0],GY,GZ],[GX1,GY,GZ],[GX1,.03,GZ],[GX1,.03,-1.3],[port[0],.03,port[2]+.06],port,
    [port[0]-.06,.03,port[2]+.1],[1.75,.03,-1.98],[-1.2,.03,-1.98],[-1.2,.03,-1.5],[BENCH[0]+.3,.03,-1.5]]);

  // ---- People ----
  const colleague=actors.person({vest:0x2f6b4f,shirt:0xf2efe8,pants:0x2b2f36,name:'colleague'});
  const dc=R.dress(colleague,{cap:0xf6f6f2,apron:0x2f6b4f});
  const device=R.handheld(colleague.group);   // re-parented below each frame: apron pocket, then hand
  const pocket=new THREE.Object3D();pocket.position.set(.09,.2,.125);dc.torso.add(pocket);
  const grip=new THREE.Object3D();grip.position.set(0,-.33,.045);grip.rotation.set(-1.25,0,0);dc.hand.parent.add(grip);
  pocket.add(device.group);
  const customer=actors.person({vest:0xb5523a,shirt:0xb5523a,pants:0x2f3640,name:'customer'});
  R.dress(customer,{hair:0x2a1c14,top:0xb5523a});

  function update(t,ctx){
    const passing=ctx.variation==='passer-by';
    // Customer: walks up and waits (or, in the variation, walks straight through the area and away).
    if(passing){const f=actors.followPath(customer.group,P_PATH,P_T0,P_T1,t,{ease:.8});customer.pose({distance:f.distance,weight:f.moving?f.weight:0,look:.05});R.stand(customer,f.moving?f.weight:0);customer.group.visible=t>=P_T0-.2&&!f.done;}
    else{const f=actors.followPath(customer.group,C_PATH,C_T0,C_T1,t);customer.group.visible=t>=C_T0-.2;
      if(f.done)customer.group.rotation.y=lerpAngle(lerpAngle(f.heading,Math.PI,smooth(C_T1,C_T1+.6,t)),FACE_C,smooth(TURN0,TURN0+.8,t));
      // Glances along the counter while waiting, then faces the colleague and points at a tray.
      const glance=f.done?.35*Math.sin(Math.max(0,t-C_T1)*.9)*(1-smooth(TURN0-.9,TURN0+.1,t)):0;
      customer.pose({distance:f.distance,weight:f.moving?f.weight:0,look:.08+.12*smooth(C_T1,C_T1+1,t),turn:glance,point:.55*smooth(POINT0,POINT0+.7,t)});R.stand(customer,f.moving?f.weight:0);}
    // Colleague: works at the bench facing it; when notified, looks at the handheld, acknowledges, comes round.
    const lookDev=passing?0:smooth(LOOK0,LOOK0+.6,t)*(1-smooth(ACK+.15,ACK+.6,t));
    const f=passing?{distance:0,moving:false,weight:0,done:false}:actors.followPath(colleague.group,W_PATH,W_T0,W_T1,t,{ease:.7});
    const working=passing||t<LOOK0-.2;
    if(passing||t<W_T0){colleague.group.position.set(...BENCH);colleague.group.rotation.y=lerpAngle(Math.PI,.6,smooth(LOOK0-.3,LOOK0+.4,t)*(passing?0:1));}
    else if(f.done)colleague.group.rotation.y=lerpAngle(f.heading,FACE_W,smooth(W_T1,W_T1+.6,t));
    const chop=working?.5+.5*Math.sin(t*5.2):0;
    colleague.pose({distance:passing?0:f.distance,weight:f.moving?f.weight:0,look:working?.55:.55*lookDev+.05,lean:working?.2+.03*chop:.12*lookDev,
      point:working?.3+.12*chop:Math.max(.7*lookDev,.3*smooth(SERVE0,SERVE0+.6,t)*(1-smooth(23.2,23.8,t)))});
    R.stand(colleague,f.moving?f.weight:0);
    // Handheld: in the apron pocket, lit when the notification arrives; held up to acknowledge (green).
    const inHand=!passing&&t>=LOOK0-.15&&t<ACK+.5;
    const want=inHand?grip:pocket;if(device.group.parent!==want){want.add(device.group);}
    device.group.scale.setScalar(inHand?1.7:.9);
    device.set(passing?'none':t<ALERT?'off':t<ACK?'alert':'ok');
    const active=ctx.chapterId==='aiView'||(ctx.chapterId==='review'&&t<ACK+1.6);
    cabinet.update(t,active&&!passing||ctx.chapterId==='aiView');pulse.update(t,active&&!passing);
  }
  return{anchors:{customer:customer.group,colleague:colleague.group,area,counter:deli.group},sensors:{'deli-cam':{camera:cam.camera,mode:'mask',targets:[customer.group],label:'Deli camera'}},update,
    metrics:()=>({customer:customer.group.position.toArray().map(v=>+v.toFixed(2)),customerVisible:customer.group.visible,colleague:colleague.group.position.toArray().map(v=>+v.toFixed(2)),device:device.group.parent===grip?'hand':'pocket'}),
    dispose:()=>R.dispose()};
}
