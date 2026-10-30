// Non-AI business activations on the same resource-owning stage as the AI Lab.
// Absolute narration time drives every moving part, so pause and seeking are exact.
const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
function common(k){
 const {THREE,root,box,cylinder,mat,props,actors}=k;
 const pale=mat(0xb7c4cc),navy=mat(0x21475d),green=mat(0x55d9ae,{emissive:0x155b43}),red=mat(0xdb7453,{emissive:0x46150b}),paper=mat(0xe9dcc2);
 function group(name){const g=new THREE.Group();g.name=name;root.add(g);return g;}
 function part(g,w,h,d,m,x,y,z){const o=box(w,h,d,m,x,y,z);g.add(o);return o;}
 function label(text,x,y,z,w=1.1,bg='#132b3d'){return props.plate(text,w,.2,{x,y,z,bg,fg:'#e5f5ff',rx:-.18});}
 function desk(x,z){box(.95,.07,.55,pale,x,.57,z);for(const dx of [-.37,.37])box(.04,.55,.4,k.steel,x+dx,.27,z);box(.37,.3,.04,k.dark,x,.77,z-.1);box(.31,.22,.008,navy,x,.78,z-.073);box(.25,.025,.12,k.dark,x,.62,z+.13);}
 function worker(x,z,vest=0xe5a43b){const a=actors.person({scale:.53,vest});a.group.position.set(x,0,z);a.group.rotation.y=Math.PI;return a;}
 const lamp=(x,y,z,m=green)=>cylinder(.055,.08,m,x,y,z);
 function roller(g){for(const x of [-.35,.35])for(const z of [-.25,.25]){const w=cylinder(.085,.07,k.dark,x,.08,z);w.rotation.z=Math.PI/2;g.add(w);}}
 return{THREE,root,box,cylinder,mat,props,actors,pale,navy,green,red,paper,group,part,label,desk,worker,lamp,roller};
}

export function operations(k){
 const c=common(k),{THREE,box,mat,pale,navy,green,paper,label,desk,worker}=c;
 const anchors={},leds=[];
 for(const [i,x]of [-2.05,1.55].entries()){
  box(2.65,.08,2.75,mat(i?0x5c6a71:0x63716e),x,.04,-.2);
  box(2.65,1.35,.1,pale,x,.73,-1.5);box(.1,1.35,2.3,pale,x-1.32,.73,-.4);
  label(i?'SECOND OPERATION':'EXISTING OPERATION',x,1.58,-1.48,2.3);
  const cabinet=k.props.siteCabinet(x-.65,-.85,{label:'Site services'});anchors[i?'second':'site']=cabinet.group;
  for(let r=0;r<3;r++){box(.4,.14,.07,k.dark,x-.65,.35+r*.22,-.6);leds.push(c.lamp(x-.53,.39+r*.22,-.55));}
  desk(x+.55,-.45);const w=worker(x+.55,.25);w.group.rotation.y=Math.PI;
  label('Work orders',x+.55,1.15,-.4,1.1);
 }
 const link=k.props.pulse([[-2.7,1.45,-.8],[-2.7,2.15,-.8],[.9,2.15,-.8],[.9,1.45,-.8]],{radius:.025});
 label('REGIONAL CONNECTION',-.85,2.4,-.8,2.2);
 const local=k.props.pulse([[1.0,.18,.45],[2.1,.18,.45],[2.1,.7,-.35]],{radius:.025});
 const packets=[];for(let i=0;i<5;i++)packets.push(box(.2,.05,.15,paper,2.75,.15+i*.055,.9));
 const workSign=label('LOCAL WORK ORDERS AVAILABLE',1.55,.65,1.45,2.7,'#175849');
 const waitSign=label('REPORTING QUEUED',-1.9,.65,1.45,2.3,'#775428');waitSign.visible=false;
 const check=box(.1,.6,.1,k.amber,-.25,.3,.7);label('ROLLBACK CHECKPOINT',-.25,1.15,.65,1.65);
 anchors.link=check;anchors.local=workSign;
 return{anchors,update(t){const cut=t>=26.24;link.cable.visible=!cut;link.update(t,!cut);local.update(t,true);waitSign.visible=cut;packets.forEach((p,i)=>{p.visible=cut&&t>29+i*.7;});leds.forEach((o,i)=>o.material= cut&&i===5?k.amber:green);workSign.visible=t>13;check.scale.y=1+.04*Math.sin(t*2);},metrics:()=>({type:'operations',services:2,localWorkOrders:'independent',reporting:'queues on link loss'})};
}

