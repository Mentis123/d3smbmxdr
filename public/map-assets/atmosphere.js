import * as THREE from 'three';

// Shared sky, fog and light moods for any world (28 Oct 2026, first built for Marlow Vale).
//
//   applyAtmosphere(world, 'dusk', {dome, fogDensity, sun})   from a scene module, or ?sky=dusk on any wrapper
//
// It recolours the shell's four lights (hemisphere, key, rim, warm), swaps the reflection environment for one painted
// from the same sky, adds exponential fog in the horizon colour and a sky dome inside the turntable (so the sunset stays
// behind the far side of the world as it turns). Water and other custom shaders can read the same sky with SKY_GLSL
// (skyColor(dir)) and the uniforms in atmosphere.uniforms, so a river reflects exactly the sky above it.
// A preset is pure data: add one (night, storm, noon) by adding an entry, never by forking the module.
//
// Colours are linear RGB. Directions are in turntable-local space, +z toward the opening camera.

export const ATMOSPHERES = {
  dusk: {
    zenith: [0.002, 0.004, 0.02], upper: [0.006, 0.013, 0.05], horizon: [0.03, 0.046, 0.135],
    glow: [1.5, 0.46, 0.08], blush: [0.07, 0.028, 0.02], ground: [0.02, 0.025, 0.055],
    sun: [-0.12, -0.035, -1], stars: 0.85, clouds: 0.75,
    fog: [0.032, 0.044, 0.12], fogDensity: 0.0095,
    hemi: {sky: [0.22, 0.3, 0.75], ground: [0.02, 0.022, 0.04], intensity: 0.8},
    key: {color: [0.5, 0.6, 1], intensity: 0.75, position: [-9, 16, 11]},
    rim: {color: [1, 0.48, 0.2], intensity: 1.3, position: [-3, 3.5, -30]},
    warm: {color: [1, 0.62, 0.36], intensity: 0.22, position: [10, 8, 5]},
    environmentIntensity: 0.42,
  },
};

// skyColor(dir) for any shader: same sky the dome draws, so reflections match. Needs uniforms uSkyZenith, uSkyUpper,
// uSkyHorizon, uSkyGlow, uSkyBlush, uSkyGround, uSunDir, uStars, uClouds, uSkyTime (all in atmosphere.uniforms).
export const SKY_GLSL = `
uniform vec3 uSkyZenith,uSkyUpper,uSkyHorizon,uSkyGlow,uSkyBlush,uSkyGround,uSunDir;uniform float uStars,uClouds,uSkyTime;
float skyHash(vec3 p){p=fract(p*.3183099+vec3(.11,.23,.37));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float skyNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=skyHash(vec3(i,1.)),b=skyHash(vec3(i+vec2(1,0),1.)),c=skyHash(vec3(i+vec2(0,1),1.)),d=skyHash(vec3(i+1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float skyFbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=skyNoise(p)*a;p=p*2.03+vec2(7.1,3.7);a*=.5;}return v;}
vec3 skyColor(vec3 dir,bool withStars){
  dir=normalize(dir);float h=dir.y;
  vec3 c=mix(uSkyHorizon,uSkyUpper,smoothstep(0.,.08,h));c=mix(c,uSkyZenith,smoothstep(.08,.55,h));
  vec2 flat_=normalize(dir.xz+1e-5),sunFlat=normalize(uSunDir.xz);float toward=max(dot(flat_,sunFlat),0.);
  float lift=max(h-uSunDir.y,0.);
  c+=uSkyGlow*pow(toward,4.)*exp(-lift*70.)+uSkyGlow*.18*pow(toward,2.)*exp(-lift*18.);
  c+=uSkyBlush*pow(toward,1.5)*exp(-lift*14.);
  // Thin cloud bands, lit from the sunset side, dark against the blue elsewhere.
  if(uClouds>0.&&h>.015){vec2 q=dir.xz/(h+.08);float band=skyFbm(q*vec2(1.4,4.6)+vec2(uSkyTime*.006,0.));float cl=smoothstep(.56,.8,band)*smoothstep(.015,.08,h)*(1.-smoothstep(.32,.6,h))*uClouds;
    vec3 lit=mix(uSkyHorizon*.45,uSkyGlow*.5+uSkyBlush,pow(toward,3.)*exp(-lift*12.));c=mix(c,lit,cl*.8);}
  if(withStars&&uStars>0.){vec3 s=floor(dir*420.);float r=skyHash(s);float star=step(.9965,r)*smoothstep(.12,.55,h)*(.55+.45*sin(uSkyTime*1.7+r*80.));c+=vec3(.9,.92,1.)*star*uStars*(1.-pow(toward,4.)*.8);}
  if(h<0.)c=mix(c,uSkyGround,smoothstep(0.,-.12,h));
  return c;
}`;

