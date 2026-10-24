// L1. Pure data: read by the renderer and (via sync) by the Data#3 host. Storyboard: docs/three-worlds/LOCAL-LAB-PLAN.md s3.
// No figures: the scene shows the path (microphone -> CPU -> your notes), not a measured speed or accuracy.
export default {
  id:'local.meeting-notes', world:'local', featured:true, order:1,
  locationId:'local.cpu', label:'Meeting notes', view:'cpu', anchor:[-0.27,8.0,-1.7],
  title:'Notes from a meeting, without the cloud',
  benefit:'Meeting notes appear as people speak, the audio never leaves the laptop, and there is no per-minute bill.',
  // Why local, shown by the Data#3 host as its own panel. Only claims this scene can stand behind; no figures.
  whyLocal:[
    {key:'Privacy',text:'The recording never leaves the laptop, so board, HR and customer calls are not sent to a transcription service.'},
    {key:'Cost',text:'No per-minute or per-token charge: transcribing a long call costs the same as a short one.'},
    {key:'Latency',text:'Words appear as people speak, with no upload and no wait for a server to answer.'},
    {key:'Security',text:'No third party holds a copy of the audio, so there is one less place for it to leak from.'},
  ],
  limits:'Accents, noise and people talking over each other lower accuracy, and speaker names need a second model. On a Copilot+ PC Windows would usually send this to the NPU; this scene shows the path that works on any laptop.',
  whereItRuns:['Microphone','CPU','Your notes'],
  provenance:[
    {label:'Foundry Local speech (Whisper) on Windows',url:'https://learn.microsoft.com/windows/ai/windows-ai-comparison',kind:'verified'},
    {label:'whisper.cpp on the CPU',url:'https://github.com/ggml-org/whisper.cpp',kind:'pattern'},
    {label:'AMD: Whisper on Ryzen AI NPU vs CPU',url:'https://www.amd.com/en/developer/resources/technical-articles/2025/unlocking-on-device-asr-with-whisper-on-ryzen-ai-npus.html',kind:'vendor'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,label:'The task',caption:'A meeting starts and the notes fall behind',
      camera:{angle:1.05,elevation:.3,distance:10,target:[.4,3.0,-.2],ease:.001,portrait:{angle:1.05,elevation:.3,distance:15,target:[.4,3.2,-.2]}},
      say:'What: a weekly call on the laptop, three people talking, and one person trying to keep notes by hand. So what: the pen can’t keep up, so decisions and owners get lost between the call and the follow-up. Now what: let the laptop take the notes, without sending the meeting anywhere.'},
    {id:'change',at:4,label:'Ask',caption:'Audio goes to the laptop, not the cloud',
      camera:{angle:.95,elevation:.26,distance:5,target:[0,3.1,-.6],portrait:{angle:.95,elevation:.28,distance:7.2,target:[0,3.15,-.6]}},
      say:'What: one click on Transcribe locally. The call audio goes into the laptop’s own speech model, not to a cloud service. So what: the conversation stays on the device, which matters for board, HR and customer calls. Now what: watch where the work actually happens.'},
    {id:'aiView',at:10,label:'On the chip',caption:'Speech to text on the CPU: no upload, no meter running',sensor:'chip-view',
      overlay:{anchor:'cpu',label:'Transcribing on the CPU',state:'review'},
      say:'What: under the keyboard, the CPU cores light up as the speech model turns audio into words, and the lines appear in the notes panel. The path runs microphone, CPU, screen and never leaves the laptop. So what: no upload, no transcription service holding a copy, and no per-minute bill; the words appear as people speak because nothing waits on a server. Now what: a person still reads what it wrote.'},
    {id:'review',at:16.5,label:'You decide',caption:'You fix a name and send the summary',
      camera:{angle:.8,elevation:.22,distance:3.6,target:[0,3.12,-.8],portrait:{angle:.8,elevation:.22,distance:5.6,target:[0,3.2,-.8]}},
      say:'What: the call ends and the notes are on screen. The model heard Siobhan as Shivon, so the person fixes the name, checks the summary and sends it. So what: the machine does the typing; the person owns what goes out. Now what: names, accents and cross-talk are where to look first before you send.'},
  ],
  variation:{id:'crosstalk',label:'Cross-talk',caption:'Two voices at once · check this line',
    overlay:{anchor:'cpu',label:'Two voices at once',state:'unclear'}},
};
