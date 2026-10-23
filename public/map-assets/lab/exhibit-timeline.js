// Four-chapter exhibit timeline (Scene -> Change -> AI view -> Review). Pure: no THREE, no DOM.
// Time is the only state that matters; every visible state is a function of (time, variation), so seeking is exact.

export const EASE_SECONDS=2;

export function createTimeline(recipe,{reduced=false}={}){
  const chapters=recipe.chapters,duration=recipe.duration;
  let time=0,playing=!reduced,hold=false,variation=null,ended=false,heldBoundary=-1;
  const indexAt=t=>{let i=0;for(let c=0;c<chapters.length;c++)if(t>=chapters[c].at-1e-9)i=c;return i;};
  const chapterEnd=i=>i+1<chapters.length?chapters[i+1].at:duration;
  function step(dt){
    if(!playing||!(dt>0))return;
    const i=indexAt(time),end=chapterEnd(i),next=time+dt;
    // Hold at chapters: stop just before the boundary so the chapter's settled state stays on screen.
    if(hold&&i<chapters.length-1&&next>=end-1e-9&&heldBoundary!==i){time=end-1e-3;playing=false;heldBoundary=i;return;}
    if(next>=duration){time=duration;playing=false;ended=true;return;}
    time=next;
  }
  function seek(t){time=Math.min(duration,Math.max(0,t));ended=time>=duration;heldBoundary=-1;}
  return{
    step,seek,indexAt,chapterEnd,
    get time(){return time;},get playing(){return playing;},get hold(){return hold;},get variation(){return variation;},get ended(){return ended;},
    get index(){return indexAt(time);},get chapter(){return chapters[indexAt(time)];},
    play(){if(ended)seek(0);playing=true;},
    pause(){playing=false;},
    setHold(on){hold=!!on;heldBoundary=-1;},
    setVariation(id){variation=id&&recipe.variation&&id===recipe.variation.id?id:null;},
    // Reduced motion shows each chapter as a still of its settled state.
    chapterTime(n){const i=Math.max(0,Math.min(chapters.length-1,n|0));return reduced?Math.max(chapters[i].at,chapterEnd(i)-.05):chapters[i].at;},
  };
}

const smoother=u=>{u=Math.min(1,Math.max(0,u));return u*u*u*(u*(u*6-15)+10);};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function lerpPose(a,b,u){
  return{angle:a.angle+wrap(b.angle-a.angle)*u,elevation:a.elevation+(b.elevation-a.elevation)*u,distance:Math.exp(Math.log(a.distance)+(Math.log(b.distance)-Math.log(a.distance))*u),target:a.target.map((v,i)=>v+(b.target[i]-v)*u)};
}
// Guided orbit pose as a pure function of time. home is the fitted overview; easeFrom optionally replaces the start
// pose of one chapter (used after the visitor has moved the camera, so the guide resumes without a jump).
export function guidedPose(chapters,t,home,easeFrom=null){
  const poses=[];let prev=home;
  for(const c of chapters){const p=c.camera?{angle:c.camera.angle,elevation:c.camera.elevation,distance:c.camera.distance,target:[...c.camera.target]}:prev;poses.push(p);prev=p;}
  let i=0;for(let c=0;c<chapters.length;c++)if(t>=chapters[c].at-1e-9)i=c;
  const from=easeFrom&&easeFrom.index===i?easeFrom.pose:(i>0?poses[i-1]:home);
  const ease=chapters[i].camera?.ease??EASE_SECONDS;
  return lerpPose(from,poses[i],smoother((t-chapters[i].at)/ease));
}
