import * as THREE from 'three';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {TexturePass} from './vendor/addons/postprocessing/TexturePass.js';
import {UnrealBloomPass} from './vendor/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from './vendor/addons/postprocessing/ShaderPass.js';
// Preserve scene alpha while allowing bloom to extend into the fixed room layer.
export function createPipeline(renderer){
  const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:true});
  const composer=new EffectComposer(renderer);composer.addPass(new TexturePass(target.texture));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.45,.28,1.0);composer.addPass(bloom);
  const output=new ShaderPass({uniforms:{tDiffuse:{value:null},tBase:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform sampler2D tDiffuse;uniform sampler2D tBase;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv),b=texture2D(tBase,vUv);vec3 glow=max(c.rgb-b.rgb,vec3(0.));float a=clamp(b.a+max(max(glow.r,glow.g),glow.b)*.4,0.,1.);gl_FragColor=vec4(c.rgb,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`});
  // ShaderPass clones uniform definitions; render-target textures cannot be cloned.
  // Bind the live base texture afterwards so opaque scene coverage survives bloom.
  output.uniforms.tBase.value=target.texture;composer.addPass(output);
  const stats={calls:0,triangles:0,postprocessEnabled:false};
  return{stats,resize(w,h,dpr,enabled=true){if(!enabled){target.setSize(1,1);composer.setPixelRatio(1);composer.setSize(1,1);return;}target.setSize(Math.round(w*dpr),Math.round(h*dpr));composer.setPixelRatio(dpr);composer.setSize(w,h);},render(scene,camera,enabled){renderer.setRenderTarget(enabled?target:null);if(enabled)renderer.clear();renderer.render(scene,camera);stats.calls=renderer.info.render.calls;stats.triangles=renderer.info.render.triangles;stats.postprocessEnabled=enabled;if(enabled){renderer.setRenderTarget(null);composer.render();}},dispose(){target.dispose();composer.passes.forEach(p=>p.dispose?.());composer.dispose();}};
}
