// C1 "The camera follows the conversation" (Meeting Room AI Lab, Room Vision PTZ). Storyboard:
// docs/three-worlds/MEETING-ROOM-LAB-PLAN.md s3. The presenter walks from the lectern to the right-hand display and points
// at a chart; someone in row one raises a hand and asks a question. Through the device: first the rear Room Vision PTZ
// (head detection on the camera; faint marks over every head) tightens on the presenter and keeps them framed, then the
// room engine's director cuts to the front PTZ on the questioner. The far end's layout changes from a wide room to
// presenter plus questioner. Variation "out of zone": the presenter walks off toward the glass, out of the tracking zone,
// and the camera does not hunt; it holds the overview. Speaker tracking from the ceiling microphones on this camera is
// Cisco roadmap, so the cut here is the director's rule, said so in the recipe. Pure function of t and ctx.
import {stageRoom,seatedFigure,speechRibbon,tagSprite,aimAt,CSS,P} from '../rigs/cisco-room.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const LECTERN=[P.lectern[0]-.55,0,P.lectern[1]-.15],DISPLAY_SPOT=[2.25,0,-3.62];
const WALK=[LECTERN,[2.85,0,-3.5],DISPLAY_SPOT],WALK_T=[4.4,6.5];
const WANDER=[LECTERN,[4.1,0,-2.4],[4.75,0,-.7]],WANDER_T=[4.4,8.4];
const T={point:[6.7,9.9],raise:[8.0,14.6],ask:[12.9,16.9],track:[10.2,11.4],cut:13.6,twoUp:14.2,answer:[18.8,25.5],headMarks:10.3};

