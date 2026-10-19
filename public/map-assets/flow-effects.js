import * as THREE from 'three';
import {random} from './scene.js';

export function buildFlowEffects(world){
  const rng=random(7219),count=900,positions=[],seeds=[];
  for(let i=0;i<count;i++){positions.push(-7.84+(i%5)*1.01+rng()*.44,0,0);seeds.push(rng(),rng(),rng());}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,3));
  const material=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uPixelScale:{value:650}},transparent:true,depthWrite:false,vertexShader:`
    uniform float uTime;uniform float uPixelScale;attribute vec3 aSeed;varying float vAlpha;varying float vSpray;
    void main(){float phase=fract(aSeed.x+uTime*(.44+aSeed.z*.25));vec3 p=position;vSpray=step(.58,aSeed.y);
      if(vSpray<.5){p.y=1.73-1.58*phase*phase;p.z=-.67+1.36*phase;p.x+=sin(phase*6.+aSeed.y*19.)*.015;vAlpha=sin(phase*3.14159)*.32;}
      else{p.y=.18+sin(phase*3.14159)*(.12+aSeed.z*.40);p.z=.39+phase*(.28+aSeed.z*.6);p.x+=(aSeed.y-.8)*phase*.7;vAlpha=sin(phase*3.14159)*.25;}
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(uPixelScale*(.008+aSeed.z*.008)/-mv.z,1.,5.);}
  `,fragmentShader:`varying float vAlpha;varying float vSpray;void main(){vec2 q=gl_PointCoord-.5;q.x*=1.8-vSpray*.8;float a=exp(-dot(q,q)*18.)*vAlpha;gl_FragColor=vec4(.40,.67,.82,a);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
  const drops=new THREE.Points(geometry,material);drops.name='spillway-droplets-and-spray';drops.frustumCulled=false;world.root.add(drops);world.updates.push(t=>{material.uniforms.uTime.value=t;});
  world.stats.sprayParticles=count;
}

// base/glow/repeat default to the original cyan single pulse, so existing callers render exactly as before.
export function createFlowMaterial({phase=0,speed=.075,base=[.006,.17,.28],glow=[.12,1.8,2.5],repeat=1}={}){return new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uPhase:{value:phase},uSpeed:{value:speed},uBase:{value:new THREE.Vector3(...base)},uGlow:{value:new THREE.Vector3(...glow)},uRepeat:{value:repeat}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float uTime,uPhase,uSpeed,uRepeat;uniform vec3 uBase,uGlow;varying vec2 vUv;void main(){float run=fract(vUv.x*uRepeat-uTime*uSpeed+uPhase);float head=exp(-pow((run-.08)*65.,2.));float tail=exp(-max(0.,run-.08)*20.)*step(.08,run);float pulse=head+tail*.45;vec3 c=uBase+uGlow*pulse;gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});}
