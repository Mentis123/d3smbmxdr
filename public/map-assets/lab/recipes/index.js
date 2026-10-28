// Exhibit registry. Pure data: every recipe file, the featured exhibits per world (three; Splunk one so far), and the four retired ids.
// Adding an exhibit = a recipe file + a kit file + one import line here and in ../kits/index.js.
import energyIntake from './energy.intake-vision.js';
import energyThermal from './energy.thermal-patrol.js';
import energyCorridor from './energy.corridor-inspection.js';
import miningConveyor from './mining.conveyor-vision.js';
import miningPump from './mining.pump-patrol.js';
import miningYard from './mining.yard-awareness.js';
import retailProduce from './retail.produce-recognition.js';
import retailDeli from './retail.deli-service.js';
import retailAvailability from './retail.produce-availability.js';
import dcHungry from './datacenter.too-hungry.js';
import dcHot from './datacenter.too-hot.js';
import dcHeavy from './datacenter.too-heavy.js';
import localNotes from './local.meeting-notes.js';
import localAgent from './local.browser-agent.js';
import localFiles from './local.files-answer.js';
import meetingBeams from './meeting.adaptive-beams.js';
import meetingCamera from './meeting.camera-director.js';
import meetingSound from './meeting.ceiling-sound.js';
import splunkSap from './splunk.sap-forecast.js';

const ALL=[energyIntake,energyThermal,energyCorridor,miningConveyor,miningPump,miningYard,retailProduce,retailDeli,retailAvailability,dcHungry,dcHot,dcHeavy,localNotes,localAgent,localFiles,meetingBeams,meetingCamera,meetingSound,splunkSap];
export const RECIPES=Object.freeze(Object.fromEntries(ALL.map(r=>[r.id,r])));
export const FEATURED=Object.freeze(Object.fromEntries(['energy','mining','retail','datacenter','local','meeting','splunk'].map(w=>[w,ALL.filter(r=>r.world===w&&r.featured).sort((a,b)=>a.order-b.order)])));
// Retired from the featured three and the world markers; still openable by id on the old three-phase path.
export const LEGACY_IDS=Object.freeze(['energy.drawing-search','energy.alarm-investigation','mining.procedure-control','mining.historian-gap']);
