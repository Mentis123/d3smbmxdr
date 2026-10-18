import * as THREE from 'three';

// Shared lighting, turntable, environment and lifecycle for industry worlds.
export function createWorldShell(seed){
  const scene=new THREE.Scene();
  const envCanvas=document.createElement('canvas');envCanvas.width=1024;envCanvas.height=512;const ec=envCanvas.getContext('2d'),eg=ec.createLinearGradient(0,0,0,512);eg.addColorStop(0,'#405773');eg.addColorStop(.45,'#102c42');eg.addColorStop(.6,'#061322');eg.addColorStop(1,'#0a1018');ec.fillStyle=eg;ec.fillRect(0,0,1024,512);ec.fillStyle='#489dd8';for(const x of [60,260,640,890])ec.fillRect(x,160,8,150);ec.fillStyle='#bacbd5';ec.fillRect(340,40,290,30);const environment=new THREE.CanvasTexture(envCanvas);environment.mapping=THREE.EquirectangularReflectionMapping;environment.colorSpace=THREE.SRGBColorSpace;scene.environment=environment;scene.environmentIntensity=.58;
  const root=new THREE.Group();root.name='turntable';scene.add(root);
  const hemi=new THREE.HemisphereLight(0xa9c9ec,0x101b22,.55);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xe0eaff,3.5);key.position.set(-8,17,10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-14;key.shadow.camera.right=14;key.shadow.camera.top=14;key.shadow.camera.bottom=-14;key.shadow.normalBias=.025;key.shadow.bias=-.0002;scene.add(key,key.target);
  const rim=new THREE.DirectionalLight(0x268fff,2.2);rim.position.set(6,7,-10);scene.add(rim);
  const warm=new THREE.DirectionalLight(0xffc083,.65);warm.position.set(10,8,5);scene.add(warm);
  function rounded(w,d,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);return s;}
  const geo=new THREE.ExtrudeGeometry(rounded(22,18,2.1),{depth:.6,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.16,bevelThickness:.16,curveSegments:16});geo.rotateX(-Math.PI/2);geo.translate(0,-.8,-1);
  const plinth=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x142738,metalness:.7,roughness:.19}));plinth.name='plinth';plinth.receiveShadow=true;plinth.castShadow=true;root.add(plinth);
  const ringPoints=rounded(22.1,18.1,2.1).getPoints(140).map(p=>new THREE.Vector3(p.x,-.38,-p.y-1));
  const trim=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPoints),new THREE.LineBasicMaterial({color:0x176591}));root.add(trim);
  const updates=[];
  const world={scene,root,key,updates,extraTextures:[environment],stats:{seed,stage:'shell'},update(t,dt){updates.forEach(f=>f(t,dt));},dispose(){world.reflection?.dispose();const geos=new Set(),mats=new Set(),textures=new Set(world.extraTextures);scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));});geos.forEach(g=>g.dispose());mats.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v);});m.dispose();});textures.forEach(t=>t.dispose());}};
  return world;
}
