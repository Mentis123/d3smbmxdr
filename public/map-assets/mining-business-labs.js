import {operations,engineering,terminal} from './mining-business-kits.js';
import {CLIPS} from './mining-business-timing.js';
import {SITES} from './mining-region-data.js';
export const KITS={'mining-region.operations':operations,'mining-region.engineering':engineering,'mining-region.terminal':terminal};
export const RECIPES=Object.fromEntries(SITES.map(s=>{const clip=CLIPS[s.id],id='mining-region.'+s.id;return [id,{id,world:'mining-region',title:s.title,duration:clip.end-clip.start,chapters:clip.chapters.map((at,i)=>({id:['scene','inspect','action','review'][i],at,title:clip.titles[i],caption:clip.captions[i],camera:{angle:.25,elevation:.48,distance:i===0?11.5:i===1?10.8:11.2,target:[0,.75,0],ease:1.6,portrait:{angle:.2,elevation:.62,distance:13,target:[0,.8,0]}},overlay:{anchor:clip.anchors[i],label:clip.titles[i],state:i===2?'noticed':'neutral'}}))}];}));