export function buildKit(k){
  const {THREE,root,track}=k;
  const room=stageRoom(k,{hero:['r1-2']});
  const G=room.group,pres=room.presenter;
  const Q=seatedFigure(k,room,'r1-2');
  const qHead=[...Q.seat.head];
  const rear=room.devices.camRear,front=room.devices.camFront;

  // ---- voices ----
  const ribP=speechRibbon(k,{parent:G,colour:0x5dff9a}),ribQ=speechRibbon(k,{parent:G,colour:0xff7ab8});

  // ---- head marks: what the camera's head detection finds (drawn only in the camera view) ----
  const markTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.strokeStyle='#d9f4ff';g.lineWidth=9;g.lineCap='round';
    for(const [x,y,dx,dy] of [[10,10,1,1],[118,10,-1,1],[10,118,1,-1],[118,118,-1,-1]]){g.beginPath();g.moveTo(x,y+dy*34);g.lineTo(x,y);g.lineTo(x+dx*34,y);g.stroke();}
    const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;return t;})();
  const markMat=track(new THREE.SpriteMaterial({map:markTex,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,opacity:.85}));
  const marks=[];
  const addMark=(get)=>{const s=new THREE.Sprite(markMat);s.scale.set(.34,.34,1);s.userData.noFit=true;s.visible=false;s.renderOrder=7;G.add(s);marks.push({s,get});};
  for(const q of room.seats)if(q.occupied)addMark(()=>[q.head[0],q.head[1]+.02,q.head[2]]);
  addMark(()=>{const p=pres.group.position;return[p.x,1.66,p.z];});

  // ---- the subject zone the overlay box follows: the presenter, then the questioner ----
  const subject=new THREE.Group();subject.name='subject-zone';G.add(subject);
  const zm=new THREE.Mesh(track(new THREE.BoxGeometry(1,1,1)),k.mat(0xffffff));zm.visible=false;subject.add(zm);

  // ---- the sensor camera rides whichever PTZ the director has live ----
  const cam=new THREE.PerspectiveCamera(42,1.6,.03,60);cam.userData.portraitWidth=.7;root.add(cam);
  const mp=new THREE.Vector3(),mq=new THREE.Quaternion(),flip=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
  const camTag=tagSprite(k,['ROOM VISION PTZ','4K · 12x optical zoom'],CSS.camera,1.7,{parent:G,x:P.camRear[0]+1.3,y:3.2,z:P.camRear[2]-.4});

  function presenterAt(t,v){
    const path=v?WANDER:WALK,[t0,t1]=v?WANDER_T:WALK_T;
    const r=k.actors.followPath(pres.group,path,t0,t1,t);
    let heading=r.heading;
    if(!v&&t>t1){const toDisplay=Math.atan2(P.displays.x[1]-pres.group.position.x,P.displays.z-pres.group.position.z),toQ=Math.atan2(qHead[0]-pres.group.position.x,qHead[2]-pres.group.position.z);
      heading=toDisplay+wrap(toQ-toDisplay)*smooth(T.cut-.6,T.cut+.6,t);}
    else if(v&&t>t1)heading=r.heading+wrap(Math.atan2(qHead[0]-pres.group.position.x,qHead[2]-pres.group.position.z)-r.heading)*smooth(t1,t1+1,t)*.6;
    else if(t<t0)heading=-.9;
    pres.group.rotation.y=heading;
    const point=v?0:smooth(T.point[0],T.point[0]+.5,t)*(1-smooth(T.point[1]-.4,T.point[1],t));
    const talk=t<4?Math.max(0,Math.sin(t*1.6)):0;
    pres.pose({distance:r.distance,weight:r.moving?r.weight:0,look:.06,point:Math.max(point,talk*.25),pointPitch:point>.1?1.55:1.0,turn:0});
    return r;
  }

  function update(t,ctx){
    const v=!!ctx.variation,sensor=!!ctx.sensor,ai=ctx.chapter>=2;
    room.update(t);
    presenterAt(t,v);
    const pp=pres.group.position,pHead=[pp.x,1.66,pp.z];
    // The questioner raises a hand and asks; the crowd turns to whoever is talking.
    const raise=smooth(T.raise[0],T.raise[0]+.5,t)*(1-smooth(T.raise[1]-.5,T.raise[1],t));
    const asking=smooth(T.ask[0],T.ask[0]+.3,t)*(1-smooth(T.ask[1]-.3,T.ask[1],t));
    const answering=v?0:smooth(T.answer[0],T.answer[0]+.3,t)*(1-smooth(T.answer[1]-.3,T.answer[1],t));
    const s=Q.seat;let qTurn=wrap(Math.atan2(pHead[0]-s.x,pHead[2]-s.z)-s.ry);
    Q.pose(t,{turn:Math.max(-1,Math.min(1,qTurn)),look:-.05,lean:.12+.08*asking,mode:'lap',to:'point',mix:raise,point:[s.x+.05,s.y+2.2,s.z-.15]});
    const focus=asking>.3?qHead:pHead;
    for(const q of room.seats){if(!q.occupied||q.hero)continue;const turn=wrap(Math.atan2(focus[0]-q.x,focus[2]-q.z)-q.ry);room.crowd.pose(q.id,{turn:Math.max(-1.2,Math.min(1.2,turn)),look:.1,lean:.06});}
    room.crowd.commit();
    const presTalk=t<4?.8:answering;
    ribP.draw([pHead[0],pHead[1]+.05,pHead[2]],P.micFront,sensor?0:presTalk,t,{lift:.12,width:.025});
    ribQ.draw([qHead[0],qHead[1]+.08,qHead[2]],P.micRear,sensor?0:asking,t,{lift:.1,width:.025});
    // PTZ heads: the rear one tracks the presenter (or holds the overview), the front one takes the questioner after the cut.
    const rest={rear:{yaw:-.0,tilt:.2},front:{yaw:0,tilt:.22}};
    const overview=[1.1,1.1,-2.0];
    const rearAim=aimAt(k,rear,G,v?overview:pHead),frontAim=aimAt(k,front,G,qHead);
    const tr=ai?smooth(T.track[0],T.track[1],t):0,fc=ai&&!v?smooth(T.cut-1.2,T.cut-.2,t):0;
    rear.pan(rest.rear.yaw+wrap(rearAim.yaw-rest.rear.yaw)*tr);rear.tilt(rest.rear.tilt+(rearAim.tilt-rest.rear.tilt)*tr);
    front.pan(rest.front.yaw+wrap(frontAim.yaw-rest.front.yaw)*fc);front.tilt(rest.front.tilt+(frontAim.tilt-rest.front.tilt)*fc);
    // Live camera: rear PTZ until the cut, then the front PTZ (the variation stays on the rear overview).
    const live=!v&&t>=T.cut?front:rear;
    live.mount.getWorldPosition(mp);live.mount.getWorldQuaternion(mq);cam.position.copy(mp);cam.quaternion.copy(mq).multiply(flip);
    const zoomIn=v?0:live===rear?smooth(T.track[0]+.3,T.track[1]+.4,t):smooth(T.cut,T.cut+.9,t);
    cam.userData.baseFov=live===rear?(v?60:46+(17-46)*zoomIn):(30+(13-30)*zoomIn);
    // Status lights: the live camera glows.
    rear.led(sensor&&live===rear?1:.3,t);front.led(sensor&&live===front?1:.3,t);
    // Head marks in the camera view only.
    const showMarks=sensor&&t>T.headMarks;for(const m of marks){m.s.visible=showMarks;if(showMarks)m.s.position.set(...m.get());}
    // Subject zone: the presenter until the cut, then the questioner.
    if(!v&&t>=T.cut){subject.position.set(s.x,s.y+.85,s.z);subject.scale.set(.62,.95,.62);}
    else{subject.position.set(pp.x,.9,pp.z);subject.scale.set(.6,1.85,.6);}
    // Cables: the live camera's cable carries its picture to the room engine.
    room.cables.camRear.update(t,ai&&t>10.2&&t<(v?18.5:T.cut+.4)?1:0);room.cables.camFront.update(t,ai&&!v&&t>T.cut-.3&&t<19?1:0);
    room.devices.codec.led(ai&&t<19?1:.3,t);
    // Displays: the far end's view of our room changes with the director's choice; the chart highlights while pointed at.
    const self=v||t<T.track[1]?'wide':'presenter';
    room.farEnd(room.displays.left,{talk:-1,self,selfHl:sensor||ai?'#19d3ff':null,layout:!v&&t>=T.twoUp?'two-up':'tiles'});
    room.content(room.displays.right,{step:!v&&t>T.point[0]&&t<T.point[1]+4?1:0});
    camTag.visible=!sensor&&t<4;
  }
  update(0,{variation:null,chapter:0,chapterId:'scene',sensor:false});

  return{
    anchors:{subject,presenter:pres.group,questioner:Q.group,farEnd:room.displays.left.group,camera:rear.group},
    sensors:{'ptz-view':{camera:cam,mode:'normal',targets:[],label:'Room Vision PTZ',title:'Camera view'}},
    update,
    metrics:()=>({presenter:pres.group.position.toArray().map(n=>+n.toFixed(2)),fov:+cam.fov.toFixed(1),marks:marks.filter(m=>m.s.visible).length}),
  };
}
