import * as THREE from 'three';
import {Reflector} from './vendor/addons/objects/Reflector.js';

// One bounded planar render for the reservoir. Three.js r180 Reflector supplies
// the reflected camera and oblique clipping; all water is hidden in this pass.
export function createReservoirReflection(world){
  const water=world.root.getObjectByName('reservoir'),uniforms=water.material.uniforms;
  const plane=new Reflector(new THREE.PlaneGeometry(1,1),{textureWidth:512,textureHeight:512,clipBias:.003,multisample:0});
  plane.rotation.x=-Math.PI/2;plane.position.y=1.72;plane.visible=false;plane.name='reservoir-reflection-plane';
  world.root.add(plane);
  const target=plane.getRenderTarget(),projection=new THREE.Matrix4(),inverse=new THREE.Matrix4();
  uniforms.uReflection.value=target.texture;
  const stats={enabled:false,renders:0,size:512,calls:0,triangles:0};
  return {stats,render(renderer,camera,enabled){
    stats.enabled=!!enabled;uniforms.uReflectionEnabled.value=0;if(!enabled)return;
    world.scene.updateMatrixWorld(true);camera.updateMatrixWorld();
    const normal=new THREE.Vector3(0,1,0),position=new THREE.Vector3().setFromMatrixPosition(plane.matrixWorld);
    if(camera.position.clone().sub(position).dot(normal)<=.02)return;
    const hidden=[];world.root.traverse(o=>{if(o.isMesh&&o.material?.uniforms?.uMode){hidden.push([o,o.visible]);o.visible=false;}});
    const current=renderer.getRenderTarget(),auto=renderer.shadowMap.autoUpdate,xr=renderer.xr.enabled;
    try{
      plane.onBeforeRender(renderer,world.scene,camera);stats.calls=renderer.info.render.calls;stats.triangles=renderer.info.render.triangles;
      projection.copy(plane.material.uniforms.textureMatrix.value).multiply(inverse.copy(plane.matrixWorld).invert());
      uniforms.uReflectionMatrix.value.copy(projection);uniforms.uReflectionEnabled.value=1;stats.renders++;
    }finally{
      hidden.forEach(([o,visible])=>{o.visible=visible;});plane.visible=false;
      renderer.setRenderTarget(current);renderer.shadowMap.autoUpdate=auto;renderer.xr.enabled=xr;
    }
  },dispose(){world.root.remove(plane);plane.geometry.dispose();plane.dispose();}};
}
