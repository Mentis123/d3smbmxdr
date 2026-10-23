// R1 "Recognise your produce": a self-serve produce scale in a fictional store. A shopper walks up, lifts a banana
// bunch out of a basket and puts it on the scale plate. The camera above the plate sees the bunch; the store GPU
// suggests "bananas" on the terminal; the shopper confirms with a tap, and the weight is the scale's own reading.
// Variation: the bunch is in a shiny bag with a lemon, so the camera is not sure and the terminal shows a short list.
// Everything is a pure function of t (and the variation).
import {createRetailProps} from '../rigs/retail-props.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const lerp=(a,b,u)=>a+(b-a)*u;
const lerpAngle=(a,b,u)=>a+wrap(b-a)*u;

const SCALE={x:.2,z:0};
const STAND=[.1,0,.62];                          // where the shopper stands, facing the scale (-z)
const WALK=[[-2.2,0,1.55],[-1.05,0,1.25],[STAND[0],0,STAND[2]+.02]],WALK_T0=.4,WALK_T1=3.7;
// Body yaw while reaching: into the basket, then over to the plate. Hand heading in the rig is about -0.52 rad.
const FACE=Math.PI,YAW_BASKET=-2.21,YAW_PLATE=3.26;
const REACH0=5.6,GRAB=6.35,CARRY1=7.35,PLACED=7.75,SETTLED=8.6;
const SUGGEST=11.7;                              // the overlay turns amber here (10 + 0.5 + 1.2): the suggestion arrives
// Review: the shopper steps toward the terminal, taps the suggestion, and the screen confirms.
const TAP_STAND=[1.05,0,.42],STEP0=16.3,STEP1=17.35,TAP0=17.45,TAP=18.1,TAP1=19.6,PULSE_END=21.5;

