// C1. Pure data: read by the renderer and (via sync) by the Data#3 host. Storyboard: docs/three-worlds/MEETING-ROOM-LAB-PLAN.md s3.
// Figures only from Cisco's datasheet (4K, 12x optical zoom). Speaker tracking from IP microphones on this camera is
// marked "coming soon" by Cisco, so the cut to the questioner is credited to the room engine's director, not to the mic.
export default {
  id:'meeting.camera-director', world:'meeting', featured:true, order:2,
  locationId:'meeting.wall.camera', label:'Camera', view:'camera', anchor:[0,5.55,5.4],
  title:'The camera follows the conversation',
  benefit:'The people on the call see whoever is talking, close up, instead of a wide shot of a room full of small people.',
  whyLocal:[
    {key:'Latency',text:'Heads are found on the camera itself, so the framing keeps up as the presenter moves.'},
    {key:'Privacy',text:'Head detection finds where people are, not who they are; no faces or names are needed to frame a shot.'},
  ],
  limits:'The camera finds heads, not names or attention. The director follows zones and cues a person sets up once with the PresenterTrack wizard, and someone who walks out of the zone gets the overview, not a chase. Speaker tracking from the ceiling microphones on this camera is on Cisco’s roadmap; here the director makes the cut.',
  whereItRuns:['Room Vision PTZ','Room Kit Pro G2','Far end'],
  provenance:[
    {label:'Cisco Room Vision PTZ data sheet: embedded AI head detection, auto framing, PresenterTrack wizard, 4K, 12x optical zoom; speaker tracking with IP microphones “coming soon”',url:'https://www.cisco.com/c/en/us/products/collateral/collaboration-endpoints/conferencing-cameras/room-vision-ptz-ds.html',kind:'verified'},
    {label:'Cisco Room Kit Pro G2 data sheet: multi-camera director, Frames, speaker tracking on the room engine',url:'https://www.cisco.com/c/en/us/products/collateral/collaboration-endpoints/webex-room-series/room-kit-pro-g2-ds.html',kind:'verified'},
    {label:'Cisco Live BRKCOL-2558: camera = eyes, microphone = ears, codec = brain, with an AI director',url:'https://www.ciscolive.com/c/dam/r/ciscolive/apjc/docs/2025/pdf/BRKCOL-2558.pdf',kind:'vendor'},
  ],
  duration:28,
  chapters:[
    {id:'scene',at:0,label:'The meeting',caption:'A presenter, a full table and two rows behind',
      say:'What: a town hall with a presenter at the front, people round the table and two rows behind. The call sees one wide shot of the whole room. So what: from a wide shot nobody on the call can tell who is talking. Now what: watch what happens when the room gets busy.'},
    {id:'change',at:4,label:'Someone speaks',caption:'The presenter moves. A hand goes up in row one',
      camera:{angle:.85,elevation:.3,distance:5.0,target:[.1,.6,-.2],portrait:{angle:.85,elevation:.34,distance:7.2,target:[.1,.7,-.25]}},
      say:'What: the presenter walks to the screen and points at a chart, and someone in row one puts a hand up. So what: a fixed camera would leave the presenter half out of frame and the question invisible. Now what: look through the cameras.'},
    {id:'aiView',at:10,label:'Through the device',caption:'Head detection finds people. The director picks the shot',sensor:'ptz-view',
      overlay:{anchor:'subject',label:'Presenter · tracked',state:'noticed',until:13.6,after:{anchor:'subject',label:'Question · row one',state:'noticed'}},
      say:'What: this is the rear Room Vision PTZ. It finds every head on the camera itself, then tightens on the presenter and keeps them framed. When the question starts, the Room Kit Pro G2’s director cuts to the front camera on the person asking. So what: the far end always sees the person who matters right now. Now what: see what the far end gets.'},
    {id:'review',at:18,label:'Everyone gets it',caption:'The far end sees who is speaking, not a wide room',
      camera:{angle:.55,elevation:.08,distance:3.0,target:[-.15,.75,-1.85],ease:1.6,portrait:{angle:.5,elevation:.1,distance:4.8,target:[-.2,.8,-1.85]}},
      overlay:{anchor:'farEnd',label:'Presenter and question',state:'noticed'},
      say:'What: the far end’s layout now shows the presenter and the questioner side by side, and the presenter answers. So what: nobody had to touch a remote or steer a camera. Now what: the zones are set up once; someone who leaves them gets the overview, not a chase.'},
  ],
  variation:{id:'out-of-zone',label:'Out of zone',caption:'Out of the zone · the camera holds the overview',
    captions:{review:'No hunting: the far end keeps the overview'},
    overlay:{anchor:'subject',label:'Out of zone · overview',state:'unclear'}},
  // Narration (owner's ElevenLabs file, 26 Oct 2026, cut at its pauses). Delays land each line on its on-screen event;
  // with the variation on, its clip plays at the AI view and the review stays silent (the normal review line would not fit).
  narration:{base:'/map-assets/lab/audio/meeting.camera-director/',lines:{scene:'scene.mp3',change:'change.mp3',aiView:'aiView.mp3',review:'review.mp3'},variation:{aiView:'variation.mp3',review:null},delay:{scene:.3,change:2.4,aiView:0,review:1}},
};
