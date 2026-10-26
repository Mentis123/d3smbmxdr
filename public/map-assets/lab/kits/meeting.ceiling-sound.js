// C3 "Every seat hears it the same" (Meeting Room AI Lab, Ceiling Speaker Pro). Storyboard:
// docs/three-worlds/MEETING-ROOM-LAB-PLAN.md s3. A remote person speaks; at first the sound comes only from the display at
// the front and fades before it reaches the back row, where people lean in. The four Ceiling Speaker Pros come online one
// by one, each fed by its own cable from the room engine (audio over IP). Through the device: the sound view. Each
// speaker's coverage is drawn down onto the seats and wavefronts leave the four speakers at different moments, the rear
// ones a little later, so they reach the back row together (datasheet: automatic self-calibration of gain and delay).
// The remote voice comes from the left pair, where her picture is (spatial playback of remote voices).
// Variation "in-room voice": the presenter speaks in the room and only the rear pair lifts the voice for the back rows
// (datasheet: local presenter reinforcement). Wavefronts are slowed right down to be seen. Pure function of t and ctx.
// No amplifier: at the start of the Change chapter the old way appears as a red outline (an amplifier rack in the corner
// and a speaker cable to every speaker), is crossed out, and dissolves as each speaker lights on its own PoE+ cable
// (data sheet: single-cable IP, PoE+ powered, built-in DSP; the owner's point: no amplifier for multiple speakers).
import {stageRoom,seatedFigure,speechRibbon,beamFan,shells,tagSprite,ACCENT,CSS,P} from '../rigs/cisco-room.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const C=2.4,EAR=[0,1.45,3.68],PERIOD=.9;                       // drawn speed of sound (slowed), the back-row target
const ON=[6.3,6.7,7.1,7.5],LIVE=8.0;                           // speakers come online in turn; the voice moves to them
const GHOST=[4.3,4.9,6.0,7.0];                                 // the amplifier rack: fade in, crossed out, dissolve start, gone
const RACK=[3.7,0,-1.0];
const T={leanEnd:6.2,aiArrive:13.2,cable:16,cableEnd:19};
const DISPLAY_SRC=[P.displays.x[0],P.displays.y,P.displays.z+.12];

