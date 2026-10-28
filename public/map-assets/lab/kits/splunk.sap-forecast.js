// S1 "The outage that never happened" (Splunk AI Lab). The owner's storyline (28 Oct 2026) on the shared network board
// (lab/rigs/splunk-net.js) at half scale: 09:52 everything is watched; at 10:00 Splunk forecasts the South SAP instance
// at 80 % by 10:30 and an outage at 11:00; in Splunk's view (buildings greyed, data glowing) the AI agent names the
// North/South imbalance and asks to move Riverside north; the team approves, the load balancers move the site, South
// settles near 60 % and 11:00 passes. Variation "north busy": North has no headroom, so the agent proposes nothing and
// pages the on-call team. Pure function of t and ctx.
import {buildNetwork,P} from '../rigs/splunk-net.js';

const smooth=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
const lerp=(a,b,u)=>a+(b-a)*Math.min(1,Math.max(0,u));
const SCALE=.5,Y=.004;
// Beats (seconds). The clock is minutes after 09:00: 09:52 -> 10:00 at the alert, slow through the decision, then fast to 11:00.
const T={alert:8,forecast:[8.4,10.6],agent:14,focus:[14.6,15.6],ghost:[15.6,16.6],approve:22.5,move:23.8,done:30.4,cardOff:[24.8,25.6]};
const clockAt=(t,v)=>t<T.alert?lerp(52,60,t/T.alert):t<23.5?lerp(60,64,(t-T.alert)/(23.5-T.alert)):v?lerp(64,68,(t-23.5)/8):lerp(64,120,(t-23.5)/7);

// Dark, cool stage: the board glows, the room disappears.
function tronStage(k){
  const {THREE}=k;const scene=k.root.parent;if(!scene)return;
  scene.background=new THREE.Color(0x03060d);if(scene.fog){scene.fog.color.set(0x03060d);scene.fog.near=14;scene.fog.far=34;}
  scene.traverse(o=>{if(o.isHemisphereLight){o.color.set(0x9fc8ff);o.groundColor.set(0x0b1220);o.intensity=1.5;}
    else if(o.isDirectionalLight&&o.castShadow){o.color.set(0xdfeaff);o.intensity=2.4;o.position.set(-3,7,5);}
    else if(o.isDirectionalLight){o.color.set(0xff3fae);o.intensity=1.1;o.position.set(5,3,-3);}});
}

export function buildKit(k){
  const {THREE,root}=k;
  tronStage(k);
  const net=buildNetwork(k,{parent:root,scale:SCALE,y:Y,detail:'stage'});

  // Splunk's view: high over the front edge, looking down across the whole board.
  const cam=new THREE.PerspectiveCamera(45,1.6,.05,60);cam.position.set(.1,4.45,3.95);cam.lookAt(.1,.25,-.25);cam.userData.portraitWidth=1.4;root.add(cam);

  const hud=new THREE.Vector3(),cardHome={p:net.cards.agent.position.clone(),s:net.cards.agent.scale.clone()},cardAspect=cardHome.s.y/cardHome.s.x;
  let last={},pinned=false;
  // The agent's card is pinned to whichever camera renders (Splunk's view or the guided camera), like a console message.
  // Its width is set in screen pixels (about 520 px, up to 94 % of a narrow canvas) so the type stays readable: on narrow
  // canvases it runs across the top, over the cloud; on wide ones it sits lower left; on the host's near-square stage it
  // sits on the left just below the middle, clear of the host's caption and above the fold.
  const scene=root.parent;
  if(scene)scene.onBeforeRender=(r,sc,c)=>{const card=net.cards.agent;if(!pinned||!card.visible||!c?.isPerspectiveCamera)return;
    const px=r.domElement.clientWidth||1000,f=Math.min(.94,Math.max(.42,520/px)),d=3,halfH=Math.tan(THREE.MathUtils.degToRad(c.fov/2))*d,halfW=halfH*c.aspect;
    const w=2*halfW*f,h=w*cardAspect,x=-halfW+w/2+halfW*.04;
    const y=f>.75?halfH-h/2-halfH*.04:c.aspect>=1.3?-halfH+h/2+halfH*.06:-halfH*.18;
    hud.set(x,y,-d);c.updateMatrixWorld();c.localToWorld(hud);net.group.worldToLocal(hud);
    card.position.copy(hud);card.scale.set(w/SCALE,h/SCALE,1);card.updateMatrixWorld();};
  function update(t,ctx){
    const v=!!ctx.variation,clock=clockAt(t,v),rs=!v&&t>=T.move?66:null;
    last={clock:+clock.toFixed(1),south:Math.round(net.model.south(clock,rs)),north:Math.round(net.model.north(clock,rs,v))};
    net.update(t,{
      clock,busy:v,
      redirectAt:rs,
      forecast:smooth(T.forecast[0],T.forecast[1],t),
      alert:t>=T.alert?1:0,
      agent:t>=T.agent?(v?'busy':t>=T.approve?'approved':'propose'):null,
      focus:v?0:smooth(T.focus[0],T.focus[1],t)*(1-smooth(T.move,T.move+1,t)),
      ghost:v?0:smooth(T.ghost[0],T.ghost[1],t)*(1-smooth(T.approve,T.approve+.5,t)),
      approve:v?0:smooth(T.approve+.1,T.approve+.5,t)*(1-smooth(T.move+.2,T.move+1,t)),
      done:v?0:smooth(T.done,T.done+.8,t),
    });
    // The agent's card steps aside once the change is through, so the review shot shows the board.
    const card=net.cards.agent;if(card.visible&&!v){const a=1-smooth(T.cardOff[0],T.cardOff[1],t);card.material.opacity=a;card.visible=a>.01;}
    // From the AI view on, the alert card has done its job and the agent's card is pinned to the rendering camera (below).
    if(ctx.sensor)net.cards.alert.visible=false;
    pinned=ctx.chapter>=2;if(!pinned){card.position.copy(cardHome.p);card.scale.copy(cardHome.s);}
  }
  update(0,{variation:null,chapter:0,chapterId:'scene',sensor:false});

  const a=net.anchors;
  return{
    anchors:{southSap:a.southSap,northSap:a.northSap,southGauge:a.southGauge,northGauge:a.northGauge,riverside:a.riverside,hub:a.hub,panel:a.panel,noc:a.noc},
    sensors:{'splunk-view':{camera:cam,mode:'mask',targets:[a.southSap,a.riverside],label:'Splunk ITSI',title:'Splunk view'}},
    update,
    metrics:()=>({...last,agent:net.cards.agent.visible}),
  };
}
