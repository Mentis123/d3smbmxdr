// C2 "The ceiling hears the voices, not the room" (Meeting Room AI Lab, Ceiling Microphone Pro). Storyboard:
// docs/three-worlds/MEETING-ROOM-LAB-PLAN.md s3. The whole Town Hall room at half scale. A discussion at the table; a
// coffee machine and an air vent make noise (grey shells). Two people at opposite ends of the table speak. Through the
// device: the view from the front Ceiling Microphone Pro straight down. Eight beams (datasheet: 8 AI adaptive beams)
// fan out; two swing onto the talkers and lock; the beam over the empty seats stays parked (Cisco: the microphone uses
// the camera's head detection to decide where to listen); the noise is marked removed; the far end's meter goes clean.
// Variation "two in one beam": neighbours talk at once inside one beam, so both come through together.
// No figures beyond the datasheet's 64 microphones and 8 beams. Everything is a pure function of t and ctx.
import {stageRoom,seatedFigure,speechRibbon,beamFan,shells,tagSprite,ACCENT,CSS,P} from '../rigs/cisco-room.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const VOICE={a:0x5dff9a,b:0xff7ab8,n:0xd4ff5d};
// Who talks when [t0, t1, who]. 'a' = t2 (left side, near the displays), 'b' = t9 (far end), 'n' = t1 (A's neighbour).
const TALK=[[4.6,7.2,'a'],[7.5,9.8,'b'],[11.0,13.0,'a'],[13.2,15.4,'b'],[17.2,19.6,'a'],[20.0,22.6,'b']];
const TALK_V=[[4.6,7.2,'a'],[7.5,9.8,'b'],[11.0,14.6,'a'],[11.0,14.6,'n'],[14.8,15.8,'b'],[17.2,19.8,'a'],[17.2,19.8,'n'],[20.2,22.6,'b']];
const T={beamsOn:10.05,swing:[10.8,11.9],removed:12.6,cable:[10.4,18.6],farTag:17.0};
const level=(talk,who,t)=>{let l=0;for(const [a,b,w] of talk)if(w===who)l=Math.max(l,smooth(a-.2,a+.2,t)*(1-smooth(b-.2,b+.2,t)));return l;};