export function buildKit(k){
  const {THREE,root}=k;
  const room=stageRoom(k,{hero:['r2-4','r2-5']});
  const G=room.group,spk=room.devices.spk;
  const L1=seatedFigure(k,room,'r2-4'),L2=seatedFigure(k,room,'r2-5');
  const faces=P.spk.map(p=>[p[0],p[1]-.05,p[2]]);
  const dist=faces.map(f=>Math.hypot(f[0]-EAR[0],f[1]-EAR[1],f[2]-EAR[2]));

  // ---- sound: wavefront pool, arrival flashes, coverage lobes ----
  const waves=shells(k,{parent:G,n:28,colour:ACCENT.speaker,half:'down',opacity:.62});
  const front=shells(k,{parent:G,n:6,colour:0xd8c8ff,half:'full',opacity:.5});
  const flash=shells(k,{parent:G,n:3,colour:0x5dff9a,half:'full',opacity:.7});
  const lobes=beamFan(k,{parent:G,n:4,colour:ACCENT.speaker,half:1.0});
  const ribP=speechRibbon(k,{parent:G,colour:0x5dff9a});

  // ---- the sound view: from the back-right corner, high, looking across the rows to the front ----
  const cam=new THREE.PerspectiveCamera(48,1.6,.05,60);cam.userData.portraitWidth=.72;G.add(cam);
  cam.position.set(4.6,3.1,6.2);G.updateMatrixWorld(true);cam.lookAt(G.localToWorld(new THREE.Vector3(-.6,.55,.6)));

  // ---- back-row zone for the overlay ----
  const zone=new THREE.Group();zone.name='back-row';G.add(zone);
  const zm=new THREE.Mesh(k.track(new THREE.BoxGeometry(1,1,1)),k.mat(0xffffff));zm.visible=false;zone.add(zm);
  zone.position.set(0,P.riser.h+.8,3.68);zone.scale.set(2.9,1.3,.8);

  const spkTag=tagSprite(k,['CEILING SPEAKER PRO','Power and audio on one cable · PoE+'],CSS.speaker,1.9,{parent:G,x:P.spk[0][0]+.3,y:3.35,z:P.spk[0][2]+.2});
  const ampTag=tagSprite(k,['NO AMPLIFIER RACK','Each speaker is powered by its own cable'],'#ff6b5e',2.2,{parent:G,x:RACK[0]-.7,y:2.05,z:RACK[2]+.3});

  // ---- the old way, as a red outline: an equipment rack with three amplifiers and a speaker run to every speaker ----
  const ghost=new THREE.Group();ghost.name='amplifier-rack-ghost';G.add(ghost);
  const ghostFill=k.track(new THREE.MeshBasicMaterial({color:0xff4b3e,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  const ghostLine=k.track(new THREE.LineBasicMaterial({color:0xff7a6e,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
  const gbox=(w,h,d,x,y,z)=>{const geo=k.track(new THREE.BoxGeometry(w,h,d));const m=new THREE.Mesh(geo,ghostFill);m.position.set(x,y,z);m.userData.sensorKeep=true;m.userData.noFit=true;ghost.add(m);
    const e=new THREE.LineSegments(k.track(new THREE.EdgesGeometry(geo)),ghostLine);e.position.copy(m.position);e.userData.noFit=true;ghost.add(e);return m;};
  gbox(.62,1.25,.62,RACK[0],.625,RACK[2]);
  for(let i=0;i<3;i++){gbox(.56,.13,.05,RACK[0],.45+i*.2,RACK[2]+.32);for(const kx of [-.18,0,.18])gbox(.04,.04,.03,RACK[0]+kx,.45+i*.2,RACK[2]+.36);}
  gbox(.56,.09,.05,RACK[0],1.08,RACK[2]+.32);
  // Speaker runs: up the wall from the rack, along the ceiling to each speaker.
  for(const f of faces){const pts=[[RACK[0]+.2,1.25,RACK[2]],[RACK[0]+.2,P.TRAY+.1,RACK[2]],[f[0],P.TRAY+.1,RACK[2]],[f[0],P.TRAY+.1,f[2]],[f[0],f[1]+.1,f[2]]].map(p=>new THREE.Vector3(...p));
    const ln=new THREE.Line(k.track(new THREE.BufferGeometry().setFromPoints(pts)),ghostLine);ln.userData.noFit=true;ghost.add(ln);}
  // The cross: two red bars over the rack.
  const crossM=k.track(new THREE.MeshBasicMaterial({color:0xff3b2e,transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));
  const cross=new THREE.Group();cross.position.set(RACK[0],.7,RACK[2]+.35);G.add(cross);
  for(const s of [-1,1]){const bar=new THREE.Mesh(k.track(new THREE.BoxGeometry(1.25,.07,.02)),crossM);bar.rotation.z=s*.78;bar.renderOrder=9;bar.userData.noFit=true;bar.userData.sensorKeep=true;cross.add(bar);}

  function update(t,ctx){
    const v=!!ctx.variation,sensor=!!ctx.sensor,ai=ctx.chapter>=2;
    room.update(t,{ambient:true});
    // The remote voice (tile 0, on the left display) talks throughout; in the variation the presenter talks instead.
    const remote=!v,presenterTalk=v&&t>4.6;
    room.farEnd(room.displays.left,{talk:remote&&Math.sin(t*2.2)>-.6?0:-1,self:'wide'});
    // Before the speakers: shells from the display, fading long before the back row.
    front.hide();
    if(t<LIVE&&remote){for(let j=0;j<6;j++){const te=Math.floor(t/.8)*.8-j*.8;if(te<0)continue;const r=C*(t-te),a=Math.max(0,1-r/4.6)*(1-smooth(LIVE-.8,LIVE,t));front.set(j,DISPLAY_SRC,r,a);}}
    // The speakers come online one by one: light ring and their own cable from the room engine.
    spk.forEach((d,i)=>d.led(t>ON[i]?(.55+.45*smooth(ON[i],ON[i]+.3,t)*(1-smooth(ON[i]+.6,ON[i]+1.2,t)))*(v&&i<2?.25:1):.08,t));
    ['spkFL','spkFR','spkRL','spkRR'].forEach((id,i)=>room.cables[id].update(t,(t>ON[i]&&t<ON[i]+1.4)||(ai&&t>T.cable&&t<T.cableEnd)?1:0));
    room.devices.codec.led(t>ON[0]?.8:.3,t);
    // Wavefronts from the ceiling speakers, timed so each one arrives at the back row together (the delay calibration).
    // Left pair louder (the remote picture is on the left); variation: rear pair only, the presenter's voice.
    const gain=v?[0,0,1,.9]:[1,.55,1,.55];
    let n=0;waves.hide();
    if(t>LIVE){for(let kk=0;kk<6;kk++){const arrive=T.aiArrive+Math.round((t-T.aiArrive)/PERIOD)*PERIOD-kk*PERIOD+PERIOD*2;
        for(let i=0;i<4;i++){if(!gain[i])continue;const te=arrive-dist[i]/C;if(t<te||te<LIVE)continue;const r=C*(t-te);
          const a=gain[i]*(1-smooth(dist[i]+.1,dist[i]+1.4,r))*smooth(0,.25,r);if(a>.01&&n<28)waves.set(n++,faces[i],r,a,v?0x5dff9a:ACCENT.speaker);}}}
    // Arrival flash at the back row in the sound view.
    flash.hide();
    if(sensor){for(let j=0;j<3;j++){const ta=T.aiArrive+Math.floor((t-T.aiArrive)/PERIOD)*PERIOD-j*PERIOD;const dt=t-ta;if(ta<T.aiArrive-1e-6||dt<0||dt>.7)continue;flash.set(j,EAR,.12+dt*1.6,1-dt/.7);}}
    // Coverage lobes (120 degrees) in the sound view only.
    lobes.beams.forEach((b,i)=>b.set(faces[i],[0,-1,0],2.25,sensor&&gain[i]?.09:0,ACCENT.speaker));
    // People: the back row leans in to hear until the speakers take over, then sits back. The crowd follows the voice.
    const lean=1-smooth(LIVE-.4,T.leanEnd+.6,t);
    for(const [f,ph] of [[L1,0],[L2,1.3]])f.pose(t,{turn:wrap(Math.atan2(P.displays.x[0]-f.seat.x,P.displays.z-f.seat.z)-f.seat.ry)*.6,lean:.08+.32*lean,look:.05,mode:'lap',to:'think',mix:lean*(ph?0:1)});
    for(const q of room.seats){if(!q.occupied||q.hero)continue;const row=q.id.startsWith('r2')?1:q.id.startsWith('r1')?.6:.2;
      const focus=v?[room.presenter.group.position.x,1.6,room.presenter.group.position.z]:[P.displays.x[0],P.displays.y,P.displays.z];
      const turn=wrap(Math.atan2(focus[0]-q.x,focus[2]-q.z)-q.ry);room.crowd.pose(q.id,{turn:Math.max(-1.2,Math.min(1.2,turn)),look:.08,lean:.06+.22*lean*row});}
    room.crowd.commit();
    // Variation: the presenter speaks in the room.
    const pp=room.presenter.group.position;room.presenter.pose({distance:0,weight:0,look:.05,point:presenterTalk?.3*Math.max(0,Math.sin(t*1.4)):0,pointPitch:1.1});
    ribP.draw([pp.x,1.72,pp.z],P.micFront,presenterTalk&&!sensor?1:0,t,{lift:.1,width:.025});
    spkTag.visible=!sensor&&t>ON[0]&&t<10;
    // The amplifier rack that is not needed: in, crossed out, gone as the speakers come alive on their own cables.
    const g=smooth(GHOST[0],GHOST[1],t)*(1-smooth(GHOST[2],GHOST[3],t))*(ai?0:1);
    ghost.visible=g>.01;ghostFill.opacity=.1*g;ghostLine.opacity=.9*g;
    const x=smooth(GHOST[1],GHOST[1]+.35,t)*(1-smooth(GHOST[2],GHOST[3],t))*(ai?0:1);crossM.opacity=.85*x;cross.visible=x>.01;cross.scale.setScalar(.6+.4*x);
    ampTag.visible=!sensor&&t>GHOST[1]&&t<ON[3]+.6;
  }
  update(0,{variation:null,chapter:0,chapterId:'scene',sensor:false});

  return{
    anchors:{backRow:zone,speaker:spk[0].group,listener:L1.group},
    sensors:{'sound-view':{camera:cam,mode:'mask',targets:[...spk.map(d=>d.group),L1.group,L2.group],label:'Ceiling Speaker Pro',title:'Sound view'}},
    update,
    metrics:()=>({distances:dist.map(d=>+d.toFixed(2)),waves:waves.items.filter(w=>w.mesh.visible).length}),
  };
}