export function buildKit(k){
  const {THREE,root,props,actors}=k;
  const R=createRetailProps(k);
  R.storeStage();

  // ---- The scale station, its camera and sign ----
  const st=R.produceScale({x:SCALE.x,z:SCALE.z});
  const lens=st.lens.toArray(),plate=st.plateCentre;
  const cam=R.storeCamera(lens,[plate.x,plate.y,plate.z],{fov:54});
  props.plate('CAMERA',.3,.09,{x:SCALE.x+.02,y:1.92,z:.06,bg:'#1d2124',fg:'#f6f1e8'});
  props.plate('PRODUCE SCALE',.5,.11,{x:SCALE.x-.25,y:.55,z:.296,bg:'#f6f1e8',fg:'#2f6b4f'});

  // ---- Produce display behind: a sloped table with bananas, apples and lemons ----
  const DX=-1.75,DZ=-1.35;
  const table=new THREE.Group();table.name='display-table';table.position.set(DX,0,DZ);root.add(table);
  for(const [x,z,h] of [[-.95,-.3,.86],[.95,-.3,.86],[-.95,.32,.62],[.95,.32,.62]]){const l=k.box(.05,h,.05,R.M.woodDark,x,h/2,z);table.add(l);}
  const top=k.box(2.0,.04,.75,R.M.wood,0,.74,0);top.rotation.x=.3;table.add(top);
  const fruitCrates=[['banana',-.66],['apple',0],['lemon',.66]].map(([kind,x],i)=>R.crate({kind,w:.6,d:.5,h:.14,layers:kind==='banana'?1:2,parent:table,x,y:.765,z:0,rx:.3,seed:i*11}));
  const signPost=k.box(.04,1.0,.04,R.M.woodDark,DX-1.0,1.3,DZ-.3);void signPost;
  props.plate('FRESH PRODUCE',.8,.16,{x:DX,y:1.62,z:DZ-.36,bg:'#2f6b4f',fg:'#f6f1e8'});
  k.box(2.1,.04,.04,R.M.woodDark,DX,1.72,DZ-.38);
  for(const s of [-1,1])k.box(.04,1.72,.04,R.M.woodDark,DX+s*1.03,.86,DZ-.38);
  void fruitCrates;

  // ---- Shelves and the store GPU at the back right ----
  // The store GPU stands close behind the scale, so the review shot holds camera, cabinet, screen and shopper.
  R.shelfBay({x:.45,z:-1.82,w:1.3,seed:3});R.shelfBay({x:2.98,z:-1.82,w:.75,seed:7});
  const cabinet=props.siteCabinet(2.05,-1.58,{rotation:-.3,label:'STORE GPU'});
  const port=cabinet.port();
  R.shoppingTrolley({x:-2.75,z:.35,ry:.35});
  // Camera -> along the arm -> down the post -> under the floor edge -> store GPU -> back to the terminal.
  const postX=SCALE.x-.12,termX=SCALE.x+.58;
  const pulse=props.pulse([[lens[0],1.84,lens[2]],[postX,1.84,lens[2]],[postX,1.84,-.24],[postX,.03,-.24],[postX,.03,-.36],[1.6,.03,-.36],[1.6,.03,-1.15],[port[0],.03,port[2]+.04],port,
    [port[0]-.06,.03,port[2]+.08],[1.48,.03,-1.08],[1.48,.03,-.44],[termX,.03,-.44],[termX,.03,-.2],[termX,.86,-.2],[termX,1.2,-.2]]);

  // ---- Basket on the ledge and the banana bunch ----
  const ledge=st.ledge;
  R.basket({x:ledge.x,y:ledge.y,z:ledge.z,ry:.1});
  const bunch=R.bananaBunch({fingers:7,seed:4,name:'banana-bunch',spread:.19});bunch.scale.setScalar(1.2);
  const IN_BASKET={p:new THREE.Vector3(ledge.x-.02,ledge.y+.07,ledge.z-.09),ry:.3};
  const ON_PLATE={p:new THREE.Vector3(plate.x-.08,plate.y+.045,plate.z+.045),ry:Math.PI/2+.25};
  const LIE=1.05;   // a bunch lies tipped on its side: from above the fingers show as a fan of crescents, not a stack
  // The "difficult view": a shiny produce bag round the bunch, with a lemon in it too.
  const bag=new THREE.Group();bag.name='produce-bag';bunch.add(bag);
  const bagGeo=k.track(new THREE.SphereGeometry(1,18,12)),bp=bagGeo.attributes.position,v=new THREE.Vector3();
  for(let i=0;i<bp.count;i++){v.fromBufferAttribute(bp,i);v.y=v.y<0?v.y*.35:v.y;v.multiplyScalar(1+.05*Math.sin(v.x*9+v.z*7));bp.setXYZ(i,v.x,v.y,v.z);}bagGeo.computeVertexNormals();
  const bagMesh=k.mesh(bagGeo,k.mat(0xf4f8fa,{roughness:.08,metalness:.35,transparent:true,opacity:.58,depthWrite:false}));bag.add(bagMesh);bagMesh.position.set(.0,.03,.09);bagMesh.scale.set(.12,.13,.15);bagMesh.castShadow=false;
  const knot=k.mesh(k.track(new THREE.ConeGeometry(.025,.07,8)),k.mat(0xf4f8fa,{roughness:.1,metalness:.3,transparent:true,opacity:.7}));bag.add(knot);knot.position.set(0,.06,-.07);knot.rotation.x=-1.2;
  const lemon=R.fruit('lemon',{parent:bag,x:.06,y:.0,z:.12,seed:1});lemon.position.y=.03;
  // Lens reflection off the bag (variation only).
  const gl=document.createElement('canvas');gl.width=gl.height=64;const glc=gl.getContext('2d'),gr=glc.createRadialGradient(32,32,1,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,252,240,.7)');gr.addColorStop(1,'rgba(255,250,235,0)');glc.fillStyle=gr;glc.fillRect(0,0,64,64);
  const glareTex=k.track(new THREE.CanvasTexture(gl));
  const lensGlare=new THREE.Sprite(k.track(new THREE.SpriteMaterial({map:glareTex,color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})));lensGlare.position.set(.05,.02,-.4);lensGlare.scale.set(.32,.2,1);cam.camera.add(lensGlare);

  // Overlay / subject zone: the bunch's footprint on the plate (invisible), so the box sits on the produce, not the plate.
  bunch.position.copy(ON_PLATE.p);bunch.rotation.set(0,ON_PLATE.ry,LIE,'YXZ');bunch.remove(bag);root.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(bunch,true);bunch.add(bag);const bs=bb.getSize(new THREE.Vector3()),bc=bb.getCenter(new THREE.Vector3());root.worldToLocal(bc);
  const zone=new THREE.Group();zone.name='produce-zone';root.add(zone);
  const zm=k.mesh(k.track(new THREE.BoxGeometry(bs.x+.03,bs.y+.02,bs.z+.03)),k.mat(0xffffff),bc.x,bc.y,bc.z);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);

  // ---- Shopper ----
  const shopper=actors.person({vest:0x5a7fa8,shirt:0x5a7fa8,pants:0x3a3f4a,name:'shopper'});
  const {hand}=R.dress(shopper,{hair:0x4a3020,top:0x5a7fa8});
  const shoulder=hand.parent.parent,handPos=new THREE.Vector3();
  const SCREEN=st.screenCentre.clone().add(new THREE.Vector3(-.03,-.06,.07));   // the tile's spot on the glass
  // Body yaw that brings the pointing (right) shoulder in line with a point: the shoulder sits .235 m to the side.
  const aimYaw=(px,pz,tx,tz)=>{let y=Math.atan2(tx-px,tz-pz);for(let i=0;i<4;i++){const sx=px-.235*Math.cos(y),sz=pz+.235*Math.sin(y);y=Math.atan2(tx-sx,tz-sz);}return y;};

  function update(t,ctx){
    const bagged=ctx.variation==='bagged';
    bag.visible=bagged;
    // Shopper: walks in, reaches into the basket, carries the bunch across to the plate, later taps the screen.
    const stepping=t>=STEP0;
    const f=stepping?actors.followPath(shopper.group,[[STAND[0],0,STAND[2]+.02],TAP_STAND],STEP0,STEP1,t,{ease:.35}):actors.followPath(shopper.group,WALK,WALK_T0,WALK_T1,t);
    const walked=stepping?actors.followPath(shopper.group,WALK,WALK_T0,WALK_T1,WALK_T1).total:0;
    if(stepping)actors.followPath(shopper.group,[[STAND[0],0,STAND[2]+.02],TAP_STAND],STEP0,STEP1,t,{ease:.35});
    let yaw=f.done&&!stepping?lerpAngle(f.heading,FACE,smooth(WALK_T1,WALK_T1+.6,t)):stepping?FACE:f.heading;
    if(!stepping){
      yaw=lerpAngle(yaw,YAW_BASKET,smooth(REACH0,GRAB-.15,t));
      yaw=lerpAngle(yaw,YAW_PLATE,smooth(GRAB+.05,CARRY1,t));
      yaw=lerpAngle(yaw,FACE,smooth(PLACED+.2,SETTLED+.4,t));
    }else{const p=shopper.group.position;yaw=lerpAngle(FACE,aimYaw(p.x,p.z,SCREEN.x,SCREEN.z),smooth(STEP0+.2,TAP0,t));}
    shopper.group.rotation.y=yaw;
    const reach=smooth(REACH0,GRAB-.1,t)*(1-smooth(PLACED,SETTLED,t)),tap=smooth(TAP0-.35,TAP,t)*(1-smooth(TAP1-.3,TAP1+.5,t));
    const lookAt=Math.max(reach,smooth(4.8,5.6,t)*(1-smooth(12.5,13.5,t)),tap*.75);
    shopper.pose({distance:walked+f.distance,weight:f.moving?f.weight:0,look:.12+.45*lookAt,lean:.24*reach+.08*tap,point:Math.max(.86*reach,tap)});
    // The tap: lift the arm from "point down" to the height of the screen.
    if(tap>0)shoulder.rotation.x+=(-1.05-shoulder.rotation.x)*tap;
    R.stand(shopper,f.moving?f.weight:0);
    // Bunch: in the basket, then held at the hand, then set down on the plate.
    shopper.group.updateMatrixWorld(true);hand.getWorldPosition(handPos);root.worldToLocal(handPos);
    let p,ry,lift=0;
    if(t<GRAB){p=IN_BASKET.p;ry=IN_BASKET.ry;}
    else if(t<CARRY1){const u=smooth(GRAB,GRAB+.35,t);p=new THREE.Vector3().lerpVectors(IN_BASKET.p,handPos.clone().add(new THREE.Vector3(0,-.05,0)),u);ry=lerpAngle(IN_BASKET.ry,ON_PLATE.ry,smooth(GRAB,CARRY1,t));}
    else{const u=smooth(CARRY1,PLACED,t);p=new THREE.Vector3().lerpVectors(handPos.clone().add(new THREE.Vector3(0,-.05,0)),ON_PLATE.p,u);ry=ON_PLATE.ry;if(t>=PLACED)p=ON_PLATE.p;lift=0;}
    if(t>=PLACED)p=ON_PLATE.p;
    bunch.position.copy(p);bunch.position.y+=lift;bunch.rotation.set(0,ry,LIE,'YXZ');
    // The scale: plate dips as the weight lands, readout shows dashes while settling, then a steady reading.
    const load=t>=PLACED?1:0,dip=load*(1+.35*Math.exp(-(t-PLACED)*5)*Math.sin((t-PLACED)*22));st.settle(dip);
    st.lcd(t<PLACED-.05?'off':t<SETTLED?'dashes':'steady');
    // Terminal: idle until the camera's suggestion arrives; the shopper's tap confirms.
    st.screen(t<SUGGEST?'idle':bagged?(t<TAP?'list':'list-done'):(t<TAP?'suggest':'done'));
    // The variation's reflection only shows through the camera.
    const glare=bagged&&ctx.sensor?1:0;lensGlare.material.opacity=.9*glare;lensGlare.visible=glare>0;
    const active=ctx.chapterId==='aiView'||(ctx.chapterId==='review'&&t<PULSE_END);
    cabinet.update(t,active);pulse.update(t,active);
  }
  return{anchors:{produce:zone,scale:st.plate,screen:st.terminal},sensors:{'scale-cam':{camera:cam.camera,mode:'mask',targets:[bunch],label:'Scale camera'}},update,
    metrics:()=>({handToScreen:+hand.getWorldPosition(new THREE.Vector3()).distanceTo(root.localToWorld(SCREEN.clone())).toFixed(3),bunch:bunch.position.toArray().map(v=>+v.toFixed(3)),onPlate:bunch.position.distanceTo(ON_PLATE.p)<.01,shopper:shopper.group.position.toArray().map(v=>+v.toFixed(2))}),
    dispose:()=>R.dispose()};
}