export function buildKit(k){
  const {THREE}=k;
  const room=stageRoom(k,{hero:['t1','t2','t9']});
  const G=room.group;
  const A=seatedFigure(k,room,'t2'),B=seatedFigure(k,room,'t9'),N=seatedFigure(k,room,'t1');
  const mic=room.devices.micFront,micFace=[P.micFront[0],P.micFront[1]-.04,P.micFront[2]];
  const head=f=>[...f.seat.head];

  // ---- voices: a ribbon from each talker up to the ceiling microphone ----
  const rib={a:speechRibbon(k,{parent:G,colour:VOICE.a}),b:speechRibbon(k,{parent:G,colour:VOICE.b}),n:speechRibbon(k,{parent:G,colour:VOICE.n})};

  // ---- noise: the coffee machine and the air vent, drawn as grey shells ----
  const coffeeO=room.noise.coffee.position.toArray(),ventO=room.noise.vent.position.toArray();
  const noise=shells(k,{parent:G,n:6,colour:0xb7c0c7,half:'full',opacity:.42});

  // ---- the eight beams from the microphone face; one wide beam for the variation ----
  const fan=beamFan(k,{parent:G,n:8,colour:ACCENT.mic,half:.17});
  const wide=beamFan(k,{parent:G,n:1,colour:ACCENT.mic,half:.42});
  const az=i=>i*Math.PI/4;                                         // beam i points at azimuth i*45deg (x = cos, z = sin)
  const parked=i=>[Math.cos(az(i))*.62,-1,Math.sin(az(i))*.62];
  const azOf=p=>Math.atan2(p[2]-micFace[2],p[0]-micFace[0]);
  const nearest=p=>{let best=0,d=9;for(let i=0;i<8;i++){const e=Math.abs(wrap(az(i)-azOf(p)));if(e<d){d=e;best=i;}}return best;};
  const iA=nearest(head(A)),iB=nearest(head(B)),iE=nearest([1.08,1.0,-.2]);
  const toward=(p,lift=0)=>[p[0]-micFace[0],p[1]+lift-micFace[1],p[2]-micFace[2]];
  const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};
  const mixDir=(a,b,u)=>norm(a.map((x,i)=>x+(b[i]-x)*u));

  // ---- the microphone's own view: straight down from just under its face, the front wall at the top ----
  // A plan of the room as the microphone maps it: looking straight down from above, centred between the talkers and the
  // noise, the front wall at the top. The tray and the pendants are hidden in this view so nothing crosses the plan.
  const VIEW=[-1.85,0,-.25];
  const cam=new THREE.PerspectiveCamera(40,1.6,.5,60);cam.up.set(0,0,-1);cam.position.set(VIEW[0],9.4,VIEW[2]);G.add(cam);
  cam.userData.portraitWidth=.42;
  // On a tall, narrow screen the plan centres on the table (both talkers) instead of reaching for the coffee machine.
  const PORTRAIT=[-.55,0,.15],aim=new THREE.Vector3();let framed=null;
  // Square canvases (the Data#3 host's desktop stage) keep the full plan and widen it; only tall ones re-centre.
  const SQUARE=[-1.45,0,-.25];
  function frame(mode){if(framed===mode)return;framed=mode;const portrait=mode==='portrait';cam.userData.portraitWidth=portrait?.42:1.3;const c=portrait?PORTRAIT:mode==='square'?SQUARE:VIEW;cam.position.set(c[0],portrait?10.6:9.4,c[2]);G.updateMatrixWorld(true);cam.lookAt(G.localToWorld(aim.set(...c)));}
  frame('wide');

  // ---- tags (facts in the scene, for phones where the host hides captions) ----
  const micTag=tagSprite(k,['CEILING MICROPHONE PRO','64 microphones · 8 AI beams'],CSS.mic,1.7,{parent:G,x:micFace[0]+.2,y:3.15,z:micFace[2]+.1});
  const emptyTag=tagSprite(k,['NO ONE HERE','The camera sees empty seats'],'#9aa5ad',2.6,{parent:G,x:1.45,y:1.2,z:-.2});
  const coffeeTag=tagSprite(k,['NOISE REMOVED','Coffee machine'],'#ff6b5e',2.6,{parent:G,x:coffeeO[0]+1.9,y:coffeeO[1]+.3,z:coffeeO[2]+1.1});
  const ventTag=tagSprite(k,['NOISE REMOVED','Air vent'],'#ff6b5e',2.4,{parent:G,x:ventO[0]+1.8,y:ventO[1]-.25,z:ventO[2]+.95});
  const farTag=tagSprite(k,['FAR END HEARS','Both voices, clean'],'#5dff9a',1.6,{parent:G,x:P.displays.x[0]-.4,y:2.6,z:P.displays.z+.7});
  const farTagV=tagSprite(k,['FAR END HEARS','Two voices, together'],'#a4aeb6',1.6,{parent:G,x:P.displays.x[0]-.4,y:2.6,z:P.displays.z+.7});

  // ---- overlay anchors ----
  const farEndAnchor=room.displays.left.group;

  function update(t,ctx){
    const v=!!ctx.variation,talk=v?TALK_V:TALK,sensor=!!ctx.sensor,ai=ctx.chapter>=2;
    room.update(t);
    frame(cam.aspect<.8?'portrait':cam.aspect<1.25?'square':'wide');room.tray.visible=!sensor;for(const pd of room.pendants)pd.visible=!sensor;room.devices.micRear.group.visible=!sensor;
    // Who is talking, and everyone turns to them.
    const lv={a:level(talk,'a',t),b:level(talk,'b',t),n:level(talk,'n',t)};
    const who=lv.a>.05?'a':lv.b>.05?'b':null,fig={a:A,b:B,n:N};
    const focus=who?head(fig[who]):head(A);
    for(const q of room.seats){if(!q.occupied||q.hero)continue;let turn=Math.atan2(focus[0]-q.x,focus[2]-q.z)-q.ry;turn=wrap(turn);
      room.crowd.pose(q.id,{turn:Math.max(-1.15,Math.min(1.15,turn)),look:.15,lean:.07+.02*Math.sin(t*.4+q.x)});}
    room.crowd.commit();
    for(const [id,f] of Object.entries(fig)){const s=f.seat,l=lv[id],other=id==='b'?head(A):head(B);
      let turn=wrap(Math.atan2(other[0]-s.x,other[2]-s.z)-s.ry);turn=Math.max(-1.1,Math.min(1.1,turn));
      f.pose(t,{turn,lean:.1+.12*l,look:.05+.05*Math.sin(t*3)*l,mode:'rest',to:'point',mix:.35*l,point:[other[0],other[1]-.1,other[2]]});}
    // Ribbons up to the microphone (hidden in the microphone's view, where the beams tell it).
    for(const id of ['a','b','n']){const h=head(fig[id]);rib[id].draw([h[0],h[1]+.08,h[2]],micFace,sensor?0:lv[id],t,{lift:.08,amp:.05,width:.025,phase:id.charCodeAt(0)});}
    // Noise: three shells each from the coffee machine and the vent, always running; dimmer once removed.
    const removed=ai?smooth(T.removed,T.removed+.8,t):0;
    for(let j=0;j<3;j++){const u=((t*.7+j/3)%1);noise.set(j,coffeeO,.1+u*.95,(1-u)*(1-.85*removed)*(sensor||!ai?1:.4),removed>.5?0xff8a7a:undefined);
      const w=((t*.55+j/3+.17)%1);noise.set(3+j,ventO,.08+w*.8,(1-w)*.8*(1-.85*removed)*(sensor||!ai?1:.4),removed>.5?0xff8a7a:undefined);}
    // Beams: hidden until the device view; parked, then two swing onto the talkers. Kept, softer, in the review.
    const on=ai?smooth(T.beamsOn,T.beamsOn+.7,t):0,sw=smooth(T.swing[0],T.swing[1],t),soft=sensor?1:.75;
    for(let i=0;i<8;i++){
      let dir=parked(i),len=1.25,int=.3*on,hex=ACCENT.mic;
      if(i===iE){int=.12*on;hex=0x8a9299;}
      if(i===iA&&!v){dir=mixDir(parked(i),toward(head(A),.05),sw);len=1.25+(Math.hypot(...toward(head(A)))-1.25)*sw*.96;int=(.3+sw*(.2+.3*lv.a))*on;}
      if(i===iB){dir=mixDir(parked(i),toward(head(B),.05),sw);len=1.25+(Math.hypot(...toward(head(B)))-1.25)*sw*.96;int=(.3+sw*(.2+.3*lv.b))*on;}
      if(i===iA&&v)int=.05*on;
      fan.beams[i].set(micFace,dir,len,int*soft,hex);
    }
    // Variation: one wide beam takes both neighbours.
    if(v){const mid=head(A).map((x,i)=>(x+head(N)[i])/2),d=toward(mid,.05);wide.beams[0].set(micFace,mixDir(parked(iA),d,sw),Math.hypot(...d)*(.3+.66*sw),(.12+sw*(.2+.25*Math.max(lv.a,lv.n)))*on*soft,ACCENT.mic);}
    else wide.beams[0].set(micFace,[0,-1,0],0,0);
    // The microphone glows while it hears a voice; its cable carries the audio to the room engine in the AI view.
    mic.led(Math.max(lv.a,lv.b,lv.n),t);
    const cableOn=ai&&t>T.cable[0]&&t<T.cable[1]?1:0;room.cables.micFront.update(t,cableOn);room.devices.codec.led(cableOn?1:.3,t);
    // The far end's meter: noisy until the noise is removed and the beams lock.
    room.farEnd(room.displays.left,{talk:-1,self:'wide',meter:{label:'What the far end hears',clean:removed>.5},t});
    // Tags.
    micTag.visible=!sensor&&t<10;
    emptyTag.visible=sensor&&framed!=='portrait'&&t>T.swing[1];
    coffeeTag.visible=ventTag.visible=sensor&&framed!=='portrait'&&t>T.removed;
    farTag.visible=farTagV.visible=false;   // the review's overlay label carries it; tags stay for a later phone layout
  }
  update(0,{variation:null,chapter:0,chapterId:'scene',sensor:false});

  return{
    anchors:{talkerA:A.group,talkerB:B.group,mic:mic.group,farEnd:farEndAnchor},
    sensors:{'mic-view':{camera:cam,mode:'mask',targets:[A.group,B.group],label:'Ceiling Microphone Pro',title:'Microphone view'}},
    update,
    metrics:()=>({beams:{talkerA:iA,talkerB:iB,emptySeats:iE},visibleBeams:fan.beams.filter(b=>b.mesh.visible).length}),
  };
}
