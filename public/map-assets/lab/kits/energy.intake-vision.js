// E1 "Keep the water moving": a dam intake. Water flows (toward -z) over a shallow channel into an inclined trash
// rack in front of the intake mouth. The channel is cut away on the viewer's side so bars, debris and flow read.
// Leaves drift through; one branch catches; more debris gathers behind it; flow dots thin behind the mat.
const WATER_Y=1.0,DECK_Y=1.55,RACK_Z0=-.48,RACK_LEAN=.2,FLOW=.42;
const CX=.15,FRONT_Z=2.15;
const CATCH_T=6.5,GATHER0=7.1,GATHER1=15;
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};
const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const rackZ=y=>RACK_Z0-(y/DECK_Y)*RACK_LEAN;

export function buildKit(k){
  const {THREE,root,box,cylinder,bar,mesh,mat,steel,dark,yellow,concrete,track,props,actors}=k;
  const wetConcrete=mat(0x6f7b7e,{roughness:.9}),bed=mat(0x3d4a45,{roughness:1}),rackSteel=mat(0xb8c4ca,{metalness:.65,roughness:.3});
  const wood=mat(0x6b4a2e,{roughness:.9}),bark=mat(0x51392a,{roughness:.95}),leafG=mat(0x6e8f3a,{roughness:.8,side:THREE.DoubleSide}),leafY=mat(0xb08a35,{roughness:.8,side:THREE.DoubleSide}),leafB=mat(0x7a5530,{roughness:.85,side:THREE.DoubleSide});
  const weed=mat(0x4f5a2c,{roughness:.9}),foamM=mat(0xe8f4f6,{roughness:.6,transparent:true,opacity:.85});

  // ---- Channel: bed, far wall, cut-away near wall (hazard-striped cut), deck and intake headwall ----
  box(3.8,.06,FRONT_Z+.5,bed,0,.03,(FRONT_Z-.5)/2);
  box(.45,DECK_Y,3.75,concrete,-2.125,DECK_Y/2,.3);
  const cut=document.createElement('canvas');cut.width=128;cut.height=16;const cg=cut.getContext('2d');for(let i=0;i<16;i++){cg.fillStyle=i%2?'#1b1f22':'#f2b134';cg.beginPath();cg.moveTo(i*16-16,16);cg.lineTo(i*16,0);cg.lineTo(i*16+8,0);cg.lineTo(i*16-8,16);cg.fill();}
  const cutTex=track(new THREE.CanvasTexture(cut));cutTex.wrapS=THREE.RepeatWrapping;cutTex.repeat.set(6,1);cutTex.colorSpace=THREE.SRGBColorSpace;
  const cutMat=mat(0xffffff,{map:cutTex,roughness:.7});
  box(.45,.32,2.7,concrete,2.125,.16,.8);box(.47,.02,2.72,cutMat,2.125,.33,.8);         // near wall, cut low
  box(4.7,.3,.45,concrete,0,.15,FRONT_Z+.02);box(4.72,.02,.47,cutMat,0,.31,FRONT_Z+.02); // front sill, cut low
  box(4.7,DECK_Y,.9,concrete,0,DECK_Y/2,-1.15);                                           // deck block / headwall
  box(3.3,.82,.04,mat(0x04080b,{roughness:1}),0,.5,-.69);                                // intake mouth (dark)
  box(3.5,.06,.06,dark,0,.94,-.69);
  for(let x=-2.2;x<=2.21;x+=.55){bar([x,DECK_Y,-.76],[x,DECK_Y+.95,-.76],.025,yellow);}
  for(const y of [DECK_Y+.5,DECK_Y+.93])bar([-2.25,y,-.76],[2.25,y,-.76],.022,yellow);
  props.plate('INTAKE 2',.8,.2,{x:-1.1,y:DECK_Y+.71,z:-.73});

  // ---- Trash rack: inclined bars, ties above and below the waterline ----
  const rack=new THREE.Group();rack.name='trash-rack';root.add(rack);
  for(let i=0;i<27;i++){const x=-1.82+i*.14;const b=bar([x,.04,rackZ(.04)],[x,DECK_Y,rackZ(DECK_Y)],.018,rackSteel);b.scale.set(1,1,2.2);rack.add(b);}
  for(const y of [.3,1.28,DECK_Y-.04])rack.add(box(3.75,.06,.07,steel,0,y,rackZ(y)+.03));

  // ---- Water: textured, rippling surface; cut faces show depth; downstream pool behind the bars ----
  const fc=document.createElement('canvas');fc.width=128;fc.height=256;const fg=fc.getContext('2d');fg.fillStyle='#4aa9c8';fg.fillRect(0,0,128,256);
  for(let i=0;i<140;i++){fg.fillStyle=`rgba(225,248,255,${.12+rnd(i,3)*.28})`;fg.fillRect(rnd(i,1)*128,rnd(i,2)*256,1+rnd(i,4)*2,8+rnd(i,5)*26);}
  const flowTex=track(new THREE.CanvasTexture(fc));flowTex.wrapS=flowTex.wrapT=THREE.RepeatWrapping;flowTex.repeat.set(2.4,2.2);flowTex.colorSpace=THREE.SRGBColorSpace;
  const surfDepth=FRONT_Z-RACK_Z0,surfMid=(FRONT_Z+RACK_Z0)/2;
  const surfGeo=track(new THREE.PlaneGeometry(3.8,surfDepth,38,26));surfGeo.rotateX(-Math.PI/2);
  const surface=mesh(surfGeo,mat(0x6fc3dd,{map:flowTex,metalness:.15,roughness:.12,transparent:true,opacity:.5,depthWrite:false}),0,WATER_Y,surfMid);surface.castShadow=false;surface.name='water-surface';
  const base=Float32Array.from(surfGeo.attributes.position.array);
  const pool=mesh(track(new THREE.PlaneGeometry(3.8,.24).rotateX(-Math.PI/2)),mat(0x1c5a70,{transparent:true,opacity:.7,roughness:.2,depthWrite:false}),0,WATER_Y-.02,-.62);pool.castShadow=false;
  const gc=document.createElement('canvas');gc.width=4;gc.height=64;const gg=gc.getContext('2d'),lg=gg.createLinearGradient(0,0,0,64);lg.addColorStop(0,'rgba(120,205,230,.55)');lg.addColorStop(.12,'rgba(40,140,180,.5)');lg.addColorStop(1,'rgba(6,40,70,.78)');gg.fillStyle=lg;gg.fillRect(0,0,4,64);
  const depthTex=track(new THREE.CanvasTexture(gc));depthTex.colorSpace=THREE.SRGBColorSpace;
  const faceMat=track(new THREE.MeshBasicMaterial({map:depthTex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  const sideFace=mesh(track(new THREE.PlaneGeometry(surfDepth,WATER_Y-.33)),faceMat,1.9,(WATER_Y+.33)/2,surfMid);sideFace.rotation.y=Math.PI/2;sideFace.castShadow=sideFace.receiveShadow=false;
  const frontFace=mesh(track(new THREE.PlaneGeometry(3.8,WATER_Y-.31)),faceMat,0,(WATER_Y+.31)/2,FRONT_Z-.2);frontFace.castShadow=frontFace.receiveShadow=false;
  // Flow arrows painted on the sill: the direction reads even when paused.
  for(const x of [-1.2,0,1.2]){const a=mesh(track(new THREE.ConeGeometry(.09,.22,3)),mat(0xdff6ff,{emissive:0x7fd6f0,emissiveIntensity:.4}),x,.34,FRONT_Z+.02);a.rotation.x=-Math.PI/2;a.castShadow=false;}

  // ---- Flow dots: lanes at the surface and a few below, thinning and parting around the debris ----
  const dots=[],dotGeo=track(new THREE.SphereGeometry(.016,6,4)),dotSurf=mat(0xe9fbff,{emissive:0x9fe6ff,emissiveIntensity:.5,transparent:true,opacity:.9}),dotDeep=mat(0x9fdcf0,{emissive:0x2a8fb2,emissiveIntensity:.4,transparent:true,opacity:.75});
  for(let i=0;i<78;i++){const deep=i%4===3,o=mesh(dotGeo,deep?dotDeep:dotSurf);o.castShadow=false;o.scale.set(1,.6,4);dots.push({o,x:-1.78+rnd(i,31)*3.56,y:deep?.35+rnd(i,32)*.5:WATER_Y+.008,off:rnd(i,33)*10,deep});}
  const LOOP=FRONT_Z-.15-(-.64);

  // ---- Debris: passers, the catching branch, gatherers and a weed mat ----
  const debris=new THREE.Group();debris.name='intake-debris';root.add(debris);
  const leafGeo=(()=>{const s=new THREE.Shape();s.moveTo(0,-.5);s.quadraticCurveTo(.42,-.1,0,.5);s.quadraticCurveTo(-.42,-.1,0,-.5);const g=track(new THREE.ShapeGeometry(s,6));g.rotateX(-Math.PI/2);return g;})();
  function leaf(size,m){const o=mesh(leafGeo,m);o.scale.setScalar(size);return o;}
  function stick(len,r,twigs=0,seed=0){const g=new THREE.Group();root.add(g);const main=cylinder(r,len,wood,0,0,0);main.rotation.z=Math.PI/2;g.add(main);main.position.set(0,0,0);
    for(let j=0;j<twigs;j++){const tl=len*(.25+rnd(seed,j)*.2),x=(rnd(seed,j+5)-.5)*len*.7,a=(j%2?1:-1)*(.5+rnd(seed,j+9)*.4);const tw=cylinder(r*.55,tl,bark,0,0,0);g.add(tw);tw.rotation.set(Math.PI/2,0,a);tw.position.set(x+Math.sin(a)*tl*.3,0,Math.cos(a)*tl*.45*(j%2?1:-1));
      const lf=leaf(.09+rnd(seed,j+13)*.04,j%2?leafG:leafY);g.add(lf);lf.position.set(x+Math.sin(a)*tl*.6,.01,Math.cos(a)*tl*.85*(j%2?1:-1));lf.rotation.y=a;}
    return g;}
  const items=[];
  // Passers: small enough to go through the bars before anything is wrong.
  for(const [x,arrive,kind] of [[-1.05,2.4,'twig'],[1.15,3.3,'leaf'],[-.35,1.2,'leaf']]){const o=kind==='leaf'?leaf(.13,leafY):stick(.2,.012,0,x*10);if(o.parent!==root)root.add(o);items.push({o,kind:'pass',x,arrive,yaw:rnd(arrive,2)*3});}
  // The branch that catches: long enough to span several bars.
  const branch=stick(1.05,.032,4,7);debris.add(branch);items.push({o:branch,kind:'catch',x:CX,arrive:CATCH_T,final:{x:CX,y:WATER_Y+.02,z:rackZ(WATER_Y)+.06,rx:0,ry:0,rz:.16},yaw:.9});
  // Gatherers: arrive one after another and stop against the branch and each other.
  const GN=15;
  for(let i=0;i<GN;i++){
    const u=i/(GN-1),kind=i%3===1?'stick':'leaf',x=CX+(rnd(i,41)-.5)*.9,layer=Math.floor(i/5);
    const o=kind==='stick'?stick(.3+rnd(i,42)*.3,.016+rnd(i,43)*.01,1,i+20):leaf(.12+rnd(i,44)*.07,[leafG,leafY,leafB][i%3]);debris.add(o);
    // Sticks lie across the bars; some leaves are pressed up onto the bars above the waterline.
    const up=kind==='leaf'&&rnd(i,45)<.5,y=WATER_Y+.015+(up?.04+rnd(i,46)*.2:0);
    items.push({o,kind:'gather',x,arrive:GATHER0+(GATHER1-GATHER0)*u**1.15,final:{x,y,z:rackZ(y)+.07+layer*.05+rnd(i,47)*.03,rx:up?-1.2:0,ry:kind==='stick'?(rnd(i,48)-.5)*.6:rnd(i,48)*3,rz:kind==='stick'?(rnd(i,49)-.5)*.25:0},yaw:rnd(i,50)*3});
  }
  const matGeo=track(new THREE.IcosahedronGeometry(1,2)),mp=matGeo.attributes.position;
  for(let i=0;i<mp.count;i++){const v=new THREE.Vector3().fromBufferAttribute(mp,i);v.multiplyScalar(1+.3*Math.sin(v.x*7.3+v.z*3)+.22*Math.sin(v.z*11.1+v.x*2)+.15*Math.cos(v.y*9+v.x*5));mp.setXYZ(i,v.x,v.y,v.z);}matGeo.computeVertexNormals();
  // The mat: low, irregular clumps of wrack in three greens that knit together along the bars as debris gathers.
  const weedMats=[weed,mat(0x5f6e32,{roughness:.9}),mat(0x6b5a30,{roughness:.95})];
  const clumps=[[-.42,.1,.2,.09,0],[-.12,.16,.26,.12,1],[.2,.12,.24,.1,2],[.45,.08,.18,.09,3],[.02,.25,.2,.08,4],[.3,.27,.16,.07,5],[-.3,.24,.15,.07,6]].map(([dx,dz,sx,sz,j])=>{
    const o=mesh(matGeo,weedMats[j%3],CX+dx,WATER_Y-.004,rackZ(WATER_Y)+.04+dz);o.rotation.y=j*1.7;debris.add(o);return{o,sx,sz,j,t0:CATCH_T+.6+j*1.15};});
  const foam=[];for(let i=0;i<12;i++){const f=mesh(dotGeo,foamM);f.castShadow=false;f.scale.set(2.4+rnd(i,61)*2,.6,1.6+rnd(i,62));foam.push({f,x:CX+(rnd(i,63)-.5)*1.25,z:rackZ(WATER_Y)+.24+rnd(i,64)*.16,i});}
  const zone=new THREE.Group();zone.name='debris-zone';root.add(zone);
  const zm=mesh(track(new THREE.BoxGeometry(1.32,.5,.42)),mat(0xffffff),CX,WATER_Y+.08,rackZ(WATER_Y)+.14);zm.visible=false;zm.castShadow=zm.receiveShadow=false;zone.add(zm);
  const growth=t=>smooth(CATCH_T,GATHER1+.5,t);

  // ---- Inspection camera on the far wall (the sensor), hut with the site cabinet, pulse route ----
  const wallTop=[-2.125,DECK_Y,1.25];
  bar(wallTop,[wallTop[0],2.4,wallTop[2]],.04,steel);bar([wallTop[0],2.36,wallTop[2]],[-1.92,2.36,1.2],.03,steel);
  const lens=new THREE.Vector3(-1.86,2.34,1.18),look=new THREE.Vector3(CX,WATER_Y+.04,rackZ(WATER_Y)+.1);
  const housing=new THREE.Group();housing.position.copy(lens);housing.lookAt(look);root.add(housing);
  const hb=box(.16,.14,.32,mat(0x2a3238,{roughness:.45,metalness:.3}),0,0,0);housing.add(hb);hb.position.set(0,0,.03);
  const ring=cylinder(.058,.035,mat(0xc9d2d7,{metalness:.7,roughness:.3}),0,0,0);housing.add(ring);ring.rotation.x=Math.PI/2;ring.position.set(0,0,.19);
  const hood=box(.2,.025,.36,dark,0,0,0);housing.add(hood);hood.position.set(0,.085,.05);
  const glass=cylinder(.045,.03,mat(0x0a1720,{metalness:.8,roughness:.1}),0,0,0);housing.add(glass);glass.rotation.x=Math.PI/2;glass.position.set(0,0,.2);
  const sensorCam=new THREE.PerspectiveCamera(46,1,.05,30);sensorCam.position.copy(lens).add(new THREE.Vector3().subVectors(look,lens).normalize().multiplyScalar(.24));sensorCam.lookAt(look);root.add(sensorCam);
  // Hut on the deck: back wall, sides, roof, open front; cabinet inside.
  const HUT=[1.75,-1.2];
  const HUT_H=2.1,hutWall=mat(0x9aa8ad);
  box(.9,HUT_H,.05,hutWall,HUT[0],DECK_Y+HUT_H/2,HUT[1]-.32);for(const s of [-1,1])box(.05,HUT_H,.64,hutWall,HUT[0]+s*.45,DECK_Y+HUT_H/2,HUT[1]);
  box(.9,.26,.05,hutWall,HUT[0],DECK_Y+HUT_H-.13,HUT[1]+.3);                                     // lintel over the open front
  const roof=box(1.04,.05,.8,mat(0x3d5560),HUT[0],DECK_Y+HUT_H+.05,HUT[1]-.02);roof.rotation.x=.12;
  props.plate('SITE GPU',.62,.17,{x:HUT[0],y:DECK_Y+HUT_H-.13,z:HUT[1]+.33});
  const cabinet=props.siteCabinet(HUT[0]-.1,HUT[1]-.05,{y:DECK_Y,label:null})   // the hut's sign names it;cabinet.group.scale.setScalar(.9);
  const port=cabinet.port(),PERSON_START=[HUT[0]+.1,DECK_Y,HUT[1]+.38];
  const pulse=props.pulse([[-1.92,2.37,1.2],[wallTop[0],2.37,wallTop[2]+.05],[wallTop[0]+.06,DECK_Y+.03,wallTop[2]+.05],[wallTop[0]+.06,DECK_Y+.03,-1.5],[HUT[0]-.12,DECK_Y+.03,-1.5],port,
    [HUT[0]-.12,DECK_Y+.03,HUT[1]+.26],[PERSON_START[0],DECK_Y+.03,PERSON_START[2]]]);

  // ---- Glare (the "unsure" variation) ----
  const gl=document.createElement('canvas');gl.width=gl.height=64;const glc=gl.getContext('2d'),gr=glc.createRadialGradient(32,32,1,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,250,225,.75)');gr.addColorStop(1,'rgba(255,240,200,0)');glc.fillStyle=gr;glc.fillRect(0,0,64,64);
  const glareTex=track(new THREE.CanvasTexture(gl));
  const glint=new THREE.Sprite(track(new THREE.SpriteMaterial({map:glareTex,color:0xfff3d0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})));glint.userData.noFit=true;root.add(glint);glint.position.set(CX+.25,WATER_Y+.05,rackZ(WATER_Y)+.45);glint.scale.set(1.3,.55,1);
  const lensGlare=new THREE.Sprite(track(new THREE.SpriteMaterial({map:glareTex,color:0xfff6dc,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})));lensGlare.position.set(.02,-.01,-.42);lensGlare.scale.set(.42,.3,1);sensorCam.add(lensGlare);

  // ---- Maintenance person: leaves the hut at review and walks the deck to look down at the rack ----
  const person=actors.person({vest:0xff7a1a,shirt:0x34506a,name:'maintenance'});
  const P_PATH=[PERSON_START,[HUT[0]-.25,DECK_Y,-.98],[CX+.25,DECK_Y,-.98]],P_T0=18.4,P_T1=22.2;

  function update(t,ctx){
    // Water surface: texture flows toward the rack; gentle ripples; the surface rises slightly in front of the mat.
    flowTex.offset.y=(t*FLOW/(surfDepth/flowTex.repeat.y))%1;
    const gw=growth(t),pa=surfGeo.attributes.position;
    for(let i=0;i<pa.count;i++){const x=base[i*3],z=base[i*3+2];const wz=surfMid+z;const near=Math.exp(-(((x-CX)/.65)**2))*Math.exp(-Math.max(0,wz-rackZ(WATER_Y))/.5);
      pa.setY(i,.007*Math.sin(x*7+wz*9+t*4.2)+.005*Math.sin(wz*14-t*5)+gw*near*.025);}
    pa.needsUpdate=true;surfGeo.computeVertexNormals();
    // Flow dots.
    for(const d of dots){const p=((t*FLOW+d.off)%LOOP+LOOP)%LOOP,z=FRONT_Z-.15-p;const block=gw*Math.exp(-(((d.x-CX)/.58)**2)),prox=smooth(1.1,-.3,z);
      const x=d.x+Math.sign(d.x-CX||1)*block*.5*prox,behind=z<rackZ(d.y)+.02;
      d.o.position.set(x,d.y,z);const fade=1-Math.min(1,block*(behind?1.6:prox*1.15));d.o.visible=fade>.12&&!(d.deep&&z<rackZ(d.y));d.o.scale.set(fade,.6*fade,4*fade);}
    // Debris.
    for(const it of items){
      const o=it.o;
      if(it.kind==='pass'){const z=rackZ(WATER_Y)+(it.arrive-t)*FLOW*1.05;o.visible=z<FRONT_Z-.1&&z>-.66;o.position.set(it.x+.05*Math.sin(t*.8+it.x),WATER_Y+.012,z);o.rotation.set(0,it.yaw+t*.3,0);continue;}
      const f=it.final,dt=it.arrive-t;o.userData.unmasked=dt>0;   // still drifting: not part of the finding
      if(dt>0){const z=f.z+dt*FLOW*1.05;o.visible=z<FRONT_Z-.12;o.position.set(f.x+.06*Math.sin(t*.7+f.x*3),WATER_Y+.012,z);o.rotation.set(0,it.yaw+dt*.25,0);}
      else{o.visible=true;const e=smooth(0,.6,-dt);o.position.set(f.x,WATER_Y+.012+(f.y-WATER_Y-.012)*e+.004*Math.sin(t*2+f.x*5),f.z+(1-e)*.03);o.rotation.set(f.rx*e,it.yaw*(1-e)+f.ry*e,f.rz*e);}
    }
    for(const C of clumps){const g=smooth(C.t0,C.t0+2.6,t);C.o.visible=g>.02;C.o.scale.set(C.sx*g+.005,(.035+.012*(C.j%2))*g+.003,C.sz*g+.005);}
    for(const F of foam){const on=smooth(GATHER0+F.i*.6,GATHER0+F.i*.6+.8,t);F.f.visible=on>0;F.f.position.set(F.x+.02*Math.sin(t*1.3+F.i),WATER_Y+.01,F.z+.02*Math.sin(t*1.7+F.i*2));F.f.scale.set((2.4+F.i%3)*on,.6*on,1.8*on);}
    // Glare variation.
    const glare=ctx.variation==='glare'?smooth(4.4,8,t):0;glint.material.opacity=.85*glare;glint.visible=glare>0;
    lensGlare.material.opacity=glare&&ctx.sensor?.95:0;lensGlare.visible=!!(glare&&ctx.sensor);
    // The pulse runs in the AI view and on into Review while the camera pulls out to show camera, cabinet and person.
    const active=ctx.chapterId==='aiView'||(ctx.chapterId==='review'&&t<P_T0+.9);
    cabinet.update(t,active);pulse.update(t,active);
    const shown=t>=P_T0-.2;person.group.visible=shown;
    if(shown){const f=actors.followPath(person.group,P_PATH,P_T0,P_T1,t);
      // At the rail: turn to the rack below, lean over and point at the mat.
      const turn=f.done?smooth(P_T1,P_T1+.8,t):0;if(f.done)person.group.rotation.y=f.heading+Math.atan2(Math.sin(-.15-f.heading),Math.cos(-.15-f.heading))*turn;
      const lookIn=f.done?smooth(P_T1+.3,P_T1+1.4,t):0;
      person.pose({distance:f.distance,weight:f.moving?f.weight:0,look:.05+.8*lookIn,lean:.22*lookIn,point:f.done?smooth(P_T1+.9,P_T1+1.8,t):0});}
  }
  return{anchors:{debris:zone,rack},sensors:{'intake-cam':{camera:sensorCam,mode:'mask',targets:[debris],label:'Intake camera 2',key:()=>items.filter(i=>i.kind!=='pass'&&!i.o.userData.unmasked).length}},update,
    metrics:()=>({debrisVisible:items.filter(i=>i.kind!=='pass'&&i.o.visible).length,growth:null,personVisible:person.group.visible,person:person.group.position.toArray()})};
}
