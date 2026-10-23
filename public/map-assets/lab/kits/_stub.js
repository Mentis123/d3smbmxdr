// Placeholder kit shared by the not-yet-built exhibits: the plinth (from the stage), a site cabinet, one simple
// stand-in subject with a sign, and a fixed site camera. Replace the whole kit file when the exhibit is built.
export function stubKit(k,{name,shape='box',color=0x7d8b94}){
  const {THREE,root,box,cylinder,mat,steel,dark}=k;
  const subject=new THREE.Group();subject.name='stub-subject';root.add(subject);
  const body=mat(color,{roughness:.6,metalness:.3});
  const add=o=>{subject.add(o);return o;};
  if(shape==='pole'){add(cylinder(.08,2.6,steel,0,1.3,0));add(box(1.4,.08,.08,steel,0,2.45,0));for(const x of [-.6,.6])add(box(.08,.3,.08,body,x,2.25,0));}
  else if(shape==='pump'){const m=add(cylinder(.32,1,body,-.2,.55,0));m.rotation.z=Math.PI/2;add(box(1.6,.12,.8,dark,0,.06,0));add(cylinder(.3,.3,steel,.55,.55,0)).rotation.z=Math.PI/2;}
  else if(shape==='counter'){add(box(2.2,.95,.6,body,0,.475,0));add(box(2.2,.06,.7,steel,0,.98,0));}
  else if(shape==='crates'){for(let i=0;i<3;i++)add(box(.6,.3,.45,body,-.7+i*.7,.55,0));add(box(2.2,.4,.6,dark,0,.2,0));}
  else{add(box(1.2,1.1,.9,body,0,.55,0));add(box(.9,.3,.6,steel,0,1.25,0));}
  k.props.plate('PLACEHOLDER · '+name,1.6,.22,{x:0,y:2.9,z:.6,rx:-.2});
  const cabinet=k.props.siteCabinet(2.3,-1.2,{rotation:-.5});
  const camera=new THREE.PerspectiveCamera(34,1,.05,40);camera.position.set(3.3,2.7,3.1);camera.lookAt(0,.8,0);
  return{anchors:{subject},sensors:{'site-cam':{camera,mode:'mask',targets:[subject],label:'site camera'}},
    update(t,ctx){cabinet.update(t,ctx.chapterId==='aiView');subject.rotation.y=0;},metrics:()=>({stub:true})};
}