export function engineering(k){
 const c=common(k),{box,cylinder,mat,group,part,label,desk,worker,pale,navy,green,paper,red}=c;
 const zones=[[-2.2,'DESIGN'],[0,'ENGINEERING REVIEW'],[2.2,'DISPATCH']];
 for(const[x,name]of zones){box(1.9,.04,2.7,mat(0x536572),x,.02,-.15);label(name,x,1.7,-1.5,1.8);}
 desk(-2.2,-.8);const designer=worker(-2.3,.1),engineer=worker(-.5,-.8),delivery=worker(2.6,.5);delivery.group.rotation.y=-.5;
 const specB=label('SPEC B',-2.2,1.1,-.7,.8,'#87522e'),specC=label('SPEC C',.1,1.2,-.85,.8,'#8b4938');
 const approval=label('ACCEPTED SCOPE',0,1.3,-.85,1.5,'#1b6855');approval.visible=false;
 // One physical equipment order stays recognisable from review to dispatch.
 const order=group('equipment-order');part(order,.95,.1,.65,k.steel,0,.18,0);c.roller(order);
 const motor=cylinder(.21,.55,navy,0,.46,0);motor.rotation.z=Math.PI/2;order.add(motor);
 const pump=cylinder(.28,.14,pale,.35,.46,0);pump.rotation.z=Math.PI/2;order.add(pump);part(order,.14,.52,.14,k.steel,.35,.73,0);part(order,.45,.12,.12,k.steel,.5,.96,0);
 const tag=part(order,.28,.18,.025,paper,-.3,.7,.25);
 const gate=group('approval-gate');part(gate,.07,.8,.07,k.yellow,.65,.4,.4);const arm=part(gate,.8,.055,.07,k.amber,1,.75,.4);
 const approved=label('READY FOR DELIVERY',2.2,.4,1.45,2,'#1b6855');
 return{anchors:{order,approval:specC,dispatch:approved},update(t){const accepted=t>=21.2;const x=t<9?-2.2+smooth(0,9,t)*2.2:accepted?smooth(26.8,32.6,t)*2.2:0;order.position.set(x,0,.35);specB.visible=!accepted;specC.visible=!accepted;approval.visible=accepted;approved.visible=t>=27;tag.material=accepted?green:red;arm.rotation.z=-smooth(21.2,24.2,t)*1.25;engineer.group.position.x=-.5+smooth(15,21,t)*.35;engineer.pose?.({distance:0,weight:0,point:accepted?1:0});},metrics:()=>({type:'engineering',order:'single assembly',approvalGate:true})};
}

export function terminal(k){
 const c=common(k),{THREE,box,cylinder,mat,group,part,label,desk,worker,pale,navy,green,red,paper}=c;
 // A miniature terminal continues operating behind the separate business endpoint and SOC.
 box(6.5,.04,1.1,mat(0x24536c),0,.015,-1.5);const ship=group('terminal-ship');part(ship,2.1,.23,.52,k.dark,0,.2,-1.5);part(ship,.35,.45,.5,pale,.72,.5,-1.5);for(let i=0;i<3;i++)part(ship,.4,.09,.35,paper,-.6+i*.5,.37,-1.5);
 box(3,.1,.18,k.steel,-1,.8,-.9);for(const x of [-2,-.5])box(.06,.8,.06,k.yellow,x,.4,-.9);k.bar([.5,.1,-1],[.5,1.4,-1],.05,k.yellow);k.bar([.5,1.4,-1],[1,.65,-1.6],.05,k.yellow);
 label('PLANT CONTROLS: INDEPENDENT',0,1.65,-1.65,3.5);
 desk(-2,.5);desk(.15,.5);desk(2.3,.5);
 label('BUSINESS ENDPOINT',-2,1.2,.45,1.7);label('SECURITY SERVICE',.15,1.2,.45,1.7);label('SHIFT SUPERVISOR',2.3,1.2,.45,1.7);
 const analyst=worker(.1,1.2),supervisor=worker(2.3,1.2);const endpoint=box(.31,.22,.012,navy,-2,.78,.425);
 const evidence=label('VALIDATE EVIDENCE',-.1,1.7,.5,2.2,'#76542d');
 const response=label('AUTHORISED CONTAINMENT',-1.6,1.7,.5,2.8,'#76542d');
 const handover=label('RECOVERY OWNER ASSIGNED',1.6,1.7,.5,2.8,'#175b48');
 const cable=k.props.pulse([[-2,.05,.65],[-2,.05,.1],[.15,.05,.1],[.15,.65,.4]],{radius:.02});
 const fallback=box(.35,.04,.25,paper,2.4,.65,.65);
 const data=box(.12,.12,.12,k.cyan,-1,.13,.1);
 return{anchors:{endpoint,soc:evidence,handover},update(t){const alerted=t>=4,isolated=t>=24;endpoint.material=isolated?k.amber:alerted?red:navy;evidence.visible=t>=11&&t<24;response.visible=t>=24&&t<30;handover.visible=t>=30;fallback.material=t>=28?green:paper;cable.cable.visible=!isolated;cable.update(t,alerted&&!isolated);data.visible=alerted&&!isolated;data.position.x=-2+(t%3)/3*2.1;ship.position.y=Math.sin(t*.8)*.015;},metrics:()=>({type:'terminal',plantControl:'separate',response:'business endpoint only'})};
}
