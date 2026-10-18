import * as THREE from 'three';
import {hydroGLSL} from './hydro-profile.js';
// Absolute time, miniature-local flow, room-fixed reflections. No fluid simulation.
const field=`
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(.8,-.6,.6,.8);for(int i=0;i<4;i++){v+=noise(p)*a;p=m*p*2.03+7.1;a*=.5;}return v;}
vec3 waveGradient(vec2 p,float t,float energy){vec2 a=vec2(.37,1.)*12.,b=vec2(-.81,.49)*27.,c=vec2(.17,-.6)*57.;vec2 g=(a*cos(dot(p,a)-t*.72)*.009+b*cos(dot(p,b)+t*.53)*.003+c*cos(dot(p,c)-t*1.18)*.0012)*energy;return normalize(vec3(-g.x,1.,-g.y));}
`;
export function createWaterMaterial(mode,environment){return new THREE.ShaderMaterial({name:['reservoir-surface','falling-water','river-turbulence','treatment-basin-water'][mode],uniforms:{uTime:{value:0},uMode:{value:mode},uEnvironment:{value:environment},uReflection:{value:environment},uReflectionMatrix:{value:new THREE.Matrix4()},uReflectionEnabled:{value:0}},vertexShader:`
uniform mat4 uReflectionMatrix;uniform float uTime,uMode;varying vec4 vReflection;varying vec3 vLocal,vWorld,vNormalLocal,vAxisX,vAxisY,vAxisZ;varying vec2 vUv;
void main(){vLocal=position;vNormalLocal=normal;vUv=uv;vec3 displaced=position;
if(uMode>1.5&&uMode<2.5)displaced.y+=sin(position.z*12.-uTime*2.8+position.x*4.)*.012*sin(uv.x*3.14159265)*sin(uv.y*3.14159265);
vWorld=(modelMatrix*vec4(displaced,1.)).xyz;vReflection=uReflectionMatrix*vec4(vWorld,1.);vAxisX=normalize(mat3(modelMatrix)*vec3(1,0,0));vAxisY=normalize(mat3(modelMatrix)*vec3(0,1,0));vAxisZ=normalize(mat3(modelMatrix)*vec3(0,0,1));gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}
`,fragmentShader:`
precision highp float;uniform sampler2D uReflection;uniform float uReflectionEnabled;varying vec4 vReflection;uniform float uTime,uMode;uniform sampler2D uEnvironment;varying vec3 vLocal,vWorld,vNormalLocal,vAxisX,vAxisY,vAxisZ;varying vec2 vUv;
${field}
${hydroGLSL}
vec3 environment(vec3 r){return texture2D(uEnvironment,vec2(atan(r.z,r.x)*.159154943+.5,asin(clamp(r.y,-1.,1.))*.318309886+.5)).rgb;}
void main(){vec2 p=vLocal.xz;float t=uTime,foam=0.;vec3 c,nLocal;
if(uMode<.5||uMode>2.5){bool basin=uMode>2.5;nLocal=waveGradient(p,t,basin?.38:.8);float depth=fbm(p*.55);c=mix(vec3(.002,.021,.036),vec3(.005,.060,.082),depth);
float shore=basin?pow(clamp(length(vUv-.5)*2.,0.,1.),12.):exp(-min(abs(p.x+8.55),abs(p.y+.62))*11.);c+=vec3(.008,.022,.019)*shore;
float lights=exp(-pow((p.x+7.7+nLocal.x*.15)*4.,2.))+exp(-pow((p.x+.9+nLocal.x*.15)*4.,2.))*.35;
if(!basin)c+=vec3(.01,.11,.18)*lights*smoothstep(.38,.72,noise(vec2(p.x*12.,p.y*35.-t*.3)))*.55;
}else if(uMode<1.5){vec2 flow=vec2(p.x*15.,vUv.y*5.+t*2.1);float broad=fbm(flow),fine=noise(vec2(p.x*76.+sin(vUv.y*8.+t)*.2,vUv.y*13.+t*5.));float ribbons=smoothstep(.25,.80,broad*.65+fine*.35),impact=pow(1.-vUv.y,3.);c=mix(vec3(.014,.09,.15),vec3(.21,.39,.48),ribbons);c+=vec3(.06,.13,.16)*impact;foam=impact*smoothstep(.30,.66,broad)*.75;nLocal=normalize(vNormalLocal+vec3((fine-.5)*.22,0.,(broad-.5)*.16));
}else{float bend=channelBend(p.y),across=p.x-bend;vec2 flow=vec2(across,p.y-t*.68),warp=vec2(noise(flow*.87),noise(flow*.91+13.));float large=fbm(flow*3.8+warp*1.4),fine=noise(flow*vec2(25.,22.)+warp*2.);nLocal=waveGradient(vec2(across,p.y),t*1.8,1.2);c=mix(vec3(.0015,.021,.038),vec3(.005,.069,.105),large);float impact=exp(-max(0.,p.y-.45)*2.),plumes=0.;
for(int bay=0;bay<5;bay++){float center=-7.595+float(bay)*1.01+bend+sin(p.y*1.7+float(bay)*1.3+t*.28)*(.03+p.y*.028),spread=.19+max(0.,p.y)*.07;plumes+=exp(-pow((p.x-center)/spread,2.));}
// Advected patches replace the old isocontour foam lattice.
float patches=smoothstep(.50,.69,large+fine*.12),bubbles=smoothstep(.53,.82,fine);foam=impact*(.25+patches*.55)+plumes*patches*exp(-p.y*.32)*.30+patches*bubbles*.065;
float bank=abs(p.x-riverCenter(p.y))/riverHalfWidth(p.y);foam+=smoothstep(.79,1.,bank)*patches*.09;
for(int i=0;i<3;i++){vec2 rock=vec2(-5.0+float(i)*.66+channelBend(4.6+float(i)*.7),4.6+float(i)*.7),q=p-rock;float wake=exp(-q.x*q.x/(.025+max(q.y,0.)*.05))*exp(-abs(q.y)*1.8)*step(0.,q.y);foam+=wake*(.25+patches)*.42;}foam*=.52+.48*exp(-max(p.y-.6,0.)*.7);}
vec3 normal=normalize(vAxisX*nLocal.x+vAxisY*nLocal.y+vAxisZ*nLocal.z),eye=normalize(cameraPosition-vWorld);float fresnel=.025+.78*pow(1.-max(0.,dot(normal,eye)),5.);vec3 reflected=environment(reflect(-eye,normal))*.7;if(uMode<.5&&uReflectionEnabled>.5&&vReflection.w>0.){vec2 uv=vReflection.xy/vReflection.w+normal.xz*.009;vec4 planar=texture2D(uReflection,clamp(uv,vec2(.001),vec2(.999)));float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);reflected=mix(reflected,planar.rgb,planar.a*inside*.9);}c=mix(c,reflected,uMode<.5?.12+fresnel*.8:fresnel);vec3 keyDir=normalize(vec3(-.42,.82,.4));float spec=pow(max(0.,dot(normal,normalize(eye+keyDir))),uMode<.5||uMode>2.5?160.:72.);c+=vec3(.33,.48,.55)*spec*.32;c=mix(c,vec3(.50,.69,.76),clamp(foam,0.,.90));gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});}
