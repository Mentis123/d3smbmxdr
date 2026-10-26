// Detailed, procedural models of the Cisco room devices for the Meeting Room world (lab/rigs/cisco-room.js uses them).
// Schematic but faithful to the data sheet sizes and finishes; no logos, no product renders, no binary assets.
//   Ceiling Microphone Pro  420 x 420 x 48 mm, Carbon Black, bevelled shell, woven acoustic face, three ultrasonic ports,
//                           a status light bar, VESA plate and a four-wire hanging kit.
//   Ceiling Speaker Pro     420 mm wide, 88.2 mm high, a turned (lathe) body, hex-perforated grille over a coaxial driver,
//                           a light ring, VESA bracket and hanging wires. Powered and fed by one PoE+ cable.
//   Room Vision PTZ         165 W x 196 H x 176 D mm: rounded base with turntable, yoke, rounded head with a glass front,
//                           a stepped lens barrel and front element, vents and a status light.
//   rack unit               Room Kit Pro G2 / PoE switch: vented front, port lights, plugged patch leads at the rear.
// Every builder works in METRES in its own group and returns the interface cisco-room.js expects.
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};

export function createDeviceKit(k){
  const {THREE,mat,track}=k;
  const add=(parent,geo,m,x=0,y=0,z=0)=>{const o=k.mesh(track(geo),m,x,y,z);parent.add(o);return o;};
  const canvas=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c;};
  const tex=(c,{srgb=true,repeat=null}={})=>{const t=track(new THREE.CanvasTexture(c));if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}return t;};
  function roundedShape(w,d,r){const s=new THREE.Shape(),x=w/2,y=d/2;s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);return s;}
  // A rounded slab, depth along +y, centred on the origin.
  function slab(w,d,r,h,bevel=.004,seg=8){const g=new THREE.ExtrudeGeometry(roundedShape(w-2*bevel,d-2*bevel,Math.max(.001,r-bevel)),{depth:Math.max(.0005,h-2*bevel),bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:seg});g.rotateX(-Math.PI/2);g.translate(0,-(h-2*bevel)/2,0);return g;}
  // A rounded block facing +z (rounded in the xy profile), depth along z, centred.
  function block(w,h,dz,r,bevel=.006){const g=new THREE.ExtrudeGeometry(roundedShape(w-2*bevel,h-2*bevel,Math.max(.001,r-bevel)),{depth:Math.max(.0005,dz-2*bevel),bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:4,curveSegments:10});g.translate(0,0,-(dz-2*bevel)/2);return g;}

  // Planar 0..1 UVs for a flat shape or disc (ShapeGeometry and CircleGeometry give metre-space UVs otherwise).
  function planarUV(geo,w,d){const p=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/w+.5,p.getY(i)/d+.5);uv.needsUpdate=true;return geo;}
  // ---- finishes ----
  const carbon=new THREE.MeshPhysicalMaterial({color:0x232528,roughness:.42,metalness:.12,clearcoat:.35,clearcoatRoughness:.4});track(carbon);
  const carbonDeep=mat(0x16171a,{roughness:.5,metalness:.2});
  const satinSteel=mat(0x9aa2a9,{metalness:.85,roughness:.28});
  const wire=mat(0xb8bec4,{metalness:.9,roughness:.25});
  const glassBlack=new THREE.MeshPhysicalMaterial({color:0x07090c,roughness:.06,metalness:.3,clearcoat:1,clearcoatRoughness:.05});track(glassBlack);
  const lensGlass=new THREE.MeshPhysicalMaterial({color:0x0b1622,roughness:.02,metalness:.6,clearcoat:1,emissive:0x0b2a44,emissiveIntensity:.5});track(lensGlass);
  const ringMetal=mat(0x2c2f34,{metalness:.7,roughness:.35});
  const ledMat=hex=>mat(0x1c2024,{emissive:hex,emissiveIntensity:.12,roughness:.35});

  // Woven acoustic fabric with fine perforation; the same canvas drives a bump map so it catches light.
  const fabricC=canvas(512,512,(g,w,h)=>{g.fillStyle='#5b5f66';g.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=4){g.fillStyle=y%8?'rgba(0,0,0,.18)':'rgba(255,255,255,.05)';g.fillRect(0,y,w,2);}
    for(let x=0;x<w;x+=4){g.fillStyle=x%8?'rgba(0,0,0,.12)':'rgba(255,255,255,.04)';g.fillRect(x,0,2,h);}
    for(let i=0;i<4000;i++){g.fillStyle=`rgba(${rnd(i)>.5?255:0},${rnd(i)>.5?255:0},${rnd(i)>.5?255:0},.03)`;g.fillRect(rnd(i,1)*w,rnd(i,2)*h,2,2);}});
  const fabricMap=tex(fabricC,{repeat:[3,3]}),fabricBump=tex(fabricC,{srgb:false,repeat:[3,3]});
  const fabric=mat(0xffffff,{map:fabricMap,bumpMap:fabricBump,bumpScale:.6,roughness:.95,emissive:0x1a1c20,emissiveIntensity:1});
  // Hex-perforated metal grille.
  const hexC=canvas(512,512,(g,w,h)=>{g.fillStyle='#62666c';g.fillRect(0,0,w,h);g.fillStyle='#0b0c0e';const s=10;
    for(let row=0,y=0;y<h+s;y+=s*.87,row++)for(let x=(row%2)*s/2;x<w+s;x+=s){g.beginPath();for(let a=0;a<6;a++){const ang=Math.PI/6+a*Math.PI/3;g.lineTo(x+Math.cos(ang)*3.4,y+Math.sin(ang)*3.4);}g.closePath();g.fill();}});
  const hexMap=tex(hexC,{repeat:[2,2]}),hexBump=tex(hexC,{srgb:false,repeat:[2,2]});
  const grille=new THREE.MeshStandardMaterial({color:0xffffff,map:hexMap,bumpMap:hexBump,bumpScale:1,metalness:.45,roughness:.5,emissive:0x17181b,emissiveIntensity:1});track(grille);
  // Vent slots for the racks.
  const ventC=canvas(512,64,(g,w,h)=>{g.fillStyle='#1d1f23';g.fillRect(0,0,w,h);g.fillStyle='#07080a';for(let x=10;x<w-10;x+=9)g.fillRect(x,10,4,h-20);});
  const vent=mat(0xffffff,{map:tex(ventC),roughness:.6,metalness:.4});

  // ---------------------------------------------------------------- Ceiling Microphone Pro
  function micPro(parent,pos,{DS=1,hangTo=null,accent=0xffb02e,name='ceiling-mic-pro'}={}){
    const g=new THREE.Group();g.name=name;g.position.set(...pos);g.scale.setScalar(DS);parent.add(g);
    add(g,slab(.42,.42,.04,.044,.008,10),carbon,0,.004,0);
    // A shadow gap, then the fabric face set 2 mm into the shell.
    add(g,slab(.396,.396,.03,.006,.001),carbonDeep,0,-.019,0).castShadow=false;
    const face=add(g,planarUV(new THREE.ShapeGeometry(roundedShape(.388,.388,.028),8),.388,.388),fabric,0,-.0222,0);face.rotation.x=Math.PI/2;face.castShadow=false;
    // Three ultrasonic ports (positioning and calibration), each a small ring with a dark centre.
    for(const [dx,dz] of [[0,-.13],[.112,.065],[-.112,.065]]){const r=add(g,new THREE.TorusGeometry(.011,.0022,6,20),ringMetal,dx,-.0225,dz);r.rotation.x=Math.PI/2;r.castShadow=false;
      const c=add(g,new THREE.CircleGeometry(.009,16),carbonDeep,dx,-.0226,dz);c.rotation.x=Math.PI/2;}
    // Status light bar on the front edge and a faint perimeter glow line.
    const lm=ledMat(accent);
    const bar=add(g,slab(.07,.006,.003,.003,.0008),lm,0,-.0225,.17);bar.castShadow=false;
    // VESA plate on top with four screws and the wire hanging kit.
    add(g,slab(.12,.12,.01,.006,.001),satinSteel,0,.029,0);
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(g,new THREE.CylinderGeometry(.005,.005,.004,10),carbonDeep,sx*.05,.033,sz*.05);
    if(hangTo){const L=(hangTo-pos[1])/DS;for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const w0=add(g,new THREE.CylinderGeometry(.0012,.0012,L,4),wire,sx*.16,L/2,sz*.16);w0.castShadow=false;
      add(g,new THREE.CylinderGeometry(.005,.005,.012,8),satinSteel,sx*.16,.03,sz*.16);}}
    const anchor=new THREE.Object3D();g.add(anchor);const faceAnchor=new THREE.Object3D();faceAnchor.position.y=-.03;g.add(faceAnchor);
    return{group:g,anchor,face:faceAnchor,ledMat:lm,led(a,t){lm.emissiveIntensity=.14+1.5*a*(.7+.3*Math.sin(t*5));}};
  }

  // ---------------------------------------------------------------- Ceiling Speaker Pro
  function speakerPro(parent,pos,{DS=1,hangTo=null,accent=0xc08cff,name='ceiling-speaker-pro'}={}){
    const g=new THREE.Group();g.name=name;g.position.set(...pos);g.scale.setScalar(DS);parent.add(g);
    // Turned body: flat top, a soft shoulder, straight side, a rolled lip that frames the grille. 88 mm overall.
    const prof=[[0,.044],[.15,.044],[.18,.041],[.198,.034],[.208,.022],[.21,.006],[.21,-.024],[.206,-.036],[.198,-.0425],[.19,-.044]].reverse().map(([x,y])=>new THREE.Vector2(x,y));   // bottom to top, so the faces wind outward
    const body=add(g,new THREE.LatheGeometry(prof,72),carbon);void body;
    // Hex grille, very slightly domed, with the coaxial driver's dark ring and dome showing through it.
    const gr=add(g,planarUV(new THREE.CircleGeometry(.19,72),.38,.38),grille,0,-.0428,0);gr.rotation.x=Math.PI/2;gr.castShadow=false;
    // The coaxial driver shows through as a darker ring and centre (drawn just inside the grille).
    const driver=add(g,new THREE.RingGeometry(.07,.095,64),track(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false})),0,-.0431,0);driver.rotation.x=Math.PI/2;driver.castShadow=false;
    const tweeter=add(g,new THREE.CircleGeometry(.03,40),track(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false})),0,-.0431,0);tweeter.rotation.x=Math.PI/2;tweeter.castShadow=false;
    // Light ring in the lip.
    const lm=ledMat(accent);const ring=add(g,new THREE.TorusGeometry(.2,.0035,6,72),lm,0,-.039,0);ring.rotation.x=Math.PI/2;ring.castShadow=false;
    // VESA bracket and hanging wires.
    add(g,new THREE.CylinderGeometry(.06,.06,.008,32),satinSteel,0,.049,0);
    for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;add(g,new THREE.CylinderGeometry(.0045,.0045,.004,8),carbonDeep,Math.cos(a)*.042,.054,Math.sin(a)*.042);}
    if(hangTo){const L=(hangTo-pos[1])/DS;for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const w0=add(g,new THREE.CylinderGeometry(.0012,.0012,L,4),wire,Math.cos(a)*.13,L/2+.03,Math.sin(a)*.13);w0.castShadow=false;
      add(g,new THREE.CylinderGeometry(.006,.006,.012,8),satinSteel,Math.cos(a)*.13,.046,Math.sin(a)*.13);}}
    const anchor=new THREE.Object3D();g.add(anchor);const faceAnchor=new THREE.Object3D();faceAnchor.position.y=-.045;g.add(faceAnchor);
    return{group:g,anchor,face:faceAnchor,ledMat:lm,led(a,t){lm.emissiveIntensity=.12+1.7*a*(.75+.25*Math.sin(t*6));}};
  }

  // ---------------------------------------------------------------- Room Vision PTZ
  function ptz(parent,pos,{DS=1,ry=0,accent=0x19d3ff,name='room-vision-ptz'}={}){
    const g=new THREE.Group();g.name=name;g.position.set(...pos);g.rotation.y=ry;g.scale.setScalar(DS);parent.add(g);
    // Base: rounded block with a dark status window, a turntable ring on top.
    add(g,slab(.165,.176,.03,.046,.006),carbon,0,.023,0);
    add(g,new THREE.CylinderGeometry(.062,.066,.006,48),carbonDeep,0,.049,0);
    const lm=ledMat(accent);add(g,slab(.03,.004,.002,.004,.0006),lm,0,.012,.088).castShadow=false;
    // Yoke: a turned plinth and two rounded arms, all on the pan joint.
    const yaw=new THREE.Group();yaw.position.y=.052;g.add(yaw);
    add(yaw,new THREE.CylinderGeometry(.058,.06,.016,48),carbon,0,.008,0);
    for(const s of [-1,1]){const arm=add(yaw,block(.02,.11,.07,.01,.004),carbon,s*.074,.066,0);void arm;
      add(yaw,new THREE.CylinderGeometry(.016,.016,.006,24),ringMetal,s*.0845,.108,0).rotation.z=Math.PI/2;}
    // Head on the tilt joint (pivot 0.16 above the base, as aimAt expects).
    const head=new THREE.Group();head.position.y=.108;yaw.add(head);
    add(head,block(.128,.112,.15,.04,.008),carbon,0,0,-.004);
    const front=add(head,planarUV(new THREE.ShapeGeometry(roundedShape(.112,.096,.034),10),.112,.096),glassBlack,0,0,.0715);front.castShadow=false;
    // Side vents.
    for(const s of [-1,1])for(let i=0;i<5;i++){const v=add(head,new THREE.BoxGeometry(.002,.006,.05),carbonDeep,s*.0645,-.03+i*.015,-.02);v.castShadow=false;}
    // Lens: stepped barrel rings, a front element that catches the light, a dark iris.
    for(const [r,z,d] of [[.042,.074,.006],[.036,.079,.006],[.031,.083,.004]]){const b=add(head,new THREE.CylinderGeometry(r,r,d,40),ringMetal,0,-.004,z);b.rotation.x=Math.PI/2;}
    const elem=new THREE.SphereGeometry(.03,40,16,0,Math.PI*2,0,Math.PI*.32);elem.rotateX(Math.PI/2);
    const le=add(head,elem,lensGlass,0,-.004,.0765);le.castShadow=false;
    const iris=add(head,new THREE.CircleGeometry(.011,24),mat(0x020304,{roughness:.2}),0,-.004,.0855);iris.castShadow=false;
    // A small sensor window and a status light on the front.
    add(head,new THREE.CircleGeometry(.004,12),lensGlass,.042,.035,.0718);
    add(head,slab(.012,.004,.002,.004,.0006),lm,-.042,.036,.0725).rotation.x=Math.PI/2;
    const mount=new THREE.Object3D();mount.position.set(0,-.004,.092);head.add(mount);
    const anchor=new THREE.Object3D();anchor.position.y=.1;g.add(anchor);
    return{group:g,anchor,head,mount,yaw,ledMat:lm,pan(a){yaw.rotation.y=a;},tilt(a){head.rotation.x=a;},led(a,t){lm.emissiveIntensity=.16+1.5*a*(.7+.3*Math.sin(t*4));}};
  }

  // ---------------------------------------------------------------- rack unit (Room Kit Pro G2, PoE switch)
  function rackUnit(parent,pos,{w=.44,label='',ports=8,accent=0x5dff9a,name='rack-unit'}={}){
    const g=new THREE.Group();g.name=name;g.position.set(...pos);parent.add(g);
    add(g,slab(w,.3,.004,.044,.002,4),carbon,0,.022,0);
    const ventFace=add(g,new THREE.PlaneGeometry(w*.5,.026),vent,-w*.18,.022,.1505);ventFace.castShadow=false;
    const lab=canvas(512,64,(c,cw,ch)=>{c.fillStyle='#0d1014';c.fillRect(0,0,cw,ch);c.fillStyle='#e8f0f6';c.font='700 34px "Segoe UI",Arial,sans-serif';c.textBaseline='middle';c.fillText(label,16,ch/2+2);});
    const plate=add(g,new THREE.PlaneGeometry(w*.28,w*.28/8),track(new THREE.MeshBasicMaterial({map:tex(lab),toneMapped:false})),w*.25,.03,.1505);plate.castShadow=false;
    const leds=[];
    for(let i=0;i<ports;i++){const x=w*.08+i*(w*.38/ports);
      const port=add(g,new THREE.BoxGeometry(.012,.01,.004),carbonDeep,x,.013,.1505);port.castShadow=false;
      const m=mat(0x1f3326,{emissive:accent,emissiveIntensity:.2,roughness:.4});add(g,new THREE.BoxGeometry(.004,.003,.002),m,x+.005,.021,.152).castShadow=false;leds.push(m);
      // Patch lead plugged in at the back, curving down out of sight.
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x-w*.2,.022,-.15),new THREE.Vector3(x-w*.2,.022,-.19),new THREE.Vector3(x-w*.2+.01*Math.sin(i),-.02,-.22)]);
      add(g,new THREE.TubeGeometry(curve,10,.0025,5,false),mat(0x1d3a66,{roughness:.6}));}
    const status=mat(0xbfffe0,{emissive:accent,emissiveIntensity:.6});add(g,new THREE.CylinderGeometry(.004,.004,.003,12),status,-w/2+.02,.03,.1515).rotation.x=Math.PI/2;
    const anchor=new THREE.Object3D();anchor.position.set(0,.03,.1);g.add(anchor);
    return{group:g,anchor,leds,status,led(a,t){status.emissiveIntensity=.4+.8*a*(.6+.4*Math.sin(t*7));leds.forEach((m,i)=>{m.emissiveIntensity=.15+.6*a*Math.max(0,Math.sin(t*9+i*1.7));});}};
  }

  return{micPro,speakerPro,ptz,rackUnit,materials:{carbon,carbonDeep,satinSteel,grille,fabric}};
}