const v3 = a => new THREE.Vector3(...a);
const col = a => new THREE.Color().setRGB(a[0], a[1], a[2]);

function paintEnvironment(p) {
  // The reflection environment is a small equirect painting of the same sky (sRGB canvas), so glass and wet surfaces
  // pick up the sunset on the sunset side and the deep blue overhead.
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
  const g = canvas.getContext('2d');
  const hex = a => '#' + col(a).getHexString(THREE.SRGBColorSpace);
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, hex(p.zenith)); grad.addColorStop(0.32, hex(p.upper)); grad.addColorStop(0.5, hex(p.horizon)); grad.addColorStop(0.53, hex(p.ground)); grad.addColorStop(1, hex(p.ground));
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
  const sunU = (Math.atan2(p.sun[2], p.sun[0]) / (2 * Math.PI) + 0.5) * 512;
  for (const dx of [-512, 0, 512]) {
    const r = g.createRadialGradient(sunU + dx, 128, 2, sunU + dx, 128, 150);
    r.addColorStop(0, 'rgba(255,150,80,0.95)'); r.addColorStop(0.25, 'rgba(240,110,90,0.45)'); r.addColorStop(1, 'rgba(120,60,110,0)');
    g.fillStyle = r; g.fillRect(0, 60, 512, 80);
  }
  const t = new THREE.CanvasTexture(canvas); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function applyAtmosphere(world, name = 'dusk', opts = {}) {
  const base = ATMOSPHERES[name];
  if (!base) return null;
  const p = {...base, ...opts.preset};
  const {scene, root} = world;
  const sunDir = v3(opts.sun || p.sun).normalize();
  const uniforms = {
    uSkyZenith: {value: col(p.zenith)}, uSkyUpper: {value: col(p.upper)}, uSkyHorizon: {value: col(p.horizon)},
    uSkyGlow: {value: col(p.glow)}, uSkyBlush: {value: col(p.blush)}, uSkyGround: {value: col(p.ground)},
    uSunDir: {value: sunDir}, uStars: {value: p.stars}, uClouds: {value: p.clouds}, uSkyTime: {value: 0},
  };

  // Lights: the shell's hemisphere, key, cool rim and warm fill, found the same way local-scene.js finds them.
  const set = (light, spec) => { if (!light || !spec) return; light.color.copy(col(spec.color || spec.sky)); light.intensity = spec.intensity; if (spec.position) light.position.set(...spec.position); };
  for (const light of [...scene.children]) {
    if (light.isHemisphereLight) { light.color.copy(col(p.hemi.sky)); light.groundColor.copy(col(p.hemi.ground)); light.intensity = p.hemi.intensity; }
    else if (light === world.key) set(light, p.key);
    else if (light.isDirectionalLight && !light.userData.atmosphere && light.color.b > light.color.r) { set(light, p.rim); light.userData.atmosphere = 'rim'; }
    else if (light.isDirectionalLight && !light.userData.atmosphere) { set(light, p.warm); light.userData.atmosphere = 'warm'; }
  }

  const oldEnv = scene.environment;
  scene.environment = paintEnvironment({...p, sun: sunDir.toArray()});
  scene.environmentIntensity = p.environmentIntensity;
  world.extraTextures = world.extraTextures.filter(t => t !== oldEnv).concat(scene.environment);
  oldEnv?.dispose();

  const fogDensity = opts.fogDensity ?? p.fogDensity;
  scene.fog = fogDensity > 0 ? new THREE.FogExp2(col(p.fog), fogDensity) : null;

  let dome = null;
  if (opts.sky !== false) {
    const radius = opts.dome ?? 140;
    dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), new THREE.ShaderMaterial({
      name: 'atmosphere-sky', uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `${SKY_GLSL}\nvarying vec3 vDir;void main(){gl_FragColor=vec4(skyColor(vDir,true),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,
    }));
    dome.name = 'atmosphere-sky'; dome.renderOrder = -10; dome.frustumCulled = false;
    // The dome is centred on the camera every frame (the far plane is 160), but lives in the turntable so its sun turns
    // with the world: directions stay turntable-local.
    const local = new THREE.Vector3();
    dome.onBeforeRender = (renderer, scene_, camera) => { local.copy(camera.position); root.worldToLocal(local); dome.position.copy(local); dome.updateMatrixWorld(); };
    root.add(dome);
  }
  world.updates.push(t => { uniforms.uSkyTime.value = t; });
  const atmosphere = {name, preset: p, uniforms, sunDir, dome, fog: scene.fog};
  world.atmosphere = atmosphere;
  world.stats.atmosphere = name;
  return atmosphere;
}
