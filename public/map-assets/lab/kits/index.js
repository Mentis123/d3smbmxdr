// Kit registry: recipe id -> buildKit(k). One import line per exhibit, matching ../recipes/index.js.
import {buildKit as energyIntake} from './energy.intake-vision.js';
import {buildKit as energyThermal} from './energy.thermal-patrol.js';
import {buildKit as energyCorridor} from './energy.corridor-inspection.js';
import {buildKit as miningConveyor} from './mining.conveyor-vision.js';
import {buildKit as miningPump} from './mining.pump-patrol.js';
import {buildKit as miningYard} from './mining.yard-awareness.js';
import {buildKit as retailProduce} from './retail.produce-recognition.js';
import {buildKit as retailDeli} from './retail.deli-service.js';
import {buildKit as retailAvailability} from './retail.produce-availability.js';
import {buildKit as dcHungry} from './datacenter.too-hungry.js';
import {buildKit as dcHot} from './datacenter.too-hot.js';
import {buildKit as dcHeavy} from './datacenter.too-heavy.js';
import {buildKit as localNotes} from './local.meeting-notes.js';
import {buildKit as localAgent} from './local.browser-agent.js';
import {buildKit as localFiles} from './local.files-answer.js';
import {buildKit as meetingBeams} from './meeting.adaptive-beams.js';
import {buildKit as meetingCamera} from './meeting.camera-director.js';
import {buildKit as meetingSound} from './meeting.ceiling-sound.js';
import {buildKit as splunkSap} from './splunk.sap-forecast.js';

export const KITS=Object.freeze({
  'energy.intake-vision':energyIntake,'energy.thermal-patrol':energyThermal,'energy.corridor-inspection':energyCorridor,
  'mining.conveyor-vision':miningConveyor,'mining.pump-patrol':miningPump,'mining.yard-awareness':miningYard,
  'retail.produce-recognition':retailProduce,'retail.deli-service':retailDeli,'retail.produce-availability':retailAvailability,
  'datacenter.too-hungry':dcHungry,'datacenter.too-hot':dcHot,'datacenter.too-heavy':dcHeavy,
  'local.meeting-notes':localNotes,'local.browser-agent':localAgent,'local.files-answer':localFiles,
  'meeting.adaptive-beams':meetingBeams,'meeting.camera-director':meetingCamera,'meeting.ceiling-sound':meetingSound,
  'splunk.sap-forecast':splunkSap,
});
