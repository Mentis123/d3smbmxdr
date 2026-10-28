// The Splunk network diorama: shared by the world (public/map-assets/splunk-scene.js) and its exhibit kit
// (lab/kits/splunk.sap-forecast.js). A dark "inside the network" board in the Tron style: wire-edged glass buildings on
// a glowing grid, the campus and two branch sites at the front, the global load balancers in the middle, the North and
// South data centres at the back (each with an SAP instance and a utilisation gauge), a SaaS cloud above, ThousandEyes
// agents testing every path, and the Splunk ring overhead that every device streams telemetry into.
// Everything is illustrative: fictional sites, made-up numbers; the storyline is the owner's (28 Oct 2026).
//
// API: buildNetwork(k, {parent, scale, x, y, z, detail}) ->
//   {group, P, model, anchors:{southSap, northSap, southGauge, northGauge, riverside, hub, panel, noc, ring, cloud},
//    cards:{alert, agent, done}, update(t, state)}
//   state: {clock (minutes after 09:00), redirectAt (clock minute the move starts, or null), busy (variation: North has
//   no headroom), forecast 0..1, alert 0..1, agent null|'propose'|'approved'|'busy', ghost 0..1, approve 0..1 (the
//   approval pulse NOC -> load balancers), focus 0..1 (highlight Riverside), done 0..1 ("11:00 · no outage")}
// Local units: the board is 13.4 x 8.6, top at y = BOARD_Y; the world scales it 1.55x, the exhibit 0.5x.
// Sprites carry userData.noFit and the flows userData.sensorKeep, so the exhibit's Splunk view greys the buildings and
// keeps the data glowing.

export const BOARD_Y=.06;
export const CSS={cyan:'#19d3ff',splunk:'#ff3fae',campus:'#5aa9ff',bayside:'#b58cff',riverside:'#ffc23d',te:'#8ff7e2',ok:'#3fe08a',warn:'#ffb02e',bad:'#ff4d5e'};
// Fixed layout (local units). The exhibit recipe anchors and the world pins follow these; keep them in step.
export const P={
  north:[-3.6,-2.25],south:[3.6,-2.25],dc:[3.4,2.2],
  hub:[0,-.35],
  sites:{campus:[-4.1,2.75],bayside:[1.35,2.95],riverside:[4.45,2.8]},
  noc:[-.95,2.95],
  ring:[0,3.35,.35],ringR:1.25,
  cloud:[-.2,3.55,-3.75],
  panel:[3.6,1.85,-3.5],
};

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const spow=(x,p)=>Math.sign(x)*Math.pow(Math.abs(x),p);
export const hhmm=m=>{const t=Math.round(m),h=9+Math.floor(t/60),mm=((t%60)+60)%60;return`${h}:${String(mm).padStart(2,'0')}`;};

// Utilisation model (percent) as a pure function of the clock. South is 68 % at 10:00, trends to 80 % by 10:30 and ~96 % (an outage) by
// 11:00; once Riverside moves north it settles near 60 %, and North takes the site's share (about 11 points).
export const model={
  southRaw:m=>68+12*spow((m-60)/30,1.25),
  share:(m,rs)=>rs==null?0:smooth(rs,rs+9,m),
  south(m,rs){const r=this.southRaw(m),s=this.share(m,rs);return r+(60+1.2*Math.sin(m*.35)-r)*s;},
  north(m,rs,busy){return(busy?70+.06*(m-60)+.8*Math.sin(m*.27):41+1.1*Math.sin(m*.21))+11*this.share(m,rs);},
};
export const utilCss=u=>u>=80?CSS.bad:u>=62?CSS.warn:CSS.ok;

function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const font=(g,w,s)=>{g.font=`${w} ${s}px "Inter","Helvetica Neue",Arial,sans-serif`;};
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

