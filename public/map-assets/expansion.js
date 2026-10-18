import * as THREE from 'three';
import {rearZ} from './hydro-profile.js';
import {makeBatch,metal} from './builder-utils.js';
import {LAYOUT} from './scene-layout.js';
import {createWaterMaterial} from './water.js';
import {createFlowMaterial} from './flow-effects.js';

export function buildExpansion(world){
  const {root,height}=world,batch=makeBatch(root,'site');
  const curb=metal(0x828c88,.9,.05),asphalt=metal(0x263139,.94,.05),steel=metal(0x7e929a),wall=metal(0x9a9e96,.86,0),roof=metal(0x394a52,.74,.2);
  const warm=new THREE.MeshStandardMaterial({color:0xffd394,emissive:0xffb865,emissiveIntensity:1.8}),cyan=new THREE.MeshBasicMaterial({color:0x08c3ff,toneMapped:false});
  // Small authored asphalt tile: stable noise, no network texture dependency.
  const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d'),img=ctx.createImageData(128,128);let seed=1961;
  for(let i=0;i<img.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=170+(seed>>>27);img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;}ctx.putImageData(img,0,0);const tile=new THREE.CanvasTexture(cv);tile.wrapS=tile.wrapT=THREE.RepeatWrapping;tile.repeat.set(6,6);asphalt.map=tile;world.extraTextures.push(tile);
  const roads=[];world.serviceRoadRoutes=[];
  // Ribbons retain analytic Y coordinates so elevated approaches really meet the deck.
  function ribbon(points,width,material,name){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2])),false,'centripetal'),p=[],uv=[],ix=[],segments=Math.max(40,points.length*16);
    for(let i=0;i<=segments;i++){const t=i/segments,c=curve.getPoint(t),v=curve.getTangent(t),n=new THREE.Vector3(-v.z,0,v.x).normalize().multiplyScalar(width/2);for(const sign of [-1,1]){const x=c.x+n.x*sign,z=c.z+n.z*sign;p.push(x,Math.max(c.y,height(x,z)+(name==='road-curb'?.025:.045)),z);uv.push((sign+1)/2,t*8);}}
    for(let i=0;i<segments;i++){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}
    if(name==='road-curb'){
      // Closed roadbed down to the real terrain avoids floating ribbons at the island edge.
      const topCount=p.length/3;for(let i=0;i<topCount;i++){const x=p[i*3],z=p[i*3+2];p.push(x,Math.min(p[i*3+1]-.035,height(x,z)-.025),z);uv.push(0,0);}
      for(let i=0;i<segments;i++){const a=i*2,b=a+1,c=a+2,d=a+3,A=a+topCount,B=b+topCount,C=c+topCount,D=d+topCount;ix.push(A,C,B,B,C,D,a,c,A,c,C,A,b,B,d,d,B,D);}
      ix.push(0,topCount,1,1,topCount,topCount+1);const a=topCount-2,b=topCount-1;ix.push(a,b,a+topCount,b,b+topCount,a+topCount);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.receiveShadow=true;root.add(mesh);return curve;
  }
  function road(points,width=.48){const pp=points.map(p=>[p[0],p.length===3?p[1]:1.81,rearZ(p.at(-1))]),cc=pp.map(([x,y,z])=>[x,y-.026,z]);ribbon(cc,width+.06,curb,'road-curb');const route=ribbon(pp,width,asphalt,'service-road');world.serviceRoadRoutes.push({curve:route,width});roads.push(pp);return pp;}
  road([[1.7,-1.1],[1.7,-2],[3.8,-2.25],[4.8,-2.2],[5.55,-1.5],[5.6,.9],[6.25,2.6],[6.8,4.8]]);
  road([[.3,.2],[.5,2.6],[1.05,3.4],[2.4,3.9],[3.5,4.8],[6.8,4.8],[8.8,4.8],[9.05,3.5],[9.10,-2.5],[9.05,-3.9]]);
  road([[1.7,-2],[.45,-2.8],[.45,-3.55],[1.25,-3.65],[3.7,-3.65],[4.05,1.90,-4.75],[4.55,2.14,-4.75]],.52);
  road([[9.05,2.14,-4.75],[9.10,1.90,-4.3],[9.05,-3.5]],.52);
  road([[6.05,2.15],[7.3,2.15],[7.3,1.25]],.42);
  for(const points of [[[2.1,3.8],[2.1,2.58]],[[5.6,-.65],[5.31,-.65]],[[6.6,3.15],[6.22,3.15]]])road(points,.3);
  // Low service buildings: explicit windows, doors and rooftop plant rather than plain blocks.
  const serviceBuildings=[[7.2,4.35,1.45,.86,.64],[.35,-2.35,1.3,.7,.48]];
  for(const [x,z,w,d,h]of serviceBuildings){
    batch.box(x,1.84,z,w+.16,.20,d+.14,curb);batch.box(x,1.94+h/2,z,w,h,d,wall);batch.box(x,1.96+h,z,w+.10,.09,d+.10,roof);
    for(let i=0;i<5;i++)batch.box(x-w*.37+i*w*.18,2.18,z+d/2+.008,w*.09,.19,.014,warm);
    batch.box(x+w*.28,2.12,z+d/2+.018,.18,.37,.025,roof);
    for(const off of [-.34,.2]){batch.box(x+off,2.02+h,z,.24,.12,.28,steel);for(let j=0;j<4;j++)batch.box(x+off-.08+j*.055,2.085+h,z,.018,.025,.22,roof);}
  }
  // Cyan routes are beside roads, with deliberate branches into each system.
  const networkRoutes=[
    [[.8,1.85,-3.6],[.8,1.85,-2.8],[1.45,1.85,-2.45],[4.4,1.85,-2.55],[5.3,1.85,-1.7],[5.31,1.85,-.65]],
    [[.15,1.86,.35],[.2,1.86,2.6],[.9,1.86,3.65],[2.45,1.86,4.15],[3.5,1.86,5.1],[7.2,1.86,5.1]],
    [[5.85,1.86,1.7],[6.1,1.86,2.35],[7.6,1.86,2.35],[7.6,1.86,1.25]],
    [[2.1,1.85,2.58],[2.1,1.85,3.6]],[[6.22,1.85,3.15],[6.7,1.85,3.15]]
  ];

  for(const [routeIndex,points] of networkRoutes.entries()){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],rearZ(p[2])))),flow=createFlowMaterial({phase:routeIndex*.19,speed:.75/curve.getLength()});world.updates.push(t=>{flow.uniforms.uTime.value=t;});const m=new THREE.Mesh(new THREE.TubeGeometry(curve,90,.015,5,false),flow);m.name='infrastructure-network';root.add(m);}
  // A level inlet under the bridge, with irregular banks designed into the terrain.
  const shape=new THREE.Shape();shape.moveTo(4.55,-6.25);shape.bezierCurveTo(5.5,-6.8,8.8,-6.65,9.15,-5.9);shape.lineTo(9.25,-4.15);shape.bezierCurveTo(8,-3.9,5.6,-3.9,4.55,-4.15);shape.closePath();
  const wg=new THREE.ShapeGeometry(shape,32);wg.rotateX(Math.PI/2);const a=wg.attributes.position;for(let i=0;i<a.count;i++){a.setY(i,1.38);a.setZ(i,rearZ(a.getZ(i)));}const wi=wg.index;for(let i=0;i<wi.count;i+=3){const b=wi.getX(i+1);wi.setX(i+1,wi.getX(i+2));wi.setX(i+2,b);}wg.computeVertexNormals();const wm=createWaterMaterial(0,world.scene.environment),inlet=new THREE.Mesh(wg,wm);inlet.name='bridge-inlet';root.add(inlet);world.updates.push(t=>{wm.uniforms.uTime.value=t;});
  // Complete perimeter: opaque fine edges + lightly tinted physical panels.
  const perimeter=[[-9.1,-5.5],[-9.3,-2.2],[-9.3,1.5],[-8.9,4.8],[-8.7,5.9],[1.2,6.45],[3.7,6.45],[8.6,5.8],[9.5,2.0],[9.5,-2.1],[8.8,-6.1],[3.7,-6.6],[-1,-6.6],[-6,-6.6]].map(([x,z])=>[x,rearZ(z)]);
  const panels=[],pi=[];
  for(let i=0;i<perimeter.length;i++){
    const aa=perimeter[i],bb=perimeter[(i+1)%perimeter.length];
    // Keep the gorge mouth open: the security line uses an elevated beam, not a river-blocking wall.
    if(i===4)continue;
    const distance=Math.hypot(bb[0]-aa[0],bb[1]-aa[1]),steps=Math.ceil(distance/.6),samples=[];
    for(let j=0;j<=steps;j++){
      const f=j/steps,x=THREE.MathUtils.lerp(aa[0],bb[0],f),z=THREE.MathUtils.lerp(aa[1],bb[1],f);
      samples.push([x,height(x,z)+.14,z]);
    }
    for(let j=0;j<steps;j++){
      const a=samples[j],b=samples[j+1];
      for(const dy of [0,.50])batch.beam([a[0],a[1]+dy,a[2]],[b[0],b[1]+dy,b[2]],.013,cyan,5);
      const base=panels.length/3;panels.push(a[0],a[1],a[2],b[0],b[1],b[2],a[0],a[1]+.5,a[2],b[0],b[1]+.5,b[2]);pi.push(base,base+1,base+2,base+1,base+3,base+2);
    }
    if(i>=5){
      const [x,z]=aa,y=height(x,z);batch.box(x,y+.175,z,.27,.35,.27,curb);batch.box(x,y+.68,z,.1,.66,.1,steel);
      for(const sx of [-1,1])for(const sz of [-1,1])batch.beam([x+sx*.065,y+.36,z+sz*.065],[x+sx*.065,y+1.03,z+sz*.065],.012,steel,6);
      batch.box(x,y+1.0,z,.15,.06,.15,roof);batch.box(x,y+1.08,z,.10,.10,.10,cyan);batch.box(x,y+1.17,z,.28,.06,.28,roof);
    }
    for(let j=1;j<steps;j++){const [x,y,z]=samples[j];batch.beam([x,y,z],[x,y+.50,z],.009,cyan,4);}
  }
  const panelGeo=new THREE.BufferGeometry();panelGeo.setAttribute('position',new THREE.Float32BufferAttribute(panels,3));panelGeo.setIndex(pi);panelGeo.computeVertexNormals();const glass=new THREE.MeshPhysicalMaterial({color:0x0aa6dd,roughness:.35,metalness:.05,transparent:true,opacity:.065,depthWrite:false,side:THREE.DoubleSide});const panel=new THREE.Mesh(panelGeo,glass);panel.name='security-glass';panel.renderOrder=3;root.add(panel);
  // Architectural glass is a two-sided thin sheet; closed concrete/metal parts stay FrontSide.
  const lampPositions=[[.8,3.7],[2.9,4.35],[5.8,4.8],[8.8,4.8],[5.25,1.8],[.65,-3.55],[4.35,-3.6],[9.35,-3.4]];
  for(const [x,sourceZ]of lampPositions){const z=rearZ(sourceZ);const y=height(x,z);batch.cylinder(x,y+.38,z,.018,.025,.76,steel,7);batch.box(x,y+.78,z,.13,.055,.10,warm);}
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
  const glowCtx=glowCanvas.getContext('2d'),glow=glowCtx.createRadialGradient(32,32,0,32,32,32);
  glow.addColorStop(0,'rgba(255,248,225,0.25)');glow.addColorStop(1,'rgba(255,248,225,0)');glowCtx.fillStyle=glow;glowCtx.fillRect(0,0,64,64);
  const glowTexture=new THREE.CanvasTexture(glowCanvas);world.extraTextures.push(glowTexture);
  const glowMat=new THREE.MeshBasicMaterial({color:0xffb86c,map:glowTexture,transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide});
  const lampPool=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),glowMat,lampPositions.length);lampPool.name='lamp-glow-pools';
  const lampDummy=new THREE.Object3D();lampPool.geometry.rotateX(-Math.PI/2);
  lampPositions.forEach(([x,sourceZ],i)=>{const z=rearZ(sourceZ);lampDummy.position.set(x,height(x,z)+.018,z);lampDummy.scale.set(.65,.65,1);lampDummy.updateMatrix();lampPool.setMatrixAt(i,lampDummy.matrix);});
  lampPool.instanceMatrix.needsUpdate=true;root.add(lampPool);
  const result=batch.finish();world.stats.site={roads:roads.length,networkRoutes:networkRoutes.length,perimeterSegments:perimeter.length,serviceBuildings:2,...result};
  world.siteDiagnostics=()=>({roads,serviceBuildings,networkRoutes,tankAnchors:LAYOUT.tanks,perimeter,bridgeWaterY:1.38});
  const warmAccent=new THREE.PointLight(0xffb86c,1.6,3.5);warmAccent.position.set(8.7,2.6,.9);warmAccent.name='yard-warm-accent';root.add(warmAccent);
}
