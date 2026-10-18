import * as THREE from 'three';
import {random} from './scene.js';
import {LAYOUT,onTownTerrace} from './scene-layout.js';
import {riverCenter,riverHalfWidth,riverEnd,reservoirOutline,terrainPoint,rearZ} from './hydro-profile.js';
import {createFirGeometry} from './foliage.js';
import {createWaterMaterial} from './water.js';
import {buildFlowEffects,createFlowMaterial} from './flow-effects.js';
import {buildActivity} from './activity.js';
import {makeBatch} from './builder-utils.js';
import {mergeVertices} from './vendor/addons/utils/BufferGeometryUtils.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';

// All paths and water effects are evaluated in miniature-local coordinates.
export function buildSlice(world){
  const {root,updates}=world,rng=random(1701),materials={};
  const textureLoader=new THREE.TextureLoader();
  let rockColor,rockNormal,firTexture;
  world.ready=Promise.all([
    new Promise((resolve,reject)=>{rockColor=textureLoader.load('/map-assets/textures/cliff-color-v1.jpg',resolve,undefined,reject);}),
    new Promise((resolve,reject)=>{rockNormal=textureLoader.load('/map-assets/textures/cliff-normal-v1.jpg',resolve,undefined,reject);}),
    new Promise((resolve,reject)=>{firTexture=textureLoader.load('/map-assets/textures/fir-bough-v1.webp',resolve,undefined,reject);})
  ]);
  for(const texture of [rockColor,rockNormal]){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;}rockColor.colorSpace=THREE.SRGBColorSpace;
  firTexture.colorSpace=THREE.SRGBColorSpace;firTexture.anisotropy=8;
  world.extraTextures.push(rockColor,rockNormal,firTexture);
  const noiseGLSL=`
    float hash3(vec3 p){p=fract(p*.3183099+vec3(.11,.23,.37));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){return noise3(p)*.55+noise3(p*2.11)*.27+noise3(p*4.23)*.13+noise3(p*9.17)*.05;}
  `;
  function mat(name,color,roughness=.8,metalness=0){return materials[name]=new THREE.MeshStandardMaterial({color,roughness,metalness});}
  const concrete=mat('concrete',0x737e81,.87),dark=mat('dark',0x152b33,.55,.4),rail=mat('rail',0xa2afb8,.4,.7),grass=mat('grass',0x243c28,.96),trunk=mat('trunk',0x514332,1),pine=mat('pine',0xb0c4b4,.93),rock=mat('rock',0x879294,.95),roof=mat('roof',0x314451,.7,.3);
  function varied(material,kind){material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLocalPosition;varying vec3 vLocalNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLocalPosition=position;vLocalNormal=normal;\n#ifdef USE_INSTANCING\nvLocalPosition=(instanceMatrix*vec4(position,1.)).xyz;vLocalNormal=normalize(mat3(instanceMatrix)*normal);\n#endif');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLocalPosition;varying vec3 vLocalNormal;uniform sampler2D uRockColor;uniform sampler2D uRockNormal;\n'+noiseGLSL);shader.uniforms.uRockColor={value:rockColor};shader.uniforms.uRockNormal={value:rockNormal};const rockCode=`float grain=fbm(vLocalPosition*11.);vec3 weights=pow(abs(normalize(vLocalNormal)),vec3(4.));weights/=weights.x+weights.y+weights.z;vec3 shale=texture2D(uRockColor,vLocalPosition.yz*1.3).rgb*weights.x+texture2D(uRockColor,vLocalPosition.xz*1.3).rgb*weights.y+texture2D(uRockColor,vLocalPosition.xy*1.3).rgb*weights.z;float strata=.88+.12*smoothstep(.22,.75,noise3(vec3(vLocalPosition.x*2.,vLocalPosition.y*14.+vLocalPosition.x*.6,vLocalPosition.z*2.)));shale*=strata;float moss=smoothstep(.20,.85,normalize(vLocalNormal).y)*smoothstep(.32,.69,fbm(vLocalPosition*1.5));diffuseColor.rgb*=mix(mix(vec3(.22),shale*2.5,.92),vec3(.13,.22,.09),moss*.48)*mix(.86,1.12,grain);`;
    const terrainCode=rockCode+'float meadow=smoothstep(.58,.94,abs(normalize(vLocalNormal).y));vec3 grassTint=mix(vec3(.40,.57,.24),vec3(.63,.69,.41),fbm(vLocalPosition*.8));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*grassTint*2.0,meadow*.65);';
    const concreteCode=`float grain=fbm(vLocalPosition*12.);float streak=noise3(vLocalPosition*vec3(17.,.38,6.));float joint=step(.985,fract(vLocalPosition.y*3.8));diffuseColor.rgb*=mix(.78,1.08,grain)*mix(.72,1.02,streak)*(1.-joint*.18);`;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+(kind==='rock'?rockCode:kind==='terrain'?terrainCode:concreteCode));if(kind==='rock')shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nfloat bump=dot(shale,vec3(.3333))*.075;vec3 q0=dFdx(-vViewPosition),q1=dFdy(-vViewPosition),r0=cross(q1,normal),r1=cross(normal,q0);float det=dot(q0,r0);normal=normalize(abs(det)*normal-sign(det)*(dFdx(bump)*r0+dFdy(bump)*r1));');};material.customProgramCacheKey=()=>kind;}
  varied(rock,'rock');varied(concrete,'concrete');
  const glow=new THREE.MeshBasicMaterial({color:new THREE.Color(0x04baff).multiplyScalar(2.8),toneMapped:false});const amber=new THREE.MeshBasicMaterial({color:0xffb65c,toneMapped:false});
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  function box(name,x,y,z,w,h,d,material=concrete){const m=new THREE.Mesh(boxGeo,material);m.name=name;m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
  function repairReflection(g){const ids=[];for(let i=0;i<g.attributes.position.count;i+=3)ids.push(i,i+2,i+1);g.setIndex(ids);g.computeVertexNormals();}
  function tube(points,radius,material,segments=60){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,5,false),material);root.add(mesh);return{curve,mesh};}
  function edge(x,z){return Math.pow(Math.abs(x/10.1),6)+Math.pow(Math.abs((z+.7)/8.45),6);}
  function terrainNoise(x,z){const ix=Math.floor(x),iz=Math.floor(z),a=x-ix,b=z-iz,u=a*a*(3-2*a),v=b*b*(3-2*b);const h=(i,j)=>{const k=Math.sin(i*127.1+j*311.7)*43758.5453;return k-Math.floor(k);};return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(ix,iz),h(ix+1,iz),u),THREE.MathUtils.lerp(h(ix,iz+1),h(ix+1,iz+1),u),v);}
  function height(x,z){
    const n=(terrainNoise(x*1.7,z*1.7)-.5)*.19+(terrainNoise(x*5.3,z*5.3)-.5)*.065;
    let h=1.8+n;
    if(z<-.7&&x<-.6&&x>-8.5)h=1.15+n*.3;
    if(z>-.55){const d=Math.abs(x-riverCenter(z));const half=riverHalfWidth(z)-.07;h=THREE.MathUtils.lerp(.01,1.8,THREE.MathUtils.smoothstep(d,half,half+.95))+n*(d>half?.9:.06);}
    const ridgeZ=-7.65+.26*Math.sin(x*1.27)+.12*Math.sin(x*3.1);const peaks=[[-5.45,1.9,1.8],[-3.9,3.5,1.9],[-2.65,2.7,1.3],[-1.65,1.75,1.1]];let mountain=0;for(const [px,ph,pw] of peaks){const along=Math.abs((x-px)/pw),across=Math.abs((z-ridgeZ)/1.55);const cone=Math.max(0,1-Math.sqrt(along*along+across*across));mountain=Math.max(mountain,ph*Math.pow(cone,.86));}mountain*=.93+.14*terrainNoise(x*3.4+z*.7,z*2.7);h+=mountain;
    // Lower the submerged shelf; reserve the high ridge for the far shore.
    if(x<-.85&&x>-8.7&&z<-.85&&z>-7.1){
      const open=THREE.MathUtils.smoothstep(-z,.85,1.25)*(1-THREE.MathUtils.smoothstep(-z,6.3,7.1));
      h=THREE.MathUtils.lerp(h,1.10+n*.2,open);
    }
    h+=.7*Math.exp(-((x+9.0)**2/1.1+(z+1.2)**2/8));
    h+=.9*Math.exp(-((x+.4)**2/1.5+(z+3.7)**2/3));
    if(x>-.6&&z<-5.4){const campus=THREE.MathUtils.smoothstep(x,-.6,.35)*(1-THREE.MathUtils.smoothstep(x,4.9,5.2));h=THREE.MathUtils.lerp(h,1.78+n*.2,campus);}
    // Rear-right inlet exposes water under the bridge rather than an asphalt bridge on dry land.
    if(x>4.2&&z<-5.5){const mask=THREE.MathUtils.smoothstep(x,4.2,4.85)*(1-THREE.MathUtils.smoothstep(x,8.85,9.6))*(1-THREE.MathUtils.smoothstep(z,-6.25,-5.5));h=THREE.MathUtils.lerp(h,.92,mask);}
    for(const tank of LAYOUT.tanks){const d=Math.hypot(x-tank.x,z-tank.z);const blend=1-THREE.MathUtils.smoothstep(d,tank.r+.15,tank.r+.4);h=THREE.MathUtils.lerp(h,1.78,blend);}
    if(z>4.9&&x>-.8)h=THREE.MathUtils.lerp(h,.16,THREE.MathUtils.smoothstep(z,5.1+.17*Math.sin(x*1.2),7.45));
    const rim=1-THREE.MathUtils.smoothstep(edge(x,z),.64,1.02);return Math.max(-.16,h*rim-.08);
  }
  world.height=height;world.terrainDiagnostics=()=>({ridgeSamples:Array.from({length:25},(_,i)=>{const x=-6.5+i*.22,z=-7.65+.26*Math.sin(x*1.27)+.12*Math.sin(x*3.1);return[x,height(x,z),z];}),skirtLayers:10});
  // A dense, shaped height surface plus a closed skirt at its outer boundary.
  const nx=180,nz=150,positions=[],colors=[],indices=[],color=new THREE.Color();
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const [x,z]=terrainPoint((i/nx-.5)*20,-9+j/nz*16.6),y=height(x,z);positions.push(x,y,z);const nearRiver=z>-.5&&Math.abs(x-riverCenter(z))<3.7;const slope=Math.abs(height(x+.07,z)-height(x-.07,z))+Math.abs(height(x,z+.07)-height(x,z-.07));color.set(y>2.6&&terrainNoise(x*.75,z*.75)>.34?0x30452c:slope>.18?0x626e68:0x30472d);color.multiplyScalar(.94+rng()*.12);colors.push(color.r,color.g,color.b);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  const terrainMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});varied(terrainMat,'terrain');const terrain=new THREE.Mesh(geo,terrainMat);terrain.name='terrain';terrain.castShadow=true;terrain.receiveShadow=true;root.add(terrain);
  const boundary=[];for(let i=0;i<=nx;i++)boundary.push([i/nx*20-10,-9]);for(let j=1;j<=nz;j++)boundary.push([10,j/nz*16.6-9]);for(let i=nx-1;i>=0;i--)boundary.push([i/nx*20-10,7.6]);for(let j=nz-1;j>0;j--)boundary.push([-10,j/nz*16.6-9]);
  const skirtPos=[],skirtIdx=[],skirtLayers=10;
  boundary.forEach(([bx,bz],i)=>{const [x,z]=terrainPoint(bx,bz),top=height(x,z),len=Math.hypot(x,z+1),outX=x/len,outZ=(z+1)/len;
    for(let layer=0;layer<=skirtLayers;layer++){const t=layer/skirtLayers,ledge=Math.sin(t*Math.PI)*(.055+.12*terrainNoise(i*.17,layer*.8))*(.55+.45*Math.cos(layer*2.1+i*.04));skirtPos.push(x+outX*ledge,THREE.MathUtils.lerp(top,-.18,t),z+outZ*ledge);}
  });
  for(let i=0;i<boundary.length;i++)for(let layer=0;layer<skirtLayers;layer++){const a=i*(skirtLayers+1)+layer,b=((i+1)%boundary.length)*(skirtLayers+1)+layer;skirtIdx.push(a,a+1,b,a+1,b+1,b);}
  const skirtG=new THREE.BufferGeometry();skirtG.setAttribute('position',new THREE.Float32BufferAttribute(skirtPos,3));skirtG.setIndex(skirtIdx);skirtG.computeVertexNormals();const skirt=new THREE.Mesh(skirtG,rock);skirt.name='terrain-boundary';skirt.castShadow=skirt.receiveShadow=true;root.add(skirt);
  // Individual rough rocks break the regular terrain edge and form the gorge.
  let rockG=new THREE.IcosahedronGeometry(1,2);const rp=rockG.attributes.position;for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i);const k=1+.15*Math.sin(x*9+z*3)*Math.sin(y*8+1);rp.setXYZ(i,x*k,y*k,z*k);}rockG.deleteAttribute('normal');rockG.deleteAttribute('uv');rockG=mergeVertices(rockG,1e-4);rockG.computeVertexNormals();
  const rockInstances=new THREE.InstancedMesh(rockG,rock,680),dummy=new THREE.Object3D();let rockCount=0;
  for(let i=0;i<680;i++){let x,z,s;if(i<380){z=rng()*7;const side=i%2?1:-1;x=riverCenter(z)+side*(riverHalfWidth(z)+.12+rng()*.65);s=.07+rng()*.13;}else if(i<570){const a=rng()*Math.PI*2;x=Math.cos(a)*(9.3+rng()*.5);z=Math.sin(a)*(6.5+rng()*.35);s=.12+rng()*.22;}else{x=-7.7+rng()*6.5;z=-8.5+rng()*2;s=.10+rng()*.22;}const y=height(x,z);dummy.position.set(x,y+(i>=570?-s*.25:.03),z);dummy.rotation.set(i>=570?.15+rng()*.3:rng()*3,i>=570?.25+rng()*.6:rng()*6,i>=570?-.35+rng()*.15:rng()*3);dummy.scale.set(s*(i>=570?.85+rng()*.65:.8+rng()),s*(i>=570?.6:.7),s*(.7+rng()));dummy.updateMatrix();rockInstances.setMatrixAt(rockCount++,dummy.matrix);rockInstances.setColorAt(i,new THREE.Color().setHSL(.55,.04,.58+rng()*.15));}rockInstances.count=rockCount;rockInstances.castShadow=true;rockInstances.receiveShadow=true;rockInstances.name='gorge-rocks';root.add(rockInstances);
 const islets=new THREE.InstancedMesh(rockG,rock,3);islets.name='river-rock-islets';for(let i=0;i<3;i++){const z=4.6+i*.7,x=-5+i*.66+riverCenter(z)+5.6-.42*Math.sin(z*.72);dummy.position.set(x,-.01,z);dummy.rotation.set(.1,i*1.7,.13);dummy.scale.set(.16+i*.035,.23,.30);dummy.updateMatrix();islets.setMatrixAt(i,dummy.matrix);}islets.castShadow=islets.receiveShadow=true;root.add(islets);
  // Water shader: local-space directional waves and foam, no simulation server.
  const waterM=createWaterMaterial(0,world.scene.environment),fallM=createWaterMaterial(1,world.scene.environment),riverM=createWaterMaterial(2,world.scene.environment);updates.push(t=>{waterM.uniforms.uTime.value=t;fallM.uniforms.uTime.value=t;riverM.uniforms.uTime.value=t;});
  // Reservoir footprint ends upstream of the dam, framed by the mountain and banks.
  const reservoirShape=new THREE.Shape();reservoirOutline.forEach(([x,z],i)=>i?reservoirShape.lineTo(x,z):reservoirShape.moveTo(x,z));reservoirShape.closePath();const resGeo=new THREE.ShapeGeometry(reservoirShape,40);resGeo.rotateX(Math.PI/2); // Shape XY's y becomes positive Z.
  const resPos=resGeo.attributes.position;for(let i=0;i<resPos.count;i++)resPos.setY(i,1.72);const resIndex=resGeo.index;for(let i=0;i<resIndex.count;i+=3){const b=resIndex.getX(i+1);resIndex.setX(i+1,resIndex.getX(i+2));resIndex.setX(i+2,b);}resGeo.computeVertexNormals();const reservoir=new THREE.Mesh(resGeo,waterM);reservoir.name='reservoir';root.add(reservoir);
  const riverPos=[],riverUv=[],riverIdx=[],rn=110,rw=30;
  for(let j=0;j<=rn;j++)for(let i=0;i<=rw;i++){const u=i/rw,v=j/rn,z=.45+v*(riverEnd(u)-.45),width=riverHalfWidth(z),x=riverCenter(z)+(u-.5)*width*2;riverPos.push(x,.11,z);riverUv.push(u,v);}
  for(let j=0;j<rn;j++)for(let i=0;i<rw;i++){let a=j*(rw+1)+i,b=a+1,c=a+rw+1;riverIdx.push(a,c,b,b,c,c+1);}
  const riverG=new THREE.BufferGeometry();riverG.setAttribute('position',new THREE.Float32BufferAttribute(riverPos,3));riverG.setAttribute('uv',new THREE.Float32BufferAttribute(riverUv,2));riverG.setIndex(riverIdx);riverG.computeVertexNormals();const river=new THREE.Mesh(riverG,riverM);river.name='river-surface';root.add(river);
  // An irregular, finite-depth cutaway closes the outlet instead of exposing a sheet.
  const lipPos=[],lipIdx=[];
  for(let i=0;i<=rw;i++){const k=(rn*(rw+1)+i)*3;lipPos.push(riverPos[k],.11,riverPos[k+2],riverPos[k],-.18,riverPos[k+2]);if(i<rw){const a=i*2;lipIdx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const lipG=new THREE.BufferGeometry();lipG.setAttribute('position',new THREE.Float32BufferAttribute(lipPos,3));lipG.setIndex(lipIdx);lipG.computeVertexNormals();
  const lip=new THREE.Mesh(lipG,new THREE.MeshStandardMaterial({color:0x031e31,metalness:.35,roughness:.22}));lip.name='river-outlet-cutaway';root.add(lip);
  const surfaceKey=i=>[geo.attributes.position.getX(i),geo.attributes.position.getY(i),geo.attributes.position.getZ(i)].map(n=>Math.round(n*1e4)).join();const surfaceKeys=new Set(Array.from({length:geo.attributes.position.count},(_,i)=>surfaceKey(i)));
  world.hydroDiagnostics=()=>({boundaryMismatches:Array.from({length:boundary.length},(_,i)=>i*(skirtLayers+1)).filter(i=>!surfaceKeys.has([skirtG.attributes.position.getX(i),skirtG.attributes.position.getY(i),skirtG.attributes.position.getZ(i)].map(n=>Math.round(n*1e4)).join())).length,reservoirOutline,waterLevel:1.72,openLakeSamples:[[-7,-2],[-5,-3],[-3,-3],[-6,-4]].map(([x,z])=>({x,z,bed:height(x,z),depth:1.72-height(x,z)})),outlet:Array.from({length:rw+1},(_,i)=>{const k=(rn*(rw+1)+i)*3;return riverPos.slice(k,k+3);}),channelClearance:Array.from({length:20},(_,i)=>{const z=.5+i/19*6;return .11-height(riverCenter(z),z);})});
  // Five reference-visible spillway bays, six solid piers, ogee-shaped falling water surfaces.
  const damLeft=-8.1,damRight=-.55,damZ=-.48,damH=2.45,bays=5,spillRight=-3.05,spacing=(spillRight-damLeft)/bays;
  // Fill the dam with sloping concrete bay slabs; water sits just above each slope.
  const profile=[[damZ-.34,1.65],[damZ-.03,1.7],[damZ+.17,1.5],[damZ+.35,1.05],[damZ+.57,.48],[damZ+.85,.17],[damZ+1.12,.12]];
  const fallPos=[],fallUv=[],fallIdx=[];let fallBase=0;
  for(let b=0;b<bays;b++){
    const left=damLeft+b*spacing+.2,right=damLeft+(b+1)*spacing-.2;
    const wallShape=new THREE.Shape();wallShape.moveTo(damZ-.38,-.05);wallShape.lineTo(damZ+1.04,-.05);profile.slice().reverse().forEach(([z,y])=>wallShape.lineTo(z,y-.035));wallShape.closePath();
    const g=new THREE.ExtrudeGeometry(wallShape,{depth:right-left,bevelEnabled:false,steps:1,curveSegments:8}); // local x=z, y=y, extrusion z=x
    const a=g.attributes.position;for(let k=0;k<a.count;k++){const z=a.getX(k),y=a.getY(k),x=a.getZ(k)+left;a.setXYZ(k,x,y,z);}repairReflection(g);const slab=new THREE.Mesh(g,concrete);slab.castShadow=true;slab.receiveShadow=true;root.add(slab);
    const path=new THREE.CatmullRomCurve3(profile.map(([z,y])=>new THREE.Vector3(0,y+.02,z)));
    const sy=42,sx=12;
    for(let j=0;j<=sy;j++){const p=path.getPoint(j/sy);for(let i=0;i<=sx;i++){fallPos.push(THREE.MathUtils.lerp(left+.025,right-.025,i/sx),p.y,p.z+.007*Math.sin(i*4));fallUv.push(i/sx,1-j/sy);}}
    for(let j=0;j<sy;j++)for(let i=0;i<sx;i++){const a=fallBase+j*(sx+1)+i,c=a+sx+1;fallIdx.push(a,c,a+1,a+1,c,c+1);}fallBase+=(sx+1)*(sy+1);
    box('spillway-gate', (left+right)/2,1.88,damZ-.29,right-left,.38,.12,dark);
    for(const x of [left+.03,right-.03])box('gate-guide',x,1.88,damZ-.20,.032,.4,.04,rail);
    box('gate-crossbeam',(left+right)/2,2.13,damZ-.22,right-left,.055,.12,concrete);
  }
  const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fallPos,3));fg.setAttribute('uv',new THREE.Float32BufferAttribute(fallUv,2));fg.setIndex(fallIdx);fg.computeVertexNormals();const falls=new THREE.Mesh(fg,fallM);falls.name='spillway-water';root.add(falls);
  for(let p=0;p<=bays;p++){
    const x=damLeft+p*spacing;const shape=new THREE.Shape();shape.moveTo(damZ-.47,-.05);shape.lineTo(damZ+1.13,-.05);shape.lineTo(damZ+.87,.35);shape.lineTo(damZ+.28,damH-.18);shape.lineTo(damZ-.47,damH-.18);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:1});const a=g.attributes.position;for(let i=0;i<a.count;i++){const z=a.getX(i),y=a.getY(i),xx=a.getZ(i)+x-.225;a.setXYZ(i,xx,y,z);}repairReflection(g);const pier=new THREE.Mesh(g,concrete);pier.name='dam-pier';pier.castShadow=true;pier.receiveShadow=true;root.add(pier);
  }
  for(const [x,w]of [[damLeft-.55,1.1],[(spillRight+damRight)/2,damRight-spillRight]]){
    const shape=new THREE.Shape();shape.moveTo(damZ-.65,-.08);shape.lineTo(damZ+1.3,-.08);shape.lineTo(damZ+.99,.4);shape.lineTo(damZ+.12,damH+.02);shape.lineTo(damZ-.65,damH+.02);shape.closePath();
    const g=new THREE.ExtrudeGeometry(shape,{depth:w,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2});const p=g.attributes.position;for(let i=0;i<p.count;i++){const z=p.getX(i),y=p.getY(i),xx=p.getZ(i)+x-w/2;p.setXYZ(i,xx,y,z);}repairReflection(g);const mass=new THREE.Mesh(g,concrete);mass.name='dam-abutment';mass.castShadow=true;mass.receiveShadow=true;root.add(mass);
  }
  box('dam-crest',(damLeft+damRight)/2,damH,damZ-.24,damRight-damLeft+.6,.19,.76,concrete);
  box('crest-road',(damLeft+damRight)/2,damH+.101,damZ-.24,damRight-damLeft+.2,.012,.43,roof);
  box('crest-light',(damLeft+damRight)/2,damH-.1,damZ+.16,damRight-damLeft,.035,.04,amber);
  for(const z of [damZ-.57,damZ+.06]){tube([[damLeft-.25,damH+.20,z],[damRight+.25,damH+.20,z]],.018,rail,1);for(let i=0;i<=26;i++)box('rail-post',THREE.MathUtils.lerp(damLeft-.25,damRight+.25,i/26),damH+.11,z,.018,.18,.018,rail);}
  box('upstream-dam-body',(damLeft+damRight)/2,.8,damZ-.46,damRight-damLeft,1.68,.24,concrete);
  const damDetail=makeBatch(root,'dam-detail');
  for(let p=0;p<=bays;p++){const x=damLeft+p*spacing;damDetail.box(x,2.21,damZ+.17,.29,.055,.10,rail);damDetail.box(x,2.59,damZ+.02,.25,.12,.18,dark);damDetail.box(x,2.65,damZ+.02,.28,.025,.21,rail);}
  for(let i=0;i<8;i++)damDetail.box(damLeft+.25+i*.92,1.35,damZ+.42,.014,1.32,.018,dark);
  damDetail.finish();
  // Small powerhouse and warm glazed windows establish miniature scale.
  const bx=.65,bz=-.8,by=height(bx,bz);box('powerhouse',bx,by+.53,bz,1.85,1.06,1.17,concrete);box('powerhouse-roof',bx,by+1.09,bz,2.02,.14,1.29,roof);
  for(let i=0;i<7;i++){box('powerhouse-window',bx-.75+i*.25,by+.66,bz+.595,.16,.38,.012,amber);box('window-mullion',bx-.75+i*.25,by+.66,bz+.609,.012,.38,.015,dark);}
  box('door',bx+.7,by+.28,bz+.599,.22,.55,.025,dark);for(let i=0;i<3;i++)box('roof-vent',bx-.55+i*.45,by+1.22,bz,.24,.15,.38,rail);
  const warmLight=new THREE.PointLight(0xffcb86,5,4,2);warmLight.position.set(.4,by+1.3,.2);root.add(warmLight);
  for(const x of [-7.2,-5.5,-3.8]){const spillLight=new THREE.PointLight(0x65baff,3.2,4,2);spillLight.position.set(x,.8,.55);root.add(spillLight);}
  // Dense conifers: shared geometry, stable transforms and colour variation.
  const fir=createFirGeometry(firTexture),treeGeo=fir.core,foliage=fir.coreMaterial;
  const treeMesh=new THREE.InstancedMesh(treeGeo,foliage,420),trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.018,.035,1.2,5),trunk,420);let tc=0;const planted=[];
  for(let attempt=0;attempt<14000&&tc<420;attempt++){
    const x=-9.4+rng()*18.8,z=-8.7+rng()*15.4,y=height(x,z);
    const slope=Math.abs(height(x+.1,z)-height(x-.1,z))+Math.abs(height(x,z+.1)-height(x,z-.1));
    const bank=Math.abs(x-riverCenter(z));
    if(y<1.65||slope>(y>2.7?1.65:.65)||edge(x,z)>.88||(z>.5&&bank<riverHalfWidth(z)+.45)||((x>-.7&&x<1.8)&&z>-1.7&&z<.2)||Math.abs(z-damZ)<.8&&x>-8.7&&x<.3)continue;
    if(planted.some(p=>(p[0]-x)**2+(p[1]-z)**2<(y>2.7?.05:.18)))continue;
    if(LAYOUT.tanks.some(t=>Math.hypot(x-t.x,z-t.z)<t.r+.52)||(x>5.2&&x<9.6&&z>-3.4&&z<5.2)||(x>-.25&&x<5.0&&z<-5.5)||(x>-.5&&x<5.3&&z>-3.5&&z<-1.65)||(x>-.2&&x<1.2&&z>0)||(z>3.45&&x>1))continue;
    planted.push([x,z]);const s=y>2.7?.23+rng()*.31:.28+rng()*.58,shape=tc%3,sy=s*(shape===0?1.45:shape===1?.95:1.15),sx=s*(shape===0?.70:shape===1?1.1:.88);dummy.position.set(x,y,z);dummy.rotation.set(0,rng()*6.28,0);dummy.scale.set(sx,sy,sx*(.9+rng()*.2));dummy.updateMatrix();treeMesh.setMatrixAt(tc,dummy.matrix);treeMesh.setColorAt(tc,new THREE.Color().setHSL(.29+rng()*.05,.16+rng()*.12,.65+rng()*.16));dummy.position.y=y+.55*sy;dummy.scale.set(s*.65,sy,s*.65);dummy.updateMatrix();trunks.setMatrixAt(tc,dummy.matrix);tc++;
  }
  // Trees that landed on the town terrace would pierce the paving. Collapse them in place rather than
  // rejecting them in the loop above, so the RNG sequence (and the rest of the forest) is unchanged.
  {const zero=new THREE.Matrix4().makeScale(0,0,0);let cleared=0;planted.forEach(([px,pz],i)=>{if(onTownTerrace(px,pz,.12)){treeMesh.setMatrixAt(i,zero);trunks.setMatrixAt(i,zero);cleared++;}});world.stats.treesClearedForTown=cleared;}
  treeMesh.count=trunks.count=tc;treeMesh.name='conifer-closed-cores';treeMesh.castShadow=true;treeMesh.receiveShadow=true;
  const needles=new THREE.InstancedMesh(fir.needles,fir.needleMaterial,tc);needles.name='fir-needle-boughs';needles.instanceMatrix=treeMesh.instanceMatrix;needles.instanceColor=treeMesh.instanceColor;needles.castShadow=true;needles.receiveShadow=true;root.add(treeMesh,trunks,needles);
  // Cyan network route and perimeter segment, both attached to the miniature.
  const perimeter=[[-9.1,-5.5],[-9.3,-2.2],[-9.3,1.5],[-8.9,4.8],[-8.7,5.9]].map(([x,z])=>[x,rearZ(z)]).map(([x,z])=>[x,height(x,z)+.335,z]);
  tube(perimeter,.018,glow,90);
  for(const [x,y,z]of perimeter){box('beacon-base',x,y-.16,z,.32,.35,.32,concrete);box('beacon-column',x,y+.36,z,.13,.9,.13,rail);box('beacon-lantern',x,y+.86,z,.22,.2,.22,glow);box('beacon-cap',x,y+1.01,z,.3,.065,.3,roof);}
  // Impact mist, softly feathered and deliberately bounded below spillways.
  const cv=document.createElement('canvas');cv.width=cv.height=64;const ctx=cv.getContext('2d'),grad=ctx.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(194,231,250,.42)');grad.addColorStop(.35,'rgba(149,202,234,.25)');grad.addColorStop(1,'rgba(149,202,234,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);const mistMap=new THREE.CanvasTexture(cv),mistMat=new THREE.SpriteMaterial({map:mistMap,transparent:true,opacity:.45,depthWrite:false,color:0xb3ddf3});const mist=[];
  for(let i=0;i<42;i++){const s=new THREE.Sprite(mistMat);s.name='impact-mist';const x=damLeft+.4+rng()*(spillRight-damLeft-.8),z=.35+rng()*.9,k=.55+rng()*.9;s.position.set(x,.2+rng()*.3,z);s.scale.set(k*1.5,k,1);root.add(s);mist.push({s,x,z,k,phase:rng()*6.28});}
  updates.push(t=>mist.forEach(({s,x,z,k,phase})=>{s.position.set(x+Math.sin(t*.4+phase)*.09,.25+Math.sin(t*.6+phase)*.08,z+Math.cos(t*.3+phase)*.12);s.scale.set(k*(1.3+.15*Math.sin(t+phase)),k,1);}));
  world.stats={...world.stats,stage:'hydro-slice',spillwayBays:bays,piers:bays+1,trees:tc,rocks:rockCount+3,terrainVertices:geo.attributes.position.count,scope:'G2 hydro slice; east infrastructure not built'};
  world.stats.foliage={representation:'closed cores plus dense generated needle bough surfaces',treeCount:tc,boughsPerTree:fir.boughs,needleTrianglesPerTree:fir.triangles};
  buildFlowEffects(world);buildActivity(world);
  const readyTextures=world.ready;
  world.ready=Promise.all([readyTextures,new GLTFLoader().loadAsync('/map-assets/models/rock-face/cliff-solid-v2.glb').then(gltf=>{
    const parts=[];gltf.scene.traverse(o=>{if(o.isMesh)parts.push(o);});const count=10;
    for(const source of parts){const cliffs=new THREE.InstancedMesh(source.geometry,source.material,count);cliffs.name='scanned-cliff-patches';cliffs.castShadow=true;cliffs.receiveShadow=true;source.material.envMapIntensity=.4;source.material.color?.multiplyScalar(.75);let i=0;
      for(const side of [-1,1])for(let j=0;j<5;j++){const z=.4+j*1.22+.16*Math.sin(j*2.1+side),x=riverCenter(z)+side*(riverHalfWidth(z)+.10),turn=Math.atan2(riverCenter(z+.1)-riverCenter(z-.1),.2);dummy.position.set(x,-.22,z);dummy.rotation.set(.04*Math.sin(j),(side<0?Math.PI/2:-Math.PI/2)+turn+.12*Math.sin(j*2.8+side),.05*Math.cos(j));dummy.scale.set(.32+.05*Math.sin(j*1.7),.43+.07*Math.cos(j*2),.35+.06*Math.sin(j*2.4));dummy.updateMatrix();cliffs.setMatrixAt(i++,dummy.matrix);}root.add(cliffs);
    }world.stats.scannedCliffPatches=count;world.stats.cliffMaterialParts=parts.length;world.stats.rocks=rockCount+3;
  })]);
  return {height,materials,terrain,falls,reservoir};
}
