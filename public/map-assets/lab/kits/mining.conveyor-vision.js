// M1 "Catch a growing conveyor build-up": transfer 3. A feed belt drops ore through a chute onto the main belt.
// Rocks ride one continuous path (feed belt -> fall -> chute spoon -> main belt -> next transfer) at belt speed;
// one stationary clump grows at the chute outlet while its neighbours keep moving. Everything is a function of t.
const V=.55;                       // belt speed, m/s (texture, rollers and rocks all use it)
const Z0=.2,BELT_Y=1.0,HEAD_X=2.95,TAIL_X=-2.3;
const FEED_X=-1.2,FEED_Y=2.35,FEED_TAIL=-2.05,FEED_HEAD=-.3;
const SPOON=[[-1.72,2.0],[-.8,1.2]];   // chute spoon plate, (x,y) top and lip
const CLUMP={x:-.58,y:1.27,z:.36};
const STICK0=4.9,STICK1=10.6,GROW1=11;   // front-loaded: the clump is mostly formed before the AI view at 10 s
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const spoonY=x=>SPOON[0][1]+(x-SPOON[0][0])/(SPOON[1][0]-SPOON[0][0])*(SPOON[1][1]-SPOON[0][1]);

export function buildKit(k){
  const {THREE,root,box,cylinder,bar,mesh,mat,steel,dark,yellow,track,props,actors}=k;
  const ore=mat(0x7d6d5c,{roughness:.95}),ore2=mat(0x6a6058,{roughness:.95}),wet=mat(0x8a6238,{roughness:.45,emissive:0x2a1806,emissiveIntensity:.5}),cake=mat(0x9a7444,{roughness:.4,emissive:0x2e1c08,emissiveIntensity:.55});   // wet fines: warm clay, lifted out of the chute shadow
  const frame=mat(0x2f4552,{metalness:.55,roughness:.5}),chuteSteel=mat(0x7b8a92,{metalness:.5,roughness:.55}),liner=mat(0x56636b,{metalness:.4,roughness:.6});
  const hazard=mat(0xf2b134,{roughness:.6});
  // Belt rubber: wear marks on a canvas texture, scrolled at belt speed.
  const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.fillStyle='#1c2326';g.fillRect(0,0,256,64);
  for(let i=0;i<70;i++){g.fillStyle=i%3?'#262f33':'#323c40';g.fillRect(rnd(i,1)*256,rnd(i,2)*64,4+rnd(i,3)*18,1+rnd(i,4)*2);}
  for(const x of [0,128]){g.fillStyle='#39454a';g.fillRect(x,0,5,64);}
  const beltTex=track(new THREE.CanvasTexture(c));beltTex.wrapS=beltTex.wrapT=THREE.RepeatWrapping;beltTex.colorSpace=THREE.SRGBColorSpace;
  const TILE=.9;
  const beltLen=HEAD_X-TAIL_X,beltTexB=beltTex;beltTexB.repeat.set(beltLen/TILE,1);
  const beltB=mat(0xffffff,{map:beltTexB,roughness:.9});
  const beltTexA=track(beltTex.clone());beltTexA.needsUpdate=true;beltTexA.repeat.set((FEED_HEAD-FEED_TAIL)/TILE,1);
  const beltA=mat(0xffffff,{map:beltTexA,roughness:.9});
  // Rollers carry one dark stripe so their turning is visible; angular speed matches the belt.
  const sc=document.createElement('canvas');sc.width=64;sc.height=4;const sg=sc.getContext('2d');sg.fillStyle='#8d989e';sg.fillRect(0,0,64,4);sg.fillStyle='#2b3439';sg.fillRect(0,0,14,4);
  const stripe=track(new THREE.CanvasTexture(sc));stripe.colorSpace=THREE.SRGBColorSpace;
  const rollerMat=mat(0xffffff,{map:stripe,metalness:.45,roughness:.4}),pulleyMat=mat(0x8a959b,{map:stripe,metalness:.5,roughness:.45});
  const spinners=[];
  function roller(a,b,r,material=rollerMat){const o=bar(a,b,r,material===dark?pulleyMat:material);o.userData.spin=V/r;o.userData.base=o.quaternion.clone();spinners.push(o);return o;}

  // ---- Main belt B, troughed, along +x ----
  box(beltLen,.014,.46,beltB,(HEAD_X+TAIL_X)/2,BELT_Y,Z0);
  for(const s of [-1,1]){const w=box(beltLen,.014,.3,beltB,(HEAD_X+TAIL_X)/2,BELT_Y+.062,Z0+s*.36);w.rotation.x=s*.44;}
  box(beltLen,.012,.92,mat(0x161c1f,{roughness:.9}),(HEAD_X+TAIL_X)/2,.64,Z0);                                // return belt
  for(const s of [-1,1])box(beltLen+.2,.13,.07,frame,(HEAD_X+TAIL_X)/2,.86,Z0+s*.62);                       // stringers
  for(let x=TAIL_X+.35;x<HEAD_X-.15;x+=.42){
    box(.06,.05,1.28,frame,x,.88,Z0);
    roller([x,BELT_Y-.06,Z0-.22],[x,BELT_Y-.06,Z0+.22],.052);
    for(const s of [-1,1])roller([x,BELT_Y-.035,Z0+s*.25],[x,BELT_Y+.045,Z0+s*.45],.04);
  }
  for(let x=TAIL_X+.6;x<HEAD_X;x+=1.05)roller([x,.6,Z0-.46],[x,.6,Z0+.46],.045);
  for(const x of [-2.15,-1.0,.25,1.5,2.75])for(const s of [-1,1]){bar([x,0,Z0+s*.62],[x,.86,Z0+s*.62],.04,frame);box(.18,.03,.18,dark,x,.015,Z0+s*.62);}
  roller([HEAD_X,BELT_Y-.17,Z0-.5],[HEAD_X,BELT_Y-.17,Z0+.5],.17,dark);
  roller([TAIL_X,BELT_Y-.15,Z0-.5],[TAIL_X,BELT_Y-.15,Z0+.5],.15,dark);
  // Next transfer: a receiving hopper past the head pulley.
  const hop=[3.26,.9,Z0];box(.05,.9,.8,chuteSteel,hop[0]+.23,.45,Z0);box(.46,.9,.05,chuteSteel,hop[0],.45,Z0-.4);box(.46,.9,.05,chuteSteel,hop[0],.45,Z0+.4);box(.05,.62,.8,chuteSteel,hop[0]-.23,.31,Z0);
  for(const s of [-1,1])box(.5,.05,.07,hazard,hop[0],.92,Z0+s*.42);
  props.plate('TO TRANSFER 4',.62,.15,{x:hop[0]+.26,y:.6,z:Z0,ry:Math.PI/2});

  // ---- Feed belt A along +z, entering the chute from behind ----
  const feedLen=FEED_HEAD-FEED_TAIL,feedMid=(FEED_HEAD+FEED_TAIL)/2;
  box(feedLen,.014,.62,beltA,FEED_X,FEED_Y,feedMid).rotation.y=-Math.PI/2;   // local +x -> world +z, so the texture runs with the ore
  for(const s of [-1,1])box(.07,.12,feedLen+.3,frame,FEED_X+s*.42,FEED_Y-.1,feedMid-.1);
  for(let z=FEED_TAIL+.25;z<FEED_HEAD-.1;z+=.42){roller([FEED_X-.3,FEED_Y-.05,z],[FEED_X+.3,FEED_Y-.05,z],.045);box(.86,.04,.05,frame,FEED_X,FEED_Y-.12,z);}
  roller([FEED_X-.34,FEED_Y-.14,FEED_HEAD],[FEED_X+.34,FEED_Y-.14,FEED_HEAD],.14,dark);
  roller([FEED_X-.34,FEED_Y-.12,FEED_TAIL],[FEED_X+.34,FEED_Y-.12,FEED_TAIL],.12,dark);
  for(const z of [-1.95,-1.05])for(const s of [-1,1]){bar([FEED_X+s*.42,0,z],[FEED_X+s*.42,FEED_Y-.15,z],.045,frame);box(.18,.03,.18,dark,FEED_X+s*.42,.015,z);}
  for(const z of [-1.95,-1.05])bar([FEED_X-.42,1.2,z],[FEED_X+.42,1.2,z],.03,frame);

  // ---- Transfer chute: front cut away (yellow trim) so the falling ore and the outlet stay visible ----
  box(.05,1.65,1.3,chuteSteel,-1.75,1.94,.1);                     // left wall
  box(1.1,1.0,.05,chuteSteel,-1.2,1.65,-.55);                     // back wall under the feed belt
  box(1.1,.3,.05,chuteSteel,-1.2,2.62,-.55);                      // hood back above the feed belt
  box(.05,1.18,1.3,chuteSteel,-.65,2.17,.1);                      // right wall, open below 1.58 (the outlet)
  box(1.15,.05,.85,chuteSteel,-1.2,2.77,-.13);                    // hood roof (back part)
  const sp=box(Math.hypot(SPOON[1][0]-SPOON[0][0],SPOON[1][1]-SPOON[0][1]),.05,1.26,liner,(SPOON[0][0]+SPOON[1][0])/2,(SPOON[0][1]+SPOON[1][1])/2-.03,.1);
  sp.rotation.z=Math.atan2(SPOON[1][1]-SPOON[0][1],SPOON[1][0]-SPOON[0][0]);
  for(const [a,b] of [[[-1.75,1.12,.76],[-1.75,2.78,.76]],[[-.65,1.58,.76],[-.65,2.78,.76]],[[-1.77,2.78,.76],[-.63,2.78,.76]],[[-.65,1.58,-.55],[-.65,1.58,.76]]])bar(a,b,.03,hazard);
  // Skirt boards along the loading zone, low enough to see the outlet over them.
  for(const s of [-1,1]){box(2.15,.15,.04,liner,-.7,BELT_Y+.12,Z0+s*.5);box(2.15,.018,.046,hazard,-.7,BELT_Y+.2,Z0+s*.5);}
  props.plate('TRANSFER 3',.7,.17,{x:-.62,y:2.45,z:.1,ry:Math.PI/2});

  // ---- Inspection camera on a post (the sensor), site cabinet, pulse route ----
  // Post on the walkway side, downstream of the chute: the camera looks back up the belt into the outlet,
  // clear of the chute walls, and stays in the scene shots so the viewer knows where the picture comes from.
  const post=[1.95,1.42];bar([post[0],0,post[1]],[post[0],2.35,post[1]],.05,steel);box(.26,.04,.26,dark,post[0],.02,post[1]);
  bar([post[0],2.3,post[1]],[1.78,2.28,1.27],.035,steel);
  props.plate('CHUTE CAM 3',.5,.13,{x:post[0],y:1.6,z:post[1]+.06,ry:.5});
  const lens=new THREE.Vector3(1.75,2.26,1.24),look=new THREE.Vector3(CLUMP.x-.02,CLUMP.y-.02,CLUMP.z);
  const housing=new THREE.Group();housing.position.copy(lens);housing.lookAt(look);root.add(housing);
  const camBody=mat(0x2a3238,{roughness:.45,metalness:.3});
  const hb=box(.15,.14,.32,camBody,0,0,0);housing.add(hb);hb.position.set(0,0,0);
  const hood=box(.19,.022,.4,dark,0,0,0);housing.add(hood);hood.position.set(0,.085,.05);
  const ring=cylinder(.062,.04,mat(0xc9d2d7,{metalness:.7,roughness:.3}),0,0,0);housing.add(ring);ring.rotation.x=Math.PI/2;ring.position.set(0,0,.175);
  const glass=cylinder(.046,.02,mat(0x0a1720,{metalness:.8,roughness:.08}),0,0,0);housing.add(glass);glass.rotation.x=Math.PI/2;glass.position.set(0,0,.19);
  const tally=box(.025,.025,.01,mat(0xff4b3e,{emissive:0xff2a1a,emissiveIntensity:.9}),0,0,0);housing.add(tally);tally.position.set(.05,.045,.161);
  const sensorCam=new THREE.PerspectiveCamera(34,1,.05,30);sensorCam.position.copy(lens).add(new THREE.Vector3().subVectors(look,lens).normalize().multiplyScalar(.25));sensorCam.lookAt(look);root.add(sensorCam);
  const cabinet=props.siteCabinet(2.45,-1.45,{rotation:-.35,label:'SITE GPU'});
  const port=cabinet.port();
  const OP_START=[2.95,0,-.92];   // beside the cabinet, on the far side of the belt
  const pulse=props.pulse([[1.78,2.29,1.27],[post[0],2.31,post[1]-.06],[post[0],.035,post[1]-.06],[post[0],.035,-1.85],[2.2,.035,-1.85],port.map((v,i)=>i===1?.035:v),port,
    port.map((v,i)=>i===1?.035:v),[OP_START[0],.035,-1.6],[OP_START[0],.035,OP_START[2]-.12]]);

  // ---- Moving ore: one continuous path per rock ----
  const ROCKS=110,rockGeo=[0,1,2,3].map(i=>{const g=track(new THREE.DodecahedronGeometry(1,0)),a=g.attributes.position;for(let j=0;j<a.count;j++){const x=a.getX(j),y=a.getY(j),z=a.getZ(j),n=1+.22*Math.sin(x*5.3+y*3.1+i*1.9)+.14*Math.cos(z*6.1-x*2.2+i);a.setXYZ(j,x*n*(1+.15*(i%2)),y*n*.85,z*n);}g.computeVertexNormals();return g;});
  const rocks=[];
  for(let i=0;i<ROCKS;i++){
    const r=.035+rnd(i,7)*.04,lane=rnd(i,8)*2-1,o=mesh(rockGeo[i%4],i%3?ore:ore2);o.scale.set(r*(1+rnd(i,9)*.35),r*.8,r*(1+rnd(i,10)*.3));o.rotation.set(rnd(i,11)*6,rnd(i,12)*6,rnd(i,13)*6);
    // Segment durations: feed belt, fall, spoon slide, main belt, drop.
    const xA=FEED_X+lane*.2,yA=FEED_Y+.012+r*.8,landY=spoonY(xA)+r*.8,tf=Math.sqrt(2*Math.max(.05,yA-landY)/9.8),zLand=FEED_HEAD+V*tf;
    const slideLen=Math.hypot(SPOON[1][0]-xA,SPOON[1][1]-landY),tSlide=slideLen/1.3;
    const dA=(FEED_HEAD-FEED_TAIL)/V,dB=(HEAD_X+.05-(-.6))/V,tDrop=.42;
    const period=dA+tf+tSlide+.12+dB+tDrop;
    rocks.push({o,r,lane,xA,yA,landY,tf,zLand,tSlide,dA,dB,tDrop,period,offset:(i/ROCKS)*period+rnd(i,14)*.08});
  }
  // Where the outlet lets rocks through: the clump takes the near side, so lanes squeeze to the far side.
  const growth=t=>smooth(STICK0,GROW1,t)**.7;
  const exitZ=(lane,gr)=>{const free=Z0+lane*.2,squeezed=Z0-.27+(lane+1)/2*.22;return free+(squeezed-free)*gr;};
  function placeRock(R,t){
    let s=((t+R.offset)%R.period+R.period)%R.period;const o=R.o,y0=R.r*.8+.012;o.visible=true;
    if(s<R.dA){o.position.set(R.xA,R.yA,FEED_TAIL+.05+s*V);return;}s-=R.dA;
    if(s<R.tf){o.position.set(R.xA,R.yA-4.9*s*s,FEED_HEAD+V*s);return;}s-=R.tf;
    const exitTime=t-(s>R.tSlide+.12?s-R.tSlide-.12:0),ez=exitZ(R.lane,growth(exitTime));
    if(s<R.tSlide){const u=s/R.tSlide;o.position.set(R.xA+(SPOON[1][0]-R.xA)*u,R.landY+(SPOON[1][1]+R.r*.8-R.landY)*u,R.zLand+(ez-R.zLand)*u);o.rotation.z=-s*5;return;}s-=R.tSlide;
    if(s<.12){const u=s/.12;o.position.set(SPOON[1][0]+u*.2,SPOON[1][1]+R.r*.8+(BELT_Y+y0-SPOON[1][1]-R.r*.8)*u,ez);return;}s-=.12;
    if(s<R.dB){o.position.set(-.6+s*V,BELT_Y+y0,ez);return;}s-=R.dB;
    o.position.set(HEAD_X+.05+V*s,BELT_Y+y0-4.9*s*s,ez);o.visible=o.position.y>.95;
  }

  // ---- The build-up: wet fines cake plus stuck rocks, each arriving from the outlet stream and then staying ----
  const buildup=new THREE.Group();buildup.name='buildup-material';root.add(buildup);
  const cakeGeo=track(new THREE.IcosahedronGeometry(1,3)),pa=cakeGeo.attributes.position;
  for(let i=0;i<pa.count;i++){const v=new THREE.Vector3().fromBufferAttribute(pa,i),n=1+.16*Math.sin(v.x*5.1+v.y*3.3)+.1*Math.sin(v.z*7.7-v.y*4.1);v.multiplyScalar(n);if(v.y<-.3)v.y=-.3-(v.y+.3)*.2;pa.setXYZ(i,v.x,v.y,v.z);}
  cakeGeo.computeVertexNormals();
  const cakeMesh=mesh(cakeGeo,cake);buildup.add(cakeMesh);cakeMesh.position.set(CLUMP.x+.02,CLUMP.y-.06,CLUMP.z);
  const STUCK=28,stuck=[];
  for(let i=0;i<STUCK;i++){
    const u=i/(STUCK-1),a=rnd(i,21)*Math.PI*2,rad=Math.sqrt(rnd(i,22));
    const dx=Math.cos(a)*rad*.3,dz=Math.sin(a)*rad*.16,h=(1-rad*rad)*.3;
    const r=.045+rnd(i,23)*.04,o=mesh(rockGeo[(i+1)%4],i%6===0?ore:wet);buildup.add(o);
    o.scale.set(r*1.2,r*.85,r*1.1);o.rotation.set(rnd(i,24)*6,rnd(i,25)*6,rnd(i,26)*6);
    const to=new THREE.Vector3(CLUMP.x+dx,CLUMP.y-.16+h+rnd(i,27)*.1,CLUMP.z+dz),at=STICK0+(STICK1-STICK0)*u**1.25;
    stuck.push({o,to,at,from:new THREE.Vector3(SPOON[1][0]-.05,SPOON[1][1]+.12,CLUMP.z-.18)});
  }
  // Overlay / subject zone: the region the camera watches at the outlet (invisible).
  const zone=new THREE.Group();zone.name='buildup-zone';root.add(zone);
  const zm=mesh(track(new THREE.BoxGeometry(.62,.36,.4)),mat(0xffffff),CLUMP.x,CLUMP.y-.02,CLUMP.z);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);

  // ---- Dust (the "unsure" variation) ----
  const dc=document.createElement('canvas');dc.width=dc.height=64;const dg=dc.getContext('2d'),grad=dg.createRadialGradient(32,32,2,32,32,32);grad.addColorStop(0,'rgba(255,255,255,.9)');grad.addColorStop(1,'rgba(255,255,255,0)');dg.fillStyle=grad;dg.fillRect(0,0,64,64);
  const dustTex=track(new THREE.CanvasTexture(dc));
  const dust=[];for(let i=0;i<9;i++){const m=track(new THREE.SpriteMaterial({map:dustTex,color:0xcdbb9f,transparent:true,depthWrite:false,opacity:0}));const s=new THREE.Sprite(m);s.userData.noFit=true;root.add(s);dust.push({s,m,i});}
  const lensDust=new THREE.Sprite(track(new THREE.SpriteMaterial({map:dustTex,color:0xd8c8ae,transparent:true,depthWrite:false,opacity:0})));lensDust.position.set(-.04,.02,-.4);lensDust.scale.set(.9,.7,1);sensorCam.add(lensDust);

  // ---- Operator: appears at review and walks to the chute ----
  const op=actors.person({vest:0xff7a1a,name:'operator'});
  const OP_END=[.22,0,-.98],OP_PATH=[OP_START,[1.9,0,-1.0],OP_END],OP_T0=18.2,OP_T1=21.8,OP_FACE=Math.atan2(CLUMP.x-OP_END[0],CLUMP.z-OP_END[2]);

  function update(t,ctx){
    const tex=-(t*V/TILE)%1;beltTexB.offset.x=tex;beltTexA.offset.x=tex;
    for(const o of spinners){o.quaternion.copy(o.userData.base);o.rotateY(-t*o.userData.spin);}
    for(const R of rocks)placeRock(R,t);
    const gr=growth(t);cakeMesh.visible=gr>.01;cakeMesh.scale.set(.34*gr+.02,.25*gr+.02,.24*gr+.02);
    for(const S of stuck){const u=(t-S.at)/.4;S.o.visible=u>=0;if(u<0)continue;const e=Math.min(1,u),p=S.o.position;p.lerpVectors(S.from,S.to,e*e*(3-2*e));p.y+=Math.sin(Math.min(1,e)*Math.PI)*.08;}
    const dusty=ctx.variation==='dust',dAmt=dusty?smooth(4.4,8.5,t):0;
    for(const D of dust){D.m.opacity=dAmt*(.32+.12*Math.sin(t*.7+D.i));const a=D.i*.9+t*.12;D.s.position.set(CLUMP.x+.2+Math.cos(a)*.45,CLUMP.y+.15+Math.sin(D.i*1.7+t*.3)*.25,CLUMP.z+.1+Math.sin(a)*.35);D.s.scale.setScalar(.9+.3*Math.sin(D.i));D.s.visible=dAmt>0;}
    lensDust.material.opacity=dusty&&ctx.sensor?.88:0;lensDust.visible=dusty&&ctx.sensor;
    // The pulse runs in the AI view and on into Review while the camera pulls out to show camera, cabinet and operator.
    const active=ctx.chapterId==='aiView'||(ctx.chapterId==="review"&&t<OP_T0+1.2);
    cabinet.update(t,active);pulse.update(t,active);
    const shown=t>=OP_T0-.3;op.group.visible=shown;
    if(shown){const f=actors.followPath(op.group,OP_PATH,OP_T0,OP_T1,t);
      if(f.done){const turn=smooth(OP_T1,OP_T1+.8,t);const h=f.heading+Math.atan2(Math.sin(OP_FACE-f.heading),Math.cos(OP_FACE-f.heading))*turn;op.group.rotation.y=h;}
      const lookIn=f.done?smooth(OP_T1+.3,OP_T1+1.3,t):0;
      op.pose({distance:f.distance,weight:f.moving?f.weight:0,look:.05+.3*lookIn,lean:.08*lookIn,point:f.done?smooth(OP_T1+.8,OP_T1+1.7,t):0});}
  }
  return{anchors:{buildup:zone,chute:sp},sensors:{'chute-cam':{camera:sensorCam,mode:'mask',targets:[buildup],label:'Chute camera 3'}},update,
    metrics:()=>({stuckVisible:stuck.filter(s=>s.o.visible).length,rocks:ROCKS,operatorVisible:op.group.visible,operator:op.group.position.toArray()})};
}
