// Media supplies occasional time anchors; the renderer reads a continuous clock each frame.
// This clock owns time only. It never seeks or resets the user's camera.
export function createMediaClock(duration){
  const clamp=t=>Math.max(0,Math.min(duration,t));
  let time=0,stamp=0,playing=false,rate=1;
  return{
    sample(input,now){
      if(!Number.isFinite(input.time)||!Number.isFinite(now))return false;
      time=clamp(input.time);stamp=now;playing=input.playing===true;
      rate=Number.isFinite(input.rate)&&input.rate>0?Math.min(4,input.rate):1;
      return true;
    },
    at(now){return clamp(time+(playing?Math.max(0,now-stamp)*rate/1000:0));},
    get playing(){return playing;}
  };
}
