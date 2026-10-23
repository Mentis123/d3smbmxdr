import {createFlowMaterial} from '../flow-effects.js';

// Shared exhibit props. Every resource goes through the kit (k.mesh / k.mat / k.track) so the lifecycle disposes it.
export function createProps(k){
  const {THREE,root,mat,track}=k;
  const adopt=(g,o)=>{g.add(o);return o;};

  // A painted sign: text on a canvas texture. Used for asset names written into the scene (phones hide captions).
  function plate(text,w=.6,h=.16,{bg='#f2c14e',fg='#10161c',parent=root,x=0,y=0,z=0,ry=0,rx=0}={}){
    const c=document.createElement('canvas'),scale=512/w;c.width=512;c.height=Math.max(32,Math.round(h*scale));const g=c.getContext('2d');
    g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.strokeStyle=fg;g.lineWidth=Math.max(4,c.height*.06);g.strokeRect(g.lineWidth/2,g.lineWidth/2,c.width-g.lineWidth,c.height-g.lineWidth);
    g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';let size=c.height*.58;g.font=`700 ${size}px Arial,Helvetica,sans-serif`;
    while(g.measureText(text).width>c.width*.88&&size>8){size-=2;g.font=`700 ${size}px Arial,Helvetica,sans-serif`;}
    g.fillText(text,c.width/2,c.height*.54);
    const tex=track(new THREE.CanvasTexture(c));tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
    const m=k.mesh(new THREE.PlaneGeometry(w,h),track(new THREE.MeshBasicMaterial({map:tex,toneMapped:false})),x,y,z);m.castShadow=false;m.rotation.set(rx,ry,0);
    m.userData.sensorKeep=false;if(parent!==root)parent.add(m);return m;
  }

  // Cable route with a light pulse that runs only while the AI view is on (camera -> cabinet -> person).
  function pulse(points,{radius=.02,speed=.42,repeat=3}={}){
    const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));
    const cable=k.mesh(new THREE.TubeGeometry(path,Math.max(24,points.length*24),radius*.55,6,false),mat(0x1a242b,{roughness:.8}));cable.castShadow=false;cable.name='pulse-cable';
    const flow=track(createFlowMaterial({speed:speed/Math.max(1,path.getLength()),repeat,base:[.01,.08,.12],glow:[.2,1.6,2.4]}));
    const line=k.mesh(new THREE.TubeGeometry(path,Math.max(24,points.length*24),radius,6,false),flow);line.castShadow=line.receiveShadow=false;line.visible=false;line.name='pulse';line.userData.sensorKeep=true;
    return{cable,line,update(t,active){line.visible=!!active;flow.uniforms.uTime.value=t;}};
  }

  // Small site server cabinet: the "local GPU" character. Quiet: a steady status light, brighter only during the AI view.
  function siteCabinet(x,z,{label='Site GPU',rotation=0,y=0,parent=root}={}){
    const g=new THREE.Group();g.name='site-cabinet';g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);
    adopt(g,k.box(.62,.05,.52,k.steel,0,.025,0));
    adopt(g,k.box(.56,1.08,.46,k.dark,0,.59,0));
    const door=mat(0x2c3e4a,{metalness:.55,roughness:.45});adopt(g,k.box(.5,.98,.02,door,0,.6,.235));
    for(let i=0;i<4;i++)adopt(g,k.box(.36,.05,.012,mat(0x0e171d),0,.32+i*.08,.248));
    for(let i=0;i<3;i++){adopt(g,k.box(.42,.07,.012,mat(0x101a20),0,.74+i*.1,.248));adopt(g,k.box(.03,.02,.006,mat(0x55d6af,{emissive:0x1d8a68,emissiveIntensity:.6}),.17,.74+i*.1,.256));}
    const ledMat=mat(0x47e3a6,{emissive:0x1fbf84,emissiveIntensity:.5});const led=adopt(g,k.box(.07,.05,.014,ledMat,0,1.05,.25));led.castShadow=false;
    plate(label,.5,.11,{parent:g,x:0,y:1.2,z:.2,rx:-.25,bg:'#0d2230',fg:'#9fe9ff'});
    const anchor=new THREE.Object3D();anchor.position.set(0,1.0,0);g.add(anchor);
    return{group:g,led,anchor,pulse,
      update(t,active){ledMat.color.set(active?0x7fe8ff:0x47e3a6);ledMat.emissive.set(active?0x19c9ff:0x1fbf84);ledMat.emissiveIntensity=active?1.1+.7*Math.max(0,Math.sin(t*9)):.5;},
      // Point in root coordinates at the cabinet's top front, for pulse routes.
      port(dy=0){const v=new THREE.Vector3(0,.3+dy,.24);g.updateWorldMatrix(true,false);root.updateWorldMatrix(true,false);return root.worldToLocal(g.localToWorld(v)).toArray();}};
  }
  return{siteCabinet,pulse,plate};
}
