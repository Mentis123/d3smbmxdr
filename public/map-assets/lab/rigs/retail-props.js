// Retail kit for the store exhibits (R1 produce scales, R2 deli, R3 produce display): warm store lighting, a store
// floor and back wall, produce (banana bunch, apple, lemon), wooden crates, a self-serve scale with its terminal, a
// glass deli counter, a shopping basket, a shopping trolley, a stock trolley, a shelf bay, a store camera, a
// handheld, and a helper that dresses the shared worker rig as a shopper or a colleague. Procedural only; every
// resource goes through the kit (k.mesh / k.mat / k.track) so the exhibit lifecycle disposes it. Words on screens
// stay in the host caption and overlay: the terminal and handheld only show pictograms and colours.
const rnd=(i,s=0)=>{const x=Math.sin(i*127.1+s*311.7+.5)*43758.5453;return x-Math.floor(x);};

export function createRetailProps(k){
  const {THREE,root,mat,track}=k;
  const instances=[];
  const put=(g,o,x,y,z)=>{g.add(o);if(x!==undefined)o.position.set(x,y,z);return o;};
  const group=(name,x=0,y=0,z=0,ry=0,parent=root)=>{const g=new THREE.Group();g.name=name;g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);return g;};
  const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return{t,c};};

  // Shared materials.
  const M={
    wood:mat(0xb88a56,{roughness:.8}),woodDark:mat(0x8a6238,{roughness:.85}),
    laminate:mat(0xf0ebe2,{roughness:.55}),warmWhite:mat(0xf6f1e8,{roughness:.6}),
    stainless:mat(0xc9cfd2,{metalness:.8,roughness:.28}),blackPlastic:mat(0x1d2124,{roughness:.5}),
    green:mat(0x2f6b4f,{roughness:.6}),red:mat(0xc8372d,{roughness:.55}),
    glass:mat(0xdff3f7,{metalness:.1,roughness:.04,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}),
    rubber:mat(0x222628,{roughness:.9}),
  };

  // ---- Warm store stage: lights, background, plinth colours, store floor ----
  function storeStage({floor=0xe9dfcf,wall=true,wallColour=0xe6d6bd,trim=0x2f6b4f}={}){
    const scene=root.parent;
    if(scene){
      scene.background=new THREE.Color(0x2a221c);if(scene.fog){scene.fog.color.set(0x2a221c);scene.fog.near=20;scene.fog.far=42;}
      scene.traverse(o=>{
        if(o.isHemisphereLight){o.color.set(0xfff2df);o.groundColor.set(0x8b7a66);o.intensity=2.5;}
        else if(o.isDirectionalLight&&o.castShadow){o.color.set(0xfff0d9);o.intensity=3.1;}
        else if(o.isDirectionalLight){o.color.set(0xffd2a1);o.intensity=1.1;}
      });
      const fill=new THREE.DirectionalLight(0xfff6ea,1.0);fill.position.set(3,5,6);scene.add(fill);
    }
    // The shared plinth: its base turns warm timber and its cyan edge lines go (they read as the industrial night set).
    for(const o of [...root.children]){if(!o.isMesh)continue;if(o.material===k.cyan)o.visible=false;else if(o.geometry?.parameters?.width===7&&o.geometry.parameters.height===.3)o.material=mat(0x3b2b20,{roughness:.7,metalness:.05});}
    const {t:floorTex}=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#'+floor.toString(16).padStart(6,'0');g.fillRect(0,0,w,h);
      for(let i=0;i<500;i++){const v=rnd(i,1);g.fillStyle=`rgba(${v<.5?120:255},${v<.5?100:250},${v<.5?80:240},${.05+rnd(i,2)*.08})`;g.fillRect(rnd(i,3)*w,rnd(i,4)*h,1+rnd(i,5)*3,1+rnd(i,6)*3);}
      g.strokeStyle='rgba(120,100,80,.28)';g.lineWidth=2;for(let x=0;x<=w;x+=128){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();g.beginPath();g.moveTo(0,x);g.lineTo(w,x);g.stroke();}});
    floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(6.85/1.2,4.25/1.2);
    const f=k.box(6.85,.012,4.25,mat(0xffffff,{map:floorTex,roughness:.55}),0,.006,0);f.castShadow=false;f.name='store-floor';
    if(wall){
      const w=k.box(6.85,2.5,.08,mat(wallColour,{roughness:.9}),0,1.25,-2.08);w.castShadow=false;w.name='store-wall';
      k.box(6.85,.16,.1,mat(trim,{roughness:.6}),0,2.42,-2.06).castShadow=false;
      k.box(6.85,.1,.1,mat(0x6b5a48,{roughness:.8}),0,.05,-2.06).castShadow=false;
    }
    return{floor:f};
  }

  // ---- Produce ----
  // Banana finger: a five-sided tube along a curve, tapered at the stem and the tip, coloured by vertex.
  const fingerGeo=(()=>{
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,0,0),new THREE.Vector3(0,.012,.105),new THREE.Vector3(0,.07,.175));
    const S=16,R=5,g=track(new THREE.TubeGeometry(curve,S,.0185,R,false)),p=g.attributes.position,col=new Float32Array(p.count*3);
    const yellow=new THREE.Color(1,1,1),stem=new THREE.Color(.62,.72,.42),tip=new THREE.Color(.22,.17,.12),c=new THREE.Color(),v=new THREE.Vector3();
    for(let i=0;i<=S;i++){const u=i/S,ctr=curve.getPointAt(u),f=u<.22?.32+.68*Math.sin(u/.22*Math.PI/2):u>.82?1-.55*((u-.82)/.18)**1.4:1;
      c.copy(u<.16?stem:yellow).lerp(yellow,u<.16?u/.16:0);if(u>.95)c.copy(tip);
      for(let j=0;j<=R;j++){const n=i*(R+1)+j;v.fromBufferAttribute(p,n).sub(ctr).multiplyScalar(f).add(ctr);p.setXYZ(n,v.x,v.y,v.z);col.set([c.r,c.g,c.b],n*3);}}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();return g;})();
  const bananaMat=mat(0xf2cf3a,{vertexColors:true,roughness:.55});
  const crownMat=mat(0x6d6a2e,{roughness:.8});
  function bananaBunch({fingers=6,seed=0,parent=root,name='banana-bunch',spread=.13}={}){
    const g=group(name,0,0,0,0,parent);
    const crown=put(g,k.cylinder(.013,.05,crownMat,0,0,0),0,.012,-.018);crown.rotation.x=Math.PI/2-.25;
    for(let i=0;i<fingers;i++){const row=i%2,a=(i-(fingers-1)/2)*spread+(rnd(seed,i)-.5)*.04;
      const f=put(g,k.mesh(fingerGeo,bananaMat),0,0,0);f.position.set(Math.sin(a)*.012,.028*row,0);f.rotation.set(-.06*row,a,(rnd(seed,i+9)-.5)*.12);f.scale.setScalar(.96+rnd(seed,i+3)*.1);}
    return g;
  }
  const appleGeo=(()=>{const g=track(new THREE.SphereGeometry(1,14,10)),p=g.attributes.position,v=new THREE.Vector3();
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const r=Math.hypot(v.x,v.z);v.y=v.y*.86-.16*Math.exp(-r*r/.06)*Math.sign(v.y||1);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;})();
  const lemonGeo=(()=>{const g=track(new THREE.SphereGeometry(1,14,10)),p=g.attributes.position,v=new THREE.Vector3();
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);v.x*=1.22+.22*Math.abs(v.x)**6;p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;})();
  const FRUIT={apple:{geo:appleGeo,r:.04,colours:[0xb8262a,0xc9372b,0xa61f26,0xd0452f]},lemon:{geo:lemonGeo,r:.032,colours:[0xf3d23a,0xf0c829,0xf6dc4f]},orange:{geo:appleGeo,r:.04,colours:[0xf08a1c,0xe97c12,0xf39a2a]}};
  function fruit(kind,{x=0,y=0,z=0,parent=root,seed=0}={}){const F=FRUIT[kind];const o=k.mesh(F.geo,mat(F.colours[seed%F.colours.length],{roughness:kind==='lemon'?.6:.38}));o.scale.setScalar(F.r);o.position.set(x,y+F.r*.86,z);o.rotation.y=rnd(seed,4)*6;if(parent!==root)parent.add(o);return o;}

  // ---- Wooden crate with stock. kind apple|lemon|orange (instanced) or banana (bunches). Slots are filled bottom
  // layer first; show(n) keeps the first n, so taking stock removes from the top and refilling rebuilds from below.
  function crate({w=.6,d=.42,h=.16,kind='apple',layers=2,parent=root,x=0,y=0,z=0,rx=0,ry=0,seed=0,name='crate'}={}){
    const g=group(name,x,y,z,ry,parent);g.rotation.x=rx;
    const t=.018;
    put(g,k.box(w,t,d,M.woodDark,0,t/2,0));
    for(const s of [-1,1]){put(g,k.box(w,h*.42,t,M.wood,0,h*.25,s*(d/2-t/2)));put(g,k.box(w,h*.32,t,M.wood,0,h*.78,s*(d/2-t/2)));
      put(g,k.box(t,h*.42,d,M.wood,s*(w/2-t/2),h*.25,0));put(g,k.box(t,h*.32,d,M.wood,s*(w/2-t/2),h*.78,0));
      for(const s2 of [-1,1])put(g,k.box(.03,h,.03,M.woodDark,s*(w/2-.015),h/2,s2*(d/2-.015)));}
    const slots=[];let items=null,inst=null;
    if(kind==='banana'){
      items=[];const nx=Math.max(1,Math.floor(w/.2)),nz=Math.max(1,Math.floor(d/.2));
      for(let L=0;L<layers;L++)for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){const b=bananaBunch({parent:g,seed:seed+items.length});const sx=(ix+.5)/nx-.5,sz=(iz+.5)/nz-.5;
        b.position.set(sx*w*.86-.06,t+.012+L*.045,sz*d*.7-.06);b.rotation.y=(L%2?.5:-.3)+(rnd(seed,items.length)-.5)*.5;items.push(b);}
    }else{
      const F=FRUIT[kind],r=F.r,step=r*2.05,nx=Math.max(1,Math.floor((w-2*t)/step)),nz=Math.max(1,Math.floor((d-2*t)/step));
      for(let L=0;L<layers;L++){const off=L%2?step*.5:0,cx=nx-(L%2?1:0),cz=nz-(L%2?1:0),order=[];
        for(let ix=0;ix<cx;ix++)for(let iz=0;iz<cz;iz++)order.push([ix,iz,rnd(seed+L*31,ix*17+iz)]);
        order.sort((a,b)=>a[2]-b[2]);
        for(const [ix,iz] of order)slots.push({x:-(cx-1)*step/2+ix*step+(rnd(ix,iz+L)-.5)*r*.15,y:t+r*.86+L*r*1.45,z:-(cz-1)*step/2+iz*step+(rnd(iz,ix+L)-.5)*r*.15,ry:rnd(ix+L,iz)*6,c:F.colours[(ix*7+iz*3+L)%F.colours.length]});}
      const fm=mat(F.colours[0],{roughness:kind==='lemon'?.6:.38});
      inst=new THREE.InstancedMesh(F.geo,fm,slots.length);instances.push(inst);inst.userData.noFit=true;inst.castShadow=inst.receiveShadow=true;inst.name=name+'-stock';g.add(inst);
      const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color();
      slots.forEach((s,i)=>{q.setFromEuler(e.set(0,s.ry,0));m4.compose(new THREE.Vector3(s.x,s.y,s.z),q,new THREE.Vector3(r,r,r));inst.setMatrixAt(i,m4);const v=.8+.2*rnd(i,seed+5);inst.setColorAt(i,c.setRGB(v,v*(kind==='apple'?.92+.08*rnd(i,3):1),v));});
      inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
      const sphere=new THREE.Sphere(new THREE.Vector3(0,h/2,0),Math.hypot(w,d)/2+.1);inst.boundingSphere=sphere;inst.frustumCulled=false;
    }
    const total=items?items.length:slots.length;
    function show(n){n=Math.max(0,Math.min(total,Math.round(n)));
      if(items)items.forEach((b,i)=>{b.visible=i<n;});else inst.count=n;}
    return{group:g,instanced:inst,items,total,show};
  }

  // ---- Self-serve produce scale: counter body, load plate, terminal screen, overhead camera arm ----
  // Built facing +z (the shopper stands in front). Returns hooks for the plate, the screen and the readout.
  function produceScale({x=0,z=0,ry=0}={}){
    const g=group('produce-scale',x,0,z,ry);
    put(g,k.box(1.3,.84,.56,M.laminate,.1,.42,0));
    put(g,k.box(1.3,.1,.03,M.green,.1,.75,.29));                                  // store-green band
    put(g,k.box(1.3,.06,.04,M.blackPlastic,.1,.04,.27));
    put(g,k.box(1.36,.035,.62,M.warmWhite,.1,.858,0));
    // Load cell housing + plate (the plate dips a few mm when loaded: set by settle()).
    put(g,k.box(.44,.03,.38,M.blackPlastic,.16,.89,.0));
    const plate=put(g,k.box(.42,.012,.36,M.stainless,.16,.912,0));plate.name='scale-plate';
    // Basket ledge on the left, a little raised.
    put(g,k.box(.4,.04,.42,M.wood,-.36,.895,.02));
    // Readout panel on the front (the scale's own measurement), lit when the weight settles.
    const {t:lcdTex,c:lcdCanvas}=canvasTex(128,48,()=>{});
    const lcdMat=track(new THREE.MeshBasicMaterial({map:lcdTex,toneMapped:false}));
    const lcd=put(g,k.mesh(track(new THREE.PlaneGeometry(.2,.075)),lcdMat),.16,.8,.292);lcd.castShadow=false;
    put(g,k.box(.24,.1,.012,M.blackPlastic,.16,.8,.284));
    // Terminal on a post at the back right, angled to the shopper.
    put(g,k.box(.06,.46,.06,M.stainless,.58,1.09,-.2));
    const head=group('terminal',.55,1.27,-.12,-.18,g);head.rotation.x=-.42;
    put(head,k.box(.46,.34,.04,M.blackPlastic,0,0,0));
    const {t:scrTex,c:scrCanvas}=canvasTex(256,192,()=>{});
    const scrMat=track(new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false}));
    const screen=put(head,k.mesh(track(new THREE.PlaneGeometry(.41,.3)),scrMat),0,0,.021);screen.castShadow=false;screen.name='terminal-screen';
    // Camera arm: up from the back left corner, out over the plate.
    put(g,k.box(.05,1.0,.05,M.stainless,-.12,1.36,-.24));
    put(g,k.box(.05,.04,.3,M.stainless,-.12,1.84,-.1));put(g,k.box(.3,.04,.05,M.stainless,.02,1.84,.03));
    let screenState='',lcdState='';
    function drawScreen(state){
      if(state===screenState)return;screenState=state;const c=scrCanvas.getContext('2d'),W=scrCanvas.width,H=scrCanvas.height;
      c.fillStyle='#f4efe6';c.fillRect(0,0,W,H);c.fillStyle='#2f6b4f';c.fillRect(0,0,W,22);
      const tile=(x,y,w,h,sel)=>{c.fillStyle=sel?'#fff7d6':'#ffffff';c.strokeStyle=sel?'#e0a21a':'#d5cec2';c.lineWidth=sel?6:3;c.beginPath();c.roundRect(x,y,w,h,12);c.fill();c.stroke();};
      const banana=(cx,cy,s)=>{c.save();c.translate(cx,cy);c.scale(s,s);c.fillStyle='#f2c62e';c.strokeStyle='#8a6a12';c.lineWidth=3/s;c.beginPath();c.moveTo(-40,-14);c.quadraticCurveTo(0,40,44,-20);c.quadraticCurveTo(4,18,-40,-14);c.fill();c.stroke();c.restore();};
      const apple=(cx,cy,s)=>{c.fillStyle='#c8372d';c.beginPath();c.arc(cx,cy,26*s,0,7);c.fill();c.fillStyle='#4f7a2a';c.fillRect(cx-2*s,cy-34*s,4*s,10*s);};
      const lemon=(cx,cy,s)=>{c.fillStyle='#f3d23a';c.beginPath();c.ellipse(cx,cy,32*s,22*s,0,0,7);c.fill();};
      if(state==='idle'){c.fillStyle='#e7dfd1';for(let i=0;i<3;i++){c.beginPath();c.roundRect(24+i*72,60,64,90,10);c.fill();}}
      else if(state==='suggest'||state==='done'){
        // Left: the camera's suggestion as a big banana tile. Right: the scale's own reading as a pictogram (a pan
        // and a lit readout), so the screen shows two sources side by side without any invented number.
        tile(14,32,150,124,true);banana(89,92,1.35);
        c.fillStyle='#e9e2d4';c.beginPath();c.roundRect(176,32,66,124,10);c.fill();
        c.fillStyle='#55606a';c.fillRect(186,74,46,6);c.fillRect(205,80,8,26);c.fillRect(192,104,34,8);
        c.fillStyle='#9fd7a2';c.beginPath();c.roundRect(184,118,50,26,5);c.fill();c.fillStyle='#14321c';for(let i=0;i<3;i++)c.fillRect(190+i*15,128,10,6);
        c.fillStyle=state==='done'?'#2f9e5b':'#2f6b4f';c.beginPath();c.roundRect(40,162,176,26,10);c.fill();
        if(state==='done'){c.strokeStyle='#ffffff';c.lineWidth=5;c.beginPath();c.moveTo(114,175);c.lineTo(126,184);c.lineTo(146,166);c.stroke();
          // The press: rings where the finger landed on the tile.
          c.strokeStyle='rgba(224,162,26,.9)';for(const r of [16,30,44]){c.lineWidth=r===16?6:3;c.beginPath();c.arc(96,118,r,0,7);c.stroke();}}}
      else if(state==='list'||state==='list-done'){[[14,'banana'],[94,'lemon'],[174,'apple']].forEach(([x,f],i)=>{tile(x,40,70,108,state==='list-done'&&i===0);if(f==='banana')banana(x+35,94,.7);else if(f==='lemon')lemon(x+35,94,.9);else apple(x+35,98,.9);});
        if(state==='list-done'){c.strokeStyle='rgba(224,162,26,.9)';for(const r of [12,24]){c.lineWidth=r===12?5:3;c.beginPath();c.arc(49,112,r,0,7);c.stroke();}}
        c.fillStyle=state==='list-done'?'#2f9e5b':'#9aa39b';c.beginPath();c.roundRect(60,160,136,24,10);c.fill();}
      scrTex.needsUpdate=true;
    }
    function drawLcd(state){
      if(state===lcdState)return;lcdState=state;const c=lcdCanvas.getContext('2d'),W=lcdCanvas.width,H=lcdCanvas.height;
      c.fillStyle=state==='off'?'#1d2a22':'#9fd7a2';c.fillRect(0,0,W,H);
      c.fillStyle=state==='off'?'#23332a':'#14321c';
      if(state==='dashes')for(let i=0;i<4;i++)c.fillRect(12+i*26,22,18,5);
      if(state==='steady'){for(let i=0;i<4;i++){c.fillRect(12+i*26,10,18,4);c.fillRect(12+i*26,34,18,4);c.fillRect(10+i*26,13,4,22);c.fillRect(28+i*26,13,4,22);}c.beginPath();c.arc(W-12,H/2,6,0,7);c.fill();}
      lcdTex.needsUpdate=true;
    }
    drawScreen('idle');drawLcd('off');
    const plateTop=()=>.918;
    return{group:g,plate,terminal:head,lens:new THREE.Vector3(.16,1.76,.03).applyAxisAngle(new THREE.Vector3(0,1,0),ry).add(new THREE.Vector3(x,0,z)),
      plateCentre:new THREE.Vector3(.16,.918,0).applyAxisAngle(new THREE.Vector3(0,1,0),ry).add(new THREE.Vector3(x,0,z)),
      ledge:new THREE.Vector3(-.36,.915,.02).applyAxisAngle(new THREE.Vector3(0,1,0),ry).add(new THREE.Vector3(x,0,z)),
      screenCentre:new THREE.Vector3(.55,1.27,-.12).applyAxisAngle(new THREE.Vector3(0,1,0),ry).add(new THREE.Vector3(x,0,z)),
      settle(dip){plate.position.y=.912-.004*dip;},screen:drawScreen,lcd:drawLcd,plateTop};
  }

  // ---- Shopping basket (red plastic with two handles) ----
  function basket({x=0,y=0,z=0,ry=0,parent=root}={}){
    const g=group('basket',x,y,z,ry,parent),bm=mat(0xc7332b,{roughness:.55}),W=.42,D=.3,H=.2;
    put(g,k.box(W*.9,.015,D*.9,bm,0,.008,0));
    for(const s of [-1,1]){const a=put(g,k.box(W,H,.012,bm,0,H/2,s*D/2));a.rotation.x=s*.08;const b=put(g,k.box(.012,H,D,bm,s*W/2,H/2,0));b.rotation.z=-s*.08;}
    for(const s of [-1,1]){const hdl=put(g,k.mesh(track(new THREE.TorusGeometry(.1,.009,6,16,Math.PI)),M.blackPlastic),s*.07,H,0);hdl.rotation.y=Math.PI/2;}
    return g;
  }

  // ---- Shopping trolley (wire basket on a chassis) ----
  function shoppingTrolley({x=0,z=0,ry=0,parent=root}={}){
    const g=group('trolley',x,0,z,ry,parent),wire=mat(0xb9c2c7,{metalness:.7,roughness:.35}),red=M.red;
    const L=.75,W=.48;
    for(const [a,b] of [[[-L/2,.5,-W/2],[L/2,.55,-W/2]],[[-L/2,.5,W/2],[L/2,.55,W/2]],[[-L/2,.85,-W/2],[L/2,.95,-W/2]],[[-L/2,.85,W/2],[L/2,.95,W/2]],[[-L/2,.5,-W/2],[-L/2,.85,-W/2]],[[-L/2,.5,W/2],[-L/2,.85,W/2]],[[L/2,.55,-W/2],[L/2,.95,-W/2]],[[L/2,.55,W/2],[L/2,.95,W/2]],[[-L/2,.85,-W/2],[-L/2,.85,W/2]],[[L/2,.95,-W/2],[L/2,.95,W/2]],[[-L/2,.5,-W/2],[-L/2,.5,W/2]],[[L/2,.55,-W/2],[L/2,.55,W/2]]])put(g,k.bar(a,b,.008,wire));
    for(let i=1;i<6;i++){const u=-L/2+i*L/6;put(g,k.bar([u,.5+.05*(i/6),-W/2],[u,.85+.1*(i/6),-W/2],.004,wire));put(g,k.bar([u,.5+.05*(i/6),W/2],[u,.85+.1*(i/6),W/2],.004,wire));}
    put(g,k.box(L,.012,W,mat(0xa9b2b7,{metalness:.6,roughness:.4,transparent:true,opacity:.7}),0,.52,0));
    for(const s of [-1,1]){put(g,k.bar([L/2,.95,s*W/2],[L/2+.12,1.02,s*W/2],.01,wire));put(g,k.bar([-L/2,.5,s*W/2],[-L/2,.12,s*W*.4],.012,wire));put(g,k.bar([L/2,.55,s*W/2],[L/2,.12,s*W*.4],.012,wire));}
    put(g,k.bar([L/2+.12,1.02,-W/2-.02],[L/2+.12,1.02,W/2+.02],.018,red));
    for(const [u,s] of [[-L/2,-1],[-L/2,1],[L/2,-1],[L/2,1]]){const wl=put(g,k.cylinder(.05,.03,M.rubber,u,.05,s*W*.4));wl.rotation.x=Math.PI/2;}
    put(g,k.box(L,.012,W*.8,wire,0,.14,0));
    return g;
  }

  // ---- Stock trolley: a flat deck on casters with a push handle at the back (-x local), for replenishment ----
  function stockTrolley({x=0,z=0,ry=0,parent=root}={}){
    const g=group('stock-trolley',x,0,z,ry,parent),blue=mat(0x2f5a7a,{roughness:.55});
    put(g,k.box(.8,.04,.5,blue,0,.2,0));put(g,k.box(.82,.02,.52,M.blackPlastic,0,.225,0));
    for(const s of [-1,1])put(g,k.bar([-.4,.22,s*.22],[-.44,1.0,s*.22],.016,M.stainless));
    put(g,k.bar([-.44,1.0,-.24],[-.44,1.0,.24],.02,M.blackPlastic));
    for(const [u,s] of [[-.32,-1],[-.32,1],[.32,-1],[.32,1]]){put(g,k.box(.03,.12,.03,M.stainless,u,.13,s*.2));const wl=put(g,k.cylinder(.055,.035,M.rubber,u,.055,s*.2));wl.rotation.x=Math.PI/2;}
    return g;
  }

  // ---- Shelf bay (gondola): back panel, shelves, rows of grocery packs (instanced): boxes, cans and bottles in
  // muted colours, so the bay reads as a supermarket shelf rather than a bookcase.
  function shelfBay({x=0,z=0,ry=0,w=1.2,h=1.6,d=.42,parent=root,seed=0}={}){
    const g=group('shelf-bay',x,0,z,ry,parent),panel=mat(0xe9e4dc,{roughness:.7}),shelfM=mat(0xd8d2c8,{roughness:.5,metalness:.2});
    put(g,k.box(w,h,.04,panel,0,h/2,-d/2));put(g,k.box(w,.12,d,M.green,0,.06,0));
    for(const s of [-1,1])put(g,k.box(.04,h,d,panel,s*(w/2-.02),h/2,0));
    put(g,k.box(w,.14,.06,M.green,0,h+.07,-d/2+.03));
    const ys=[.14,.52,.9,1.28];const items={box:[],can:[],bottle:[]};
    for(const y of ys){put(g,k.box(w-.06,.025,d,shelfM,0,y,0));put(g,k.box(w-.06,.04,.02,mat(0xf6f1e8),0,y-.005,d/2));}
    const colours=[0xc96a5a,0xe0b56a,0x6f93b8,0x7fa877,0xf1ece2,0x9a7fa6,0xd98c4a];
    // Each shelf holds one kind in facings of one colour, like a real planogram: cans, cereal-style boxes, bottles.
    const kinds=['can','box','bottle','box'];
    ys.forEach((y,L)=>{const kind=kinds[(L+seed)%kinds.length];let px=-w/2+.06,i=0;
      while(px<w/2-.1){const facing=Math.floor(i/3),c=colours[(L*2+facing+seed)%colours.length];
        if(kind==='can'){const r=.034;for(const dz of [.07,-.03])items.can.push({x:px+r,y:y+.0125+.06,z:dz,sx:r,sy:.12,sz:r,c});px+=r*2+.008;}
        else if(kind==='bottle'){const r=.03,hh=.24;items.bottle.push({x:px+r,y:y+.0125+hh/2,z:.05,sx:r,sy:hh,sz:r,c});px+=r*2+.014;}
        else{const pw=.1+rnd(seed+L,facing)*.03,ph=.2+rnd(seed+L,facing+5)*.06;items.box.push({x:px+pw/2,y:y+.0125+ph/2,z:.02,sx:pw,sy:ph,sz:.07,c});px+=pw+.008;}
        i++;}});
    const geos={box:track(new THREE.BoxGeometry(1,1,1)),can:track(new THREE.CylinderGeometry(1,1,1,12)),bottle:track(new THREE.CylinderGeometry(.55,1,1,10))};
    const m4=new THREE.Matrix4(),c=new THREE.Color();
    for(const kind of ['box','can','bottle']){const list=items[kind];if(!list.length)continue;
      const inst=new THREE.InstancedMesh(geos[kind],mat(0xffffff,{roughness:kind==='can'?.35:.65,metalness:kind==='can'?.35:0}),list.length);instances.push(inst);inst.userData.noFit=true;g.add(inst);inst.castShadow=true;inst.receiveShadow=true;
      list.forEach((p,i)=>{m4.makeScale(p.sx,p.sy,kind==='box'?p.sz*3:p.sz);m4.setPosition(p.x,p.y,p.z);inst.setMatrixAt(i,m4);inst.setColorAt(i,c.set(p.c));});
      inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;inst.frustumCulled=false;}
    return g;
  }

  // ---- Glass deli counter (customer side +z): base, glass front and top, lit trays, stainless lip ----
  function deliCounter({x=0,z=0,ry=0,w=2.6,parent=root}={}){
    const g=group('deli-counter',x,0,z,ry,parent),H=.92,D=.9;
    put(g,k.box(w,H-.12,D,M.laminate,0,(H-.12)/2+.06,0));
    put(g,k.box(w,.06,D-.04,M.blackPlastic,0,.03,0));
    put(g,k.box(w+.02,.14,.03,M.wood,0,.3,D/2+.005));put(g,k.box(w+.02,.05,.03,M.green,0,.48,D/2+.005));
    put(g,k.box(w,.04,D,M.stainless,0,H,0));
    // Glass: a sloped front pane and a flat top, with stainless end frames.
    const paneH=.42,lean=.22;
    const front=put(g,k.mesh(track(new THREE.PlaneGeometry(w-.04,paneH)),M.glass),0,H+paneH/2*Math.cos(lean),D/2-.06-paneH/2*Math.sin(lean));front.rotation.x=-lean;front.castShadow=false;
    const topZ=D/2-.06-paneH*Math.sin(lean),topD=topZ+.05;
    const top=put(g,k.mesh(track(new THREE.PlaneGeometry(w-.04,topD)),M.glass),0,H+paneH*Math.cos(lean),topZ-topD/2);top.rotation.x=-Math.PI/2;top.castShadow=false;
    for(const s of [-1,1]){const e=new THREE.Shape();e.moveTo(-.05,0);e.lineTo(D/2-.06,0);e.lineTo(topZ,paneH*Math.cos(lean));e.lineTo(-.05,paneH*Math.cos(lean));e.closePath();
      const eg=track(new THREE.ExtrudeGeometry(e,{depth:.03,bevelEnabled:false}));const em=put(g,k.mesh(eg,M.stainless),s*(w/2-.015)-.015,H,0);em.rotation.y=-Math.PI/2;em.position.x=s*(w/2)-(s>0?0:-.03);}
    // Lit interior: a warm light strip and trays of food in colours that read as a deli.
    const strip=put(g,k.box(w-.1,.015,.04,mat(0xfff4dc,{emissive:0xffe2a8,emissiveIntensity:1.2}),0,H+paneH*Math.cos(lean)-.02,-.0));strip.castShadow=false;
    const foods=[0xe7a0a0,0xd06a5a,0xf2d27a,0x9cc46a,0xf0e0c0,0xc96f3b,0xe8c26a,0x7fb35a];
    const n=Math.floor((w-.1)/.3);
    for(let i=0;i<n;i++){const tx=-(n-1)*.15+i*.3;put(g,k.box(.27,.035,.3,M.stainless,tx,H+.04,.12));
      const food=put(g,k.box(.24,.05,.26,mat(foods[i%foods.length],{roughness:.7}),tx,H+.075,.12));food.scale.y=.8+rnd(i,3)*.5;}
    // Staff side: a work shelf under the counter top.
    put(g,k.box(w-.1,.03,.35,M.stainless,0,.55,-D/2+.2));
    return{group:g,height:H,depth:D,glassTop:H+paneH*Math.cos(lean)};
  }

  // ---- Store camera: compact dome/bullet housing pointing from lens toward look; returns the sensor camera ----
  function storeCamera(lens,look,{fov=46,parent=root}={}){
    const L=new THREE.Vector3(...lens),T=new THREE.Vector3(...look);
    const housing=new THREE.Group();housing.name='store-camera';housing.position.copy(L);parent.add(housing);housing.lookAt(T);
    const shell=mat(0xf2f2ee,{roughness:.4});
    const hb=put(housing,k.box(.12,.11,.22,shell,0,0,0),0,0,-.02);
    const hood=put(housing,k.box(.15,.02,.27,shell,0,0,0),0,.065,0);
    const ring=put(housing,k.cylinder(.045,.03,M.blackPlastic,0,0,0),0,0,.1);ring.rotation.x=Math.PI/2;
    const glass=put(housing,k.cylinder(.035,.02,mat(0x0a1720,{metalness:.8,roughness:.08}),0,0,0),0,0,.115);glass.rotation.x=Math.PI/2;
    const tally=put(housing,k.box(.018,.018,.01,mat(0xff4b3e,{emissive:0xff2a1a,emissiveIntensity:.9}),0,0,0),.04,.035,.092);
    void hb;void hood;void tally;
    const camera=new THREE.PerspectiveCamera(fov,1,.03,30);camera.position.copy(L).add(new THREE.Vector3().subVectors(T,L).normalize().multiplyScalar(.16));camera.lookAt(T);root.add(camera);
    return{housing,camera};
  }

  // ---- Handheld: a small device with a screen whose colour carries the notification state ----
  function handheld(parent){
    const g=new THREE.Group();g.name='handheld';parent.add(g);
    put(g,k.box(.08,.14,.016,M.blackPlastic,0,0,0));
    const scr=mat(0x23323a,{emissive:0x000000,emissiveIntensity:1});const s=put(g,k.box(.066,.1,.004,scr,0,.008,.009));s.castShadow=false;
    // A soft glow round the device while a notification is showing, so it reads from across the store.
    const {t:haloTex}=canvasTex(64,64,(c)=>{const gr=c.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,64,64);});
    const halo=new THREE.Sprite(track(new THREE.SpriteMaterial({map:haloTex,color:0xffb02e,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.85})));halo.scale.set(.32,.32,1);halo.position.set(0,.01,.03);halo.visible=false;g.add(halo);
    return{group:g,set(state){const c=state==='alert'?0xffb02e:state==='ok'?0x3ccf7a:state==='none'?0x7fa7b8:0x23323a;scr.color.set(c);scr.emissive.set(state==='off'?0x000000:c);scr.emissiveIntensity=state==='off'?0:.8;
      halo.visible=state==='alert'||state==='ok';halo.material.color.set(c);}};
  }

  // ---- Stand up straight: the shared rig's hip height bends the knees by about 48 degrees when standing. After
  // each pose(), raise the pelvis until the more extended leg is nearly straight and re-solve both legs for the
  // same foot positions (so planted feet stay planted). Self-limiting: a rig whose legs are already straight is left
  // as it is. reach is the leg extension to aim for: nearly straight when standing, a little less mid-stride.
  function stand(p,weight=0){
    if(!p._legs){const pelvis=p.head.parent.parent.parent;
      const legs=pelvis.children.filter(o=>!o.isMesh&&Math.abs(Math.abs(o.position.x)-.095)<1e-3).map(hip=>{const knee=hip.children.find(c=>!c.isMesh),ankle=knee.children.find(c=>!c.isMesh);return{hip,knee,ankle,T:Math.abs(knee.position.y),S:Math.abs(ankle.position.y)};});
      p._legs={pelvis,legs};}
    const {pelvis,legs}=p._legs;if(legs.length!==2)return;
    const reach=.993-.02*Math.max(0,Math.min(1,weight));
    let raise=Infinity;const feet=legs.map(l=>{const a=l.hip.rotation.x,b=l.knee.rotation.x,y=-l.T*Math.cos(a)-l.S*Math.cos(a+b),z=-l.T*Math.sin(a)-l.S*Math.sin(a+b);
      const R=reach*(l.T+l.S);raise=Math.min(raise,Math.sqrt(Math.max(0,R*R-z*z))+y);return{y,z};});
    raise=Math.max(0,raise);if(raise<1e-5)return;
    pelvis.position.y+=raise;
    legs.forEach((l,i)=>{const fz=feet[i].z,fy=feet[i].y-raise,T=l.T,S=l.S,d=Math.min(T+S-1e-4,Math.max(.05,Math.hypot(fz,fy)));
      const phi=Math.atan2(fz,-fy),alpha=Math.acos(Math.min(1,(T*T+d*d-S*S)/(2*T*d))),beta=Math.acos(Math.min(1,(T*T+S*S-d*d)/(2*T*S)));
      l.hip.rotation.x=-(phi+alpha);l.knee.rotation.x=Math.PI-beta;l.ankle.rotation.x=-(l.hip.rotation.x+l.knee.rotation.x);});
  }

  // ---- Dress the shared worker rig as a shopper or a colleague: hair instead of a hard hat, no hi-vis bands,
  // the vest becomes a jumper (shopper) or an apron (colleague). Returns the pointing hand for props.
  function dress(p,{hair=0x3a2a1e,top=null,apron=null,cap=null}={}){
    const meshes=[];p.group.traverse(o=>{if(o.isMesh)meshes.push(o);});
    const head=p.head,[face,hat,brim]=head.children;void face;
    if(cap){hat.material.color.set(cap);brim.material.color.set(cap);brim.scale.set(.85,1,.85);}else{hat.material.color.set(hair);hat.material.roughness=.85;hat.scale.set(1,.9,1.06);hat.position.y=.13;brim.visible=false;}
    for(const o of meshes){const c=o.material?.color?.getHex?.();if(c===0xe8eef0&&o.geometry?.parameters?.height===.035)o.visible=false;}
    const vest=meshes.find(o=>o.material?.emissiveIntensity===.12&&o.geometry?.parameters?.height===.36);
    if(vest){vest.material.emissiveIntensity=0;vest.material.emissive?.set(0x000000);
      if(apron){vest.material.color.set(apron);vest.scale.set(1.02,1.35,1.03);vest.position.y=.22;}
      else if(top){vest.material.color.set(top);vest.scale.set(1.01,1.38,1.02);vest.position.y=.26;}}
    const hands=meshes.filter(o=>o.geometry?.parameters?.radius===.05);
    const hand=hands.find(h=>h.parent?.parent?.position.x<0)||hands[0];
    return{hand,torso:vest?.parent||null};
  }

  return{dispose(){instances.forEach(i=>i.dispose());instances.length=0;},M,storeStage,bananaBunch,fruit,crate,produceScale,basket,shoppingTrolley,stockTrolley,shelfBay,deliCounter,storeCamera,handheld,dress,stand};
}