export function buildNetwork(k,{parent=k.root,scale=1,x=0,y=0,z=0,detail='world'}={}){
  const {THREE,track}=k;
  const group=new THREE.Group();group.name='splunk-network';group.position.set(x,y,z);group.scale.setScalar(scale);parent.add(group);
  const geos=new Map();const geo=(key,make)=>{if(!geos.has(key))geos.set(key,track(make()));return geos.get(key);};
  const std=(color,o={})=>track(new THREE.MeshStandardMaterial({color,roughness:.5,metalness:.4,...o}));
  const basic=(color,o={})=>track(new THREE.MeshBasicMaterial({color,toneMapped:false,...o}));
  const add=(g,m,px=0,py=0,pz=0,to=group)=>{const o=new THREE.Mesh(g,m);o.position.set(px,py,pz);o.castShadow=o.receiveShadow=true;to.add(o);return o;};
  const lineMat=(css,opacity=1)=>track(new THREE.LineBasicMaterial({color:new THREE.Color(css),transparent:opacity<1,opacity,toneMapped:false}));
  const edges=(g,css,opacity,px,py,pz,to=group)=>{const l=new THREE.LineSegments(track(new THREE.EdgesGeometry(g)),lineMat(css,opacity));l.position.set(px,py,pz);to.add(l);return l;};
  const canvas=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;const api={c,g,t,redraw(...a){g.clearRect(0,0,w,h);draw(g,w,h,...a);t.needsUpdate=true;}};api.redraw();return api;};
  const sprite=(cv,width,px,py,pz,{depth=false,to=group}={})=>{const s=new THREE.Sprite(track(new THREE.SpriteMaterial({map:cv.t,transparent:true,depthWrite:false,depthTest:depth,toneMapped:false})));
    s.scale.set(width,width*cv.c.height/cv.c.width,1);s.position.set(px,py,pz);s.userData.noFit=true;s.renderOrder=8;to.add(s);return s;};
  const label=(text,css,width,px,py,pz,sub)=>{width*=LS;return sprite(canvas(512,sub?150:96,(g,w,h)=>{g.fillStyle='rgba(4,8,16,.82)';rr(g,3,3,w-6,h-6,16);g.fill();g.strokeStyle=css;g.lineWidth=4;g.stroke();
    g.textAlign='center';g.textBaseline='middle';g.fillStyle=css;font(g,800,46);g.fillText(text,w/2,sub?50:h/2+2);if(sub){g.fillStyle='#dfe8f2';font(g,600,34);g.fillText(sub,w/2,108);}}),width,px,py,pz);};
  const B=BOARD_Y,LS=detail==='world'?1.35:1;

  // ---------------------------------------------------------------- the board: a dark glass slab with a glowing grid
  const grid=canvas(1024,660,(g,w,h)=>{g.fillStyle='#050a13';g.fillRect(0,0,w,h);
    for(let i=0;i<=w;i+=16){g.strokeStyle=i%128===0?'rgba(40,170,230,.55)':'rgba(30,110,160,.22)';g.lineWidth=i%128===0?2:1;g.beginPath();g.moveTo(i+.5,0);g.lineTo(i+.5,h);g.stroke();}
    for(let j=0;j<=h;j+=16){g.strokeStyle=j%128===0?'rgba(40,170,230,.55)':'rgba(30,110,160,.22)';g.lineWidth=j%128===0?2:1;g.beginPath();g.moveTo(0,j+.5);g.lineTo(w,j+.5);g.stroke();}});
  const board=add(geo('board',()=>new THREE.BoxGeometry(13.4,B,8.6)),[std(0x07101b,{metalness:.6,roughness:.35}),std(0x07101b,{metalness:.6,roughness:.35}),
    std(0x0a1622,{map:grid.t,emissiveMap:grid.t,emissive:0xffffff,emissiveIntensity:.55,roughness:.32,metalness:.3}),std(0x07101b),std(0x07101b,{metalness:.6,roughness:.35}),std(0x07101b,{metalness:.6,roughness:.35})],0,B/2,0);
  board.name='splunk-board';board.castShadow=false;
  edges(geo('board',null),CSS.cyan,.85,0,B/2,0);

  // ---------------------------------------------------------------- shared textures: rack LEDs and lit windows
  const leds=canvas(128,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);const r=rng(7);
    for(let j=10;j<h-8;j+=12){g.fillStyle='rgba(255,255,255,.12)';g.fillRect(8,j,w-16,8);for(let i=14;i<w-14;i+=12)if(r()>.35){g.fillStyle=r()>.85?'#fff':'rgba(255,255,255,.7)';g.fillRect(i,j+2,5,4);}}});
  const windows=canvas(256,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);const r=rng(19);for(let j=12;j<h;j+=26)for(let i=10;i<w;i+=22)if(r()>.3){g.fillStyle=`rgba(255,255,255,${.35+r()*.6})`;g.fillRect(i,j,14,12);}});
  windows.t.wrapS=windows.t.wrapT=THREE.RepeatWrapping;

  // ---------------------------------------------------------------- flows: tube + travelling pulse (pure function of t)
  const flowV='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const flowF=`uniform float uTime,uSpeed,uRepeat,uLevel,uDash;uniform vec3 uColor;varying vec2 vUv;void main(){
    if(uDash>.5&&fract(vUv.x*uRepeat*1.5-uTime*uSpeed*.4)>.55)discard;
    float run=fract(vUv.x*uRepeat-uTime*uSpeed);float head=exp(-pow((run-.08)*38.,2.));float tail=exp(-max(0.,run-.08)*11.)*step(.08,run);float p=head+tail*.55;
    gl_FragColor=vec4(uColor*(.32+1.9*p),uLevel*(.38+.62*p));}`;
  const flows=[];
  function flow(points,css,{r=.045,speed=2.2,spacing=.7,level=1,dash=false,seg=64}={}){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    const len=curve.getLength(),m=track(new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uSpeed:{value:speed},uRepeat:{value:Math.max(1,len/spacing)},uLevel:{value:level},uDash:{value:dash?1:0},uColor:{value:new THREE.Color(css)}},
      vertexShader:flowV,fragmentShader:flowF,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    const mesh=new THREE.Mesh(track(new THREE.TubeGeometry(curve,seg,r,6,false)),m);mesh.userData.sensorKeep=true;mesh.userData.noFit=true;mesh.renderOrder=3;group.add(mesh);
    const f={mesh,m,curve,set(level,t){m.uniforms.uLevel.value=level;m.uniforms.uTime.value=t;mesh.visible=level>.005;}};flows.push(f);return f;
  }

  // ---------------------------------------------------------------- data centres: wire-edged glass halls with rack rows
  function dataCentre(name,[cx,cz],outer){
    const g=new THREE.Group();g.name=name+'-dc';g.position.set(cx,B,cz);group.add(g);
    const [W,D]=P.dc;
    add(geo('dcFloor',()=>new THREE.BoxGeometry(W,.05,D)),std(0x0d1824,{metalness:.7,roughness:.3}),0,.025,0,g);
    const glass=std(0x6fd6ff,{transparent:true,opacity:.09,depthWrite:false,metalness:.1,roughness:.05,side:THREE.DoubleSide});
    for(const [w,h,d,px,pz] of [[W,.62,.02,0,-D/2],[W,.3,.02,0,D/2],[.02,.62,D,-W/2,0],[.02,.62,D,W/2,0]]){const o=add(new THREE.BoxGeometry(w,h,d),glass,px,h/2+.05,pz,g);o.castShadow=false;track(o.geometry);}
    edges(geo('dcHall',()=>new THREE.BoxGeometry(W,.62,D)),CSS.cyan,.9,0,.36,0,g);
    // Two rows of racks facing the front; the middle four of the front row are the SAP instance.
    const rackG=geo('rack',()=>new THREE.BoxGeometry(.4,.7,.46)),faceG=geo('rackFace',()=>new THREE.PlaneGeometry(.33,.6));
    const rackM=std(0x141c28,{metalness:.65,roughness:.35});
    const ledM=std(0x000000,{emissive:new THREE.Color(CSS.cyan),emissiveMap:leds.t,emissiveIntensity:1.1,roughness:.4});
    const sapLed=std(0x000000,{emissive:new THREE.Color(CSS.ok),emissiveMap:leds.t,emissiveIntensity:1.5,roughness:.4});
    const sap=new THREE.Group();sap.name=name+'-sap';g.add(sap);
    for(const [row,rz] of [[0,-.5],[1,.3]])for(let i=0;i<6;i++){
      const isSap=row===1&&i>=1&&i<=4,to=isSap?sap:g,px=-1.25+i*.5;
      add(rackG,rackM,px,.4,rz,to);const f=add(faceG,isSap?sapLed:ledM,px,.4,rz+.232,to);f.castShadow=false;}
    const sapTop=add(geo('sapTop',()=>new THREE.BoxGeometry(2.0,.03,.5)),std(0x000000,{emissive:new THREE.Color(CSS.ok),emissiveIntensity:1.2}),0,.77,.3,sap);sapTop.castShadow=false;
    const sapLabel=label('SAP',CSS.ok,.62,0,1.02,.32);g.add(sapLabel);
    // A cold-aisle glow in front of the SAP row and a load balancer pair at the hall's front door.
    const lb=new THREE.Group();lb.position.set(outer?0:0,.05,D/2+.32);g.add(lb);
    for(const dy of [0,.11]){add(geo('lb',()=>new THREE.BoxGeometry(.8,.09,.34)),std(0x1b2532,{metalness:.7,roughness:.3}),0,.045+dy,0,lb);
      const s=add(geo('lbLed',()=>new THREE.PlaneGeometry(.68,.035)),basic(CSS.cyan),0,.05+dy,.171,lb);s.castShadow=false;}
    // Utilisation gauge at the hall's outer front corner: glass tube, fill, the 80 % ring, and a live percentage.
    const gx=outer*(W/2+.42),gz=D/2-.1,H=1.5;
    const gauge=new THREE.Group();gauge.name=name+'-gauge';gauge.position.set(gx,0,gz);g.add(gauge);
    add(geo('gBase',()=>new THREE.CylinderGeometry(.24,.27,.08,24)),std(0x1b2532,{metalness:.7}),0,.04,0,gauge);
    const tube=add(geo('gTube',()=>new THREE.CylinderGeometry(.17,.17,H,24,1,true)),std(0x9be8ff,{transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide,roughness:.05}),0,.08+H/2,0,gauge);tube.castShadow=false;tube.userData.sensorKeep=true;
    const fillM=basic(CSS.ok,{transparent:true,opacity:.92});
    const fill=add(geo('gFill',()=>new THREE.CylinderGeometry(.13,.13,1,24).translate(0,.5,0)),fillM,0,.08,0,gauge);fill.userData.sensorKeep=true;fill.castShadow=false;
    const ring80=add(geo('g80',()=>new THREE.TorusGeometry(.2,.018,8,32).rotateX(Math.PI/2)),basic(CSS.bad),0,.08+H*.8,0,gauge);ring80.userData.sensorKeep=true;
    const pct=canvas(256,112,(g2,w,h,u=0)=>{g2.fillStyle='rgba(4,8,16,.85)';rr(g2,3,3,w-6,h-6,18);g2.fill();g2.strokeStyle=utilCss(u);g2.lineWidth=5;g2.stroke();
      g2.textAlign='center';g2.textBaseline='middle';g2.fillStyle=utilCss(u);font(g2,800,64);g2.fillText(Math.round(u)+'%',w/2,h/2+3);});
    const pctS=sprite(pct,.62,0,.08+H+.3,0,{to:gauge});
    const nameS=label(name.toUpperCase()+' DC',CSS.cyan,1.25,outer*1.05,.78,D/2+.05);g.add(nameS);
    let shown=-1;
    return{g,sap,sapLed,sapTop,sapLabel,lb,gauge,
      set(u,t){const c=new THREE.Color(utilCss(u));fill.scale.y=Math.max(.001,H*u/100);fillM.color.copy(c);sapLed.emissive.copy(c);sapTop.material.emissive.copy(c);
        sapLed.emissiveIntensity=1.3+(u>=78?.6*(.5+.5*Math.sin(t*7)):0);const q=Math.round(u);if(q!==shown){shown=q;pct.redraw(u);}
        ring80.material.color.set(u>=78?CSS.bad:'#a83545');}};
  }
  const north=dataCentre('North',P.north,-1),south=dataCentre('South',P.south,1);

  // ---------------------------------------------------------------- sites: campus, Bayside, Riverside (lit windows)
  function site(id,name,[cx,cz],blocks,css,lw){
    const g=new THREE.Group();g.name=id;g.position.set(cx,B,cz);group.add(g);
    const winM=std(0x101a26,{emissive:new THREE.Color(css).lerp(new THREE.Color('#ffffff'),.35),emissiveMap:windows.t,emissiveIntensity:.9,metalness:.5,roughness:.35});
    const roofM=std(0x0f1823,{metalness:.6,roughness:.4});
    let top=0;
    for(const [dx,dz,w,d,h] of blocks){const bg=new THREE.BoxGeometry(w,h,d);track(bg);
      add(bg,winM,dx,h/2,dz,g);add(geo('cap',()=>new THREE.BoxGeometry(1,.02,1)),roofM,dx,h+.011,dz,g).scale.set(w+.01,1,d+.01);edges(bg,css,.95,dx,h/2,dz,g);top=Math.max(top,h);}
    add(geo('pad'+id,()=>new THREE.BoxGeometry(...lw)),std(0x0c1521,{metalness:.6,roughness:.35}),0,.012,0,g).castShadow=false;
    edges(geo('pad'+id,null),css,.55,0,.012,0,g);
    const tag=label(name,css,name.length>8?1.35:1.1,0,top+.45,0);g.add(tag);
    // ThousandEyes agent: a small box with an antenna and a beacon on the pad's front corner.
    const te=new THREE.Group();te.position.set(lw[0]/2-.18,0,lw[2]/2-.16);g.add(te);
    add(geo('te',()=>new THREE.BoxGeometry(.16,.1,.12)),std(0x1d2733),0,.05,0,te);
    add(geo('teAnt',()=>new THREE.CylinderGeometry(.008,.008,.22,6)),std(0x8ca0b0),0,.21,0,te);
    const beacon=add(geo('teB',()=>new THREE.SphereGeometry(.035,10,8)),basic(CSS.te),0,.33,0,te);beacon.userData.sensorKeep=true;
    return{g,top,te,beacon,tag};
  }
  const campus=site('campus','Campus',P.sites.campus,[[-1.05,-.2,.9,.8,1.3],[.05,-.35,1.0,.7,.85],[1.0,.1,.7,.9,1.05],[-.1,.45,.9,.45,.45]],CSS.campus,[3.2,.04,1.9]);
  const bayside=site('bayside','Bayside site',P.sites.bayside,[[-.25,0,.7,.7,.62],[.42,.12,.5,.5,.4]],CSS.bayside,[1.6,.04,1.2]);
  const riverside=site('riverside','Riverside site',P.sites.riverside,[[0,0,.62,.55,.42]],CSS.riverside,[1.2,.04,1.0]);

  // ---------------------------------------------------------------- global load balancers: a hex hub in the middle
  const hub=new THREE.Group();hub.name='load-balancers';hub.position.set(P.hub[0],B,P.hub[1]);group.add(hub);
  const hexG=geo('hex',()=>new THREE.CylinderGeometry(.55,.62,.42,6));
  add(hexG,std(0x111b27,{metalness:.75,roughness:.28}),0,.21,0,hub);edges(hexG,CSS.cyan,1,0,.21,0,hub);
  const hubRing=add(geo('hubRing',()=>new THREE.TorusGeometry(.42,.025,8,48).rotateX(Math.PI/2)),basic(CSS.cyan),0,.44,0,hub);hubRing.userData.sensorKeep=true;
  const hubCore=add(geo('hubCore',()=>new THREE.CylinderGeometry(.16,.16,.5,24)),basic(CSS.cyan,{transparent:true,opacity:.8}),0,.55,0,hub);hubCore.userData.sensorKeep=true;
  const hubTag=label('Load balancers',CSS.cyan,1.45,0,1.2,0);hub.add(hubTag);

  // ---------------------------------------------------------------- network operations centre (the network team)
  const noc=new THREE.Group();noc.name='noc';noc.position.set(P.noc[0],B,P.noc[1]);group.add(noc);
  add(geo('nocPad',()=>new THREE.BoxGeometry(1.7,.04,1.15)),std(0x0c1521,{metalness:.6}),0,.02,0,noc);
  edges(geo('nocWall',()=>new THREE.BoxGeometry(1.7,.34,1.15)),CSS.cyan,.65,0,.19,0,noc);
  const wall=canvas(512,200,(g,w,h,alarm=0,ok=0)=>{g.fillStyle='#08111c';g.fillRect(0,0,w,h);
    const r=rng(3);for(let i=0;i<6;i++){g.fillStyle='rgba(25,211,255,.55)';g.fillRect(16+i*82,h-30-r()*90,56,6);}
    g.fillStyle=alarm>.5?CSS.bad:ok>.5?CSS.ok:'rgba(25,211,255,.8)';font(g,800,44);g.textBaseline='top';g.fillText(alarm>.5?'ALERT · SAP SOUTH':ok>.5?'ALL SERVICES OK':'NETWORK HEALTH',16,14);});
  const wallM=std(0x000000,{emissive:0xffffff,emissiveMap:wall.t,emissiveIntensity:1.1,map:wall.t});
  add(geo('nocScreen',()=>new THREE.PlaneGeometry(1.3,.5)),wallM,0,.4,-.5,noc).castShadow=false;
  add(geo('nocScreenBack',()=>new THREE.BoxGeometry(1.36,.56,.03)),std(0x141c28),0,.4,-.52,noc);
  const desk=add(geo('nocDesk',()=>new THREE.BoxGeometry(1.2,.12,.22)),std(0x1d2836,{metalness:.5}),0,.1,-.05,noc);
  for(let i=-1;i<=1;i++){add(geo('nocMon',()=>new THREE.BoxGeometry(.26,.15,.015)),std(0x000000,{emissive:new THREE.Color(CSS.cyan),emissiveIntensity:.7}),i*.38,.24,-.12,noc).castShadow=false;
    // A seated operator (tiny, to the board's scale): torso, head, chair.
    const p=new THREE.Group();p.position.set(i*.38,.04,.2);noc.add(p);
    add(geo('chair',()=>new THREE.BoxGeometry(.14,.06,.14)),std(0x222a35),0,.08,0,p);
    add(geo('torso',()=>new THREE.CapsuleGeometry(.05,.1,4,8)),std([0x3d5a80,0x6b4e71,0x2f5d50][i+1],{metalness:.1,roughness:.8}),0,.21,0,p);
    add(geo('head',()=>new THREE.SphereGeometry(.042,12,10)),std(0xd2a27c,{metalness:0,roughness:.7}),0,.33,0,p);}
  const nocTag=label('Network team',CSS.cyan,1.3,0,.95,0);noc.add(nocTag);

  // ---------------------------------------------------------------- SaaS cloud and the Splunk ring overhead
  const cloud=new THREE.Group();cloud.name='saas';cloud.position.set(...P.cloud);group.add(cloud);
  const puffM=std(0xbfe6ff,{transparent:true,opacity:.22,depthWrite:false,emissive:0x2c6f9a,emissiveIntensity:.5,roughness:.2,metalness:0});
  for(const [px,py,pz,r] of [[-.75,0,0,.5],[0,.18,0,.66],[.7,.02,.05,.48],[.25,-.1,.3,.42],[-.3,-.1,-.25,.45]]){const o=add(geo('puff',()=>new THREE.SphereGeometry(1,24,16)),puffM,px,py,pz,cloud);o.scale.setScalar(r);o.castShadow=false;}
  edges(geo('cloudPlate',()=>new THREE.CylinderGeometry(1.25,1.25,.04,6)),CSS.te,.6,0,-.42,0,cloud);
  const appCols=['#5aa9ff','#3fe08a','#ffb02e','#b58cff'];
  appCols.forEach((c,i)=>{const o=add(geo('app',()=>new THREE.BoxGeometry(.26,.26,.05)),basic(c,{transparent:true,opacity:.9}),-.6+i*.4,.1,.62,cloud);o.castShadow=false;o.userData.sensorKeep=true;});
  const cloudTag=label('SaaS apps',CSS.te,1.15,0,.95,0);cloud.add(cloudTag);

  const ring=new THREE.Group();ring.name='splunk-ring';ring.position.set(...P.ring);group.add(ring);
  const ringM=basic(CSS.splunk);
  const r1=add(geo('ring1',()=>new THREE.TorusGeometry(P.ringR,.035,10,96).rotateX(Math.PI/2)),ringM,0,0,0,ring);r1.userData.sensorKeep=true;r1.castShadow=false;
  const r2=add(geo('ring2',()=>new THREE.TorusGeometry(P.ringR*.82,.012,6,96).rotateX(Math.PI/2)),basic(CSS.splunk,{transparent:true,opacity:.6}),0,.06,0,ring);r2.userData.sensorKeep=true;r2.castShadow=false;
  const ticks=new THREE.Group();ring.add(ticks);
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2,o=add(geo('tick',()=>new THREE.BoxGeometry(.03,.02,.14)),ringM,Math.sin(a)*P.ringR*.91,.03,Math.cos(a)*P.ringR*.91,ticks);o.rotation.y=a;o.castShadow=false;o.userData.sensorKeep=true;}
  const ringTag=label('Splunk',CSS.splunk,1.0,0,.42,0,'sees it all');ring.add(ringTag);

  // ---------------------------------------------------------------- telemetry: every device streams up into the ring
  const sources=[];const wp=(o,dy=0)=>{const v=new THREE.Vector3();o.updateWorldMatrix(true,false);o.getWorldPosition(v);group.worldToLocal(v);v.y+=dy;return v;};
  group.updateWorldMatrix(true,true);
  for(const [o,dy] of [[campus.g,campus.top],[bayside.g,bayside.top],[riverside.g,riverside.top],[north.g,.7],[south.g,.7],[hub,.8],[noc,.5],[cloud,-.4]])sources.push(wp(o,dy));
  const ringC=new THREE.Vector3(...P.ring),targets=sources.map(s=>{const d=new THREE.Vector3(s.x-ringC.x,0,s.z-ringC.z);if(d.lengthSq()<1e-4)d.set(0,0,1);d.normalize().multiplyScalar(P.ringR);return ringC.clone().add(d);});
  const telLines=new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(sources.flatMap((s,i)=>[s,targets[i]]))),lineMat(CSS.splunk,.22));telLines.userData.noFit=true;group.add(telLines);
  const PER=detail==='stage'?5:8,dotPos=new Float32Array(sources.length*PER*3);
  const dotGeo=track(new THREE.BufferGeometry());dotGeo.setAttribute('position',new THREE.BufferAttribute(dotPos,3));
  const dotTex=canvas(64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,120,200,.9)');gr.addColorStop(1,'rgba(255,60,170,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  const dots=new THREE.Points(dotGeo,track(new THREE.PointsMaterial({size:.16,map:dotTex.t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,color:new THREE.Color(CSS.splunk)})));
  dots.userData.noFit=true;dots.frustumCulled=false;group.add(dots);

  // ---------------------------------------------------------------- traffic: every site through the load balancers
  const lift=(a,b,h)=>[(a[0]+b[0])/2,h,(a[2]+b[2])/2];
  const hubIn=i=>[P.hub[0]+(i-1)*.2,B+.3,P.hub[1]+.5];
  const siteOut=(s,i)=>[s.g.position.x+(i===0?.9:0),B+.08,s.g.position.z-(i===0?.95:.6)];
  const siteList=[campus,bayside,riverside],siteCss=[CSS.campus,CSS.bayside,CSS.riverside];
  const access=siteList.map((s,i)=>{const a=siteOut(s,i),b=hubIn(i);return flow([a,[a[0]*.8+b[0]*.2,B+.25,a[2]*.6+b[2]*.4],lift(a,b,B+.42),b],siteCss[i],{r:.05,spacing:.8});});
  // Hub -> data centre strands, one per site, side by side; level says who is served where.
  const dcGate=(dc,i)=>[dc.g.position.x+(i-1)*.16,B+.12,dc.g.position.z+P.dc[1]/2+.32];
  const strand=(dc,i,dash)=>{const a=[P.hub[0]+(dc===north?-.5:.5),B+.3,P.hub[1]+(i-1)*.12],b=dcGate(dc,i);
    return flow([a,[a[0]+(b[0]-a[0])*.3,B+.55,a[2]+(b[2]-a[2])*.3],[a[0]+(b[0]-a[0])*.75,B+.45,a[2]+(b[2]-a[2])*.75],b],siteCss[i],{r:.042,spacing:.7,dash});};
  const toNorth=siteList.map((s,i)=>strand(north,i,false)),toSouth=siteList.map((s,i)=>strand(south,i,false));
  const ghost=strand(north,2,true);ghost.mesh.position.y+=.06;ghost.mesh.scale.set(1,1,1);ghost.m.uniforms.uColor.value.set('#ffe7a0');
  // ThousandEyes path tests: each site and data centre to the SaaS cloud, with hop marks along the way.
  const tePaths=[],hops=[];
  const hopG=geo('hop',()=>new THREE.SphereGeometry(.045,10,8)),hopM=basic(CSS.te);
  for(const [o,base] of [[campus,campus.te],[bayside,bayside.te],[riverside,riverside.te]]){const a=wp(base,.33),b=new THREE.Vector3(...P.cloud).add(new THREE.Vector3(0,-.35,0));
    const m1=a.clone().lerp(b,.33).add(new THREE.Vector3(0,1.1,0)),m2=a.clone().lerp(b,.7).add(new THREE.Vector3(0,.9,0));
    const f=flow([a.toArray(),m1.toArray(),m2.toArray(),b.toArray()],CSS.te,{r:.018,speed:1.6,spacing:.55,seg:80});tePaths.push(f);
    for(const u of [.3,.55,.8]){const h=add(hopG,hopM,...f.curve.getPoint(u).toArray());h.castShadow=false;h.userData.sensorKeep=true;h.userData.noFit=true;hops.push(h);}}
  for(const dc of [north,south]){const a=new THREE.Vector3(dc.g.position.x,B+.75,dc.g.position.z-.6),b=new THREE.Vector3(...P.cloud).add(new THREE.Vector3(dc===north?-.6:.6,-.3,0));
    tePaths.push(flow([a.toArray(),a.clone().lerp(b,.5).add(new THREE.Vector3(0,.5,0)).toArray(),b.toArray()],CSS.te,{r:.018,speed:1.6,spacing:.55}));}
  const teTag=label('ThousandEyes',CSS.te,1.25,...tePaths[0].curve.getPoint(.42).add(new THREE.Vector3(0,.32,0)).toArray(),'path tests');
  // The approval: a green pulse from the network team to the load balancers.
  const nocOut=[P.noc[0]+.6,B+.2,P.noc[1]-.55];
  const approveFlow=flow([nocOut,[nocOut[0]*.5,B+.9,(nocOut[2]+P.hub[1])/2],[P.hub[0]-.15,B+.55,P.hub[1]+.45]],CSS.ok,{r:.05,speed:3,spacing:.6,level:0});

  // ---------------------------------------------------------------- the forecast panel over the South data centre
  const PX={l:92,r:996,t:132,b:500},M0=30,M1=120;
  const px=m=>PX.l+(m-M0)/(M1-M0)*(PX.r-PX.l),py=u=>PX.b-(u/100)*(PX.b-PX.t);
  const panel=canvas(1024,600,(g,w,h,s)=>drawPanel(g,w,h,s));
  const panelM=basic(0xffffff,{map:panel.t,transparent:true,side:THREE.DoubleSide,depthWrite:false});
  const panelMesh=new THREE.Mesh(geo('panel',()=>new THREE.PlaneGeometry(3.3,3.3*600/1024)),panelM);
  panelMesh.position.set(...P.panel);panelMesh.rotation.x=-.12;panelMesh.userData.sensorKeep=true;panelMesh.renderOrder=6;group.add(panelMesh);
  const panelFrame=edges(geo('panel',null),CSS.splunk,.9,0,0,.002,panelMesh);
  function drawPanel(g,w,h,s){
    if(!s)s={clock:52,redirectAt:null,busy:false,forecast:0,alert:0,done:0};
    g.fillStyle='rgba(5,9,17,.9)';rr(g,4,4,w-8,h-8,22);g.fill();g.strokeStyle=CSS.splunk;g.lineWidth=4;g.stroke();
    g.textBaseline='middle';g.textAlign='left';g.fillStyle='#ffffff';font(g,800,44);g.fillText('SAP · South data centre',36,52);
    g.fillStyle='#9fb3c8';font(g,600,28);g.fillText('Utilisation, live and forecast',36,94);
    g.textAlign='right';g.fillStyle=s.alert>.5&&!s.done?CSS.bad:'#ffffff';font(g,800,64);g.fillText(hhmm(s.clock),w-36,62);
    // Grid, 80 % threshold, time labels.
    g.lineWidth=1.5;for(const u of [20,40,60,100]){g.strokeStyle='rgba(120,160,200,.22)';g.beginPath();g.moveTo(PX.l,py(u));g.lineTo(PX.r,py(u));g.stroke();}
    g.textAlign='right';g.fillStyle='#7f93a8';font(g,600,22);for(const u of [0,20,40,60,80,100])g.fillText(u+'%',PX.l-12,py(u));
    g.setLineDash([14,10]);g.strokeStyle=CSS.bad;g.lineWidth=3;g.beginPath();g.moveTo(PX.l,py(80));g.lineTo(PX.r,py(80));g.stroke();g.setLineDash([]);
    g.textAlign='left';g.fillStyle=CSS.bad;font(g,700,22);g.fillText('80% threshold',PX.l+10,py(80)-16);
    g.textAlign='center';g.fillStyle='#9fb3c8';font(g,600,24);for(const m of [30,60,90,120])g.fillText(hhmm(m),px(m),PX.b+30);
    const now=Math.min(M1,s.clock),rs=s.redirectAt;
    // North, faint, for the imbalance.
    g.strokeStyle='rgba(181,140,255,.75)';g.lineWidth=3;g.beginPath();for(let m=M0;m<=now;m+=.5){const u=model.north(m,rs,s.busy);m===M0?g.moveTo(px(m),py(u)):g.lineTo(px(m),py(u));}g.stroke();
    g.fillStyle='rgba(181,140,255,.95)';font(g,700,22);g.textAlign='left';g.fillText('North',px(now)+10,py(model.north(now,rs,s.busy)));
    // Forecast (dashed) from now to 11:00.
    if(s.forecast>0){const end=now+(M1-now)*s.forecast,redirected=rs!=null&&now>=rs;
      g.setLineDash([12,9]);g.lineWidth=5;g.strokeStyle=redirected?CSS.ok:CSS.warn;g.beginPath();
      for(let m=now;m<=end;m+=.5){const u=redirected?model.south(m,rs):model.southRaw(m);m===now?g.moveTo(px(m),py(u)):g.lineTo(px(m),py(u));}g.stroke();g.setLineDash([]);
      if(!redirected&&end>=90){g.fillStyle=CSS.warn;g.beginPath();g.arc(px(90),py(80),10,0,7);g.fill();g.fillStyle=CSS.warn;font(g,800,24);g.textAlign='center';g.fillText('80% by 10:30',px(90),py(80)+34);}
      if(!redirected&&end>=119){const y=py(model.southRaw(120));g.fillStyle=CSS.bad;g.beginPath();g.arc(px(120),y,12,0,7);g.fill();font(g,800,26);g.textAlign='right';g.fillText('Outage 11:00',px(120)-18,y-4);}}
    // South, live.
    g.strokeStyle='#e8f6ff';g.lineWidth=5;g.beginPath();for(let m=M0;m<=now;m+=.5){const u=model.south(m,rs);m===M0?g.moveTo(px(m),py(u)):g.lineTo(px(m),py(u));}g.stroke();
    const un=model.south(now,rs);g.fillStyle=utilCss(un);g.beginPath();g.arc(px(now),py(un),9,0,7);g.fill();
    g.textAlign='left';font(g,800,24);g.fillText('South '+Math.round(un)+'%',Math.min(px(now)+14,PX.r-150),py(un)-22);
    g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2;g.beginPath();g.moveTo(px(now),PX.t);g.lineTo(px(now),PX.b);g.stroke();
    // Status line.
    const st=s.done?['11:00 · no outage',CSS.ok]:rs!=null&&now>=rs?['Riverside moved north · load rebalanced',CSS.ok]:s.busy&&s.alert>.5&&s.forecast>.99&&s.escalated?['No safe move · on-call SAP team paged',CSS.warn]:s.alert>.5?['ALERT · trending to 80% by 10:30, outage 11:00',CSS.bad]:['Healthy · watching',CSS.ok];
    g.fillStyle=st[1];g.beginPath();g.arc(48,h-38,9,0,7);g.fill();g.textAlign='left';font(g,800,31);g.fillText(st[0],68,h-37);
  }
  let panelKey='';

  // ---------------------------------------------------------------- the cards: alert (to the team), AI agent, outcome
  const card=(w,h,draw)=>canvas(w,h,draw);
  const alertCv=card(760,300,(g,w,h)=>{g.fillStyle='rgba(18,6,10,.93)';rr(g,4,4,w-8,h-8,22);g.fill();g.strokeStyle=CSS.bad;g.lineWidth=6;g.stroke();
    g.fillStyle=CSS.bad;rr(g,4,4,w-8,70,20);g.fill();g.fillStyle='#fff';font(g,800,36);g.textBaseline='middle';g.fillText('SPLUNK ALERT · 10:00',30,40);
    g.fillStyle='#ffffff';font(g,700,34);g.fillText('SAP South: 80% by 10:30',30,124);g.fillStyle='#ffd0d6';font(g,600,32);g.fillText('Outage predicted at 11:00',30,178);
    g.fillStyle='#9fb3c8';font(g,600,26);g.fillText('To: network team',30,236);});
  const alertS=sprite(alertCv,2.4,1.2,B+2.6,-1.55);alertS.name='alert-card';
  const agentCv=card(900,470,(g,w,h,mode='propose')=>{const busy=mode==='busy',ok=mode==='approved';
    g.fillStyle='rgba(12,6,18,.94)';rr(g,4,4,w-8,h-8,24);g.fill();g.strokeStyle=CSS.splunk;g.lineWidth=6;g.stroke();
    g.fillStyle=CSS.splunk;rr(g,4,4,w-8,74,22);g.fill();g.fillStyle='#fff';font(g,800,36);g.textBaseline='middle';g.fillText('SPLUNK AI AGENT',30,42);
    const L=busy?[['Cause: both data centres are busy','#ffffff',34],['South 68% and climbing · North 70%','#ffd38a',30],['Moving Riverside would push North past 80%.','#dfe8f2',27],['No safe move. Paging the on-call SAP team.','#dfe8f2',27]]
      :[['Cause: North/South imbalance','#ffffff',36],['South 68% and climbing · North 41%','#ffd38a',30],['Redirect the Riverside site to North DC','#dfe8f2',29],['with the load balancers?','#dfe8f2',29]];
    L.forEach(([s,c,z],i)=>{g.fillStyle=c;font(g,i?600:800,z);g.fillText(s,30,124+i*56);});
    const by=h-80;
    if(busy){g.fillStyle=CSS.warn;rr(g,30,by,330,58,14);g.fill();g.fillStyle='#1a1206';font(g,800,30);g.fillText('Paged on-call',62,by+30);}
    else{g.fillStyle=ok?CSS.ok:'rgba(63,224,138,.18)';rr(g,30,by,300,58,14);g.fill();g.strokeStyle=CSS.ok;g.lineWidth=3;g.stroke();g.fillStyle=ok?'#06180e':CSS.ok;font(g,800,30);g.fillText(ok?'✓ Approved':'Approve',ok?62:94,by+30);
      g.strokeStyle='#7f93a8';rr(g,350,by,240,58,14);g.stroke();g.fillStyle='#9fb3c8';font(g,700,30);g.fillText('Decline',412,by+30);
      if(ok){g.fillStyle='#bfffd9';font(g,600,26);g.fillText('Network team · 10:04',620,by+30);}}});
  let agentMode='propose';
  const agentS=sprite(agentCv,3.3,P.sites.campus[0]-.45,B+2.2,P.sites.campus[1]+.3);agentS.name='agent-card';
  const doneCv=card(700,150,(g,w,h)=>{g.fillStyle='rgba(4,20,12,.93)';rr(g,4,4,w-8,h-8,22);g.fill();g.strokeStyle=CSS.ok;g.lineWidth=6;g.stroke();
    g.fillStyle=CSS.ok;font(g,800,46);g.textBaseline='middle';g.textAlign='center';g.fillText('11:00 · no outage',w/2,h/2+2);});
  const doneS=sprite(doneCv,2.3,P.south[0],B+3.75,P.south[1]-.9);
  for(const s of [alertS,agentS,doneS])s.visible=false;

  // ---------------------------------------------------------------- per-frame state (pure function of t and state)
  const fade=(s,a)=>{s.visible=a>.01;s.material.opacity=Math.min(1,a);};
  function update(t,s={}){
    const clock=s.clock??52,rs=s.redirectAt??null,busy=!!s.busy;
    const uS=model.south(clock,rs),uN=model.north(clock,rs,busy),share=model.share(clock,rs);
    north.set(uN,t);south.set(uS,t);
    access.forEach((f,i)=>f.set(i===2&&s.focus?.5+.5*(.5+.5*Math.sin(t*6))*s.focus+.5:.85,t));
    // Campus is served by South, Bayside by North, Riverside by South until it moves.
    toSouth[0].set(1,t);toNorth[0].set(0,t);toNorth[1].set(1,t);toSouth[1].set(0,t);
    toSouth[2].set((1-share)*(1+(s.focus||0)*.6*(.5+.5*Math.sin(t*6))),t);toNorth[2].set(share,t);
    ghost.set((s.ghost||0)*(1-share)*1.6,t);
    tePaths.forEach(f=>f.set(.75,t));for(const h of hops)h.scale.setScalar(1+.35*Math.max(0,Math.sin(t*2.4+h.position.x)));
    approveFlow.set(s.approve||0,t);
    hubRing.rotation.y=t*.6;hubCore.material.opacity=.55+.35*(.5+.5*Math.sin(t*2.2));
    ticks.rotation.y=-t*.25;r2.rotation.y=t*.4;
    // Telemetry dots climb to the ring.
    for(let i=0;i<sources.length;i++)for(let j=0;j<PER;j++){const u=((t*.32+j/PER+i*.137)%1+1)%1,a=sources[i],b=targets[i],o=(i*PER+j)*3;
      dotPos[o]=a.x+(b.x-a.x)*u;dotPos[o+1]=a.y+(b.y-a.y)*u+Math.sin(u*Math.PI)*.25;dotPos[o+2]=a.z+(b.z-a.z)*u;}
    dotGeo.attributes.position.needsUpdate=true;
    // Panel, cards, NOC wall.
    const ps={clock,redirectAt:rs,busy,forecast:s.forecast||0,alert:s.alert||0,done:s.done||0,escalated:s.agent==='busy'};
    const key=[Math.round(clock*4),rs,busy,Math.round(ps.forecast*30),ps.alert>.5,ps.done>.5,ps.escalated].join('|');
    if(key!==panelKey){panelKey=key;panel.redraw(ps);}
    fade(alertS,(s.alert||0)*(1-smooth(0,1,s.agent?1:0)));
    if(s.agent&&s.agent!==agentMode){agentMode=s.agent;agentCv.redraw(agentMode);}
    fade(agentS,s.agent?1:0);fade(doneS,s.done||0);
    const wk=(ps.alert>.5&&!(rs!=null&&clock>=rs)?'a':'')+(ps.done>.5?'o':'');if(wk!==wall.key){wall.key=wk;wall.redraw(wk.includes('a')?1:0,wk.includes('o')?1:0);}
    riverside.beacon.material.color.set(s.focus>.5?CSS.riverside:CSS.te);
  }
  update(0,{});

  return{group,P,model,update,north,south,campus,bayside,riverside,hub,noc,ring,cloud,panel:panelMesh,flows,
    anchors:{southSap:south.sap,northSap:north.sap,southGauge:south.gauge,northGauge:north.gauge,riverside:riverside.g,hub,panel:panelMesh,noc,ring,cloud},
    cards:{alert:alertS,agent:agentS,done:doneS},
    tags:[campus.tag,bayside.tag,riverside.tag,hubTag,nocTag,cloudTag,ringTag,teTag,north.sapLabel,south.sapLabel]};
}
