// C3. Pure data: read by the renderer and (via sync) by the Data#3 host. Storyboard: docs/three-worlds/MEETING-ROOM-LAB-PLAN.md s3.
// Features only from Cisco's datasheet (self-calibration of gain and delay, spatial playback, local presenter
// reinforcement, 120-degree coverage). No level, delay or loudness figures are shown; the wavefronts are slowed to be seen.
export default {
  id:'meeting.ceiling-sound', world:'meeting', featured:true, order:3,
  locationId:'meeting.ceiling.speaker', label:'Speakers', view:'speakers', anchor:[3.68,5.2,3.16],
  title:'Every seat hears it the same',
  benefit:'The back row hears a remote speaker as clearly as the front, with no amplifier rack: each speaker takes power and audio from its one cable.',
  whyLocal:[
    {key:'Cost',text:'No amplifier or DSP rack to buy, mount and wire: each speaker is powered by its one PoE+ cable and does its own processing.'},
    {key:'Latency',text:'Each speaker tunes its own level and timing on the device, so nothing waits on a separate audio rack.'},
  ],
  limits:'Each speaker draws up to 24 W from its cable, so the PoE switch needs a PoE+ budget for every speaker. The speakers even out level and timing; the room’s own echo and hard surfaces are still the room’s. Placing a voice left or right needs more than one speaker, and local voice lift between microphones and speakers is a future software release.',
  whereItRuns:['Room Kit Pro G2','Ceiling Speaker Pro','Every seat'],
  provenance:[
    {label:'Cisco Ceiling Speaker Pro data sheet: single-cable IP, PoE+ powered (24 W rated), built-in DSP, edge-AI processing on the device, automatic self-calibration of gain and delay, spatial playback, local presenter reinforcement, 120° coverage, PoE+, AES67',url:'https://www.cisco.com/c/en/us/products/collateral/collaboration-endpoints/collaboration-peripherals/ceiling-speaker-pro-ds.pdf',kind:'verified'},
    {label:'Cisco blog, WebexOne 2026: the speaker completes audio over IP; edge AI directs sound to where it is needed',url:'https://blog.webex.com/collaboration/the-next-chapter-of-connected-intelligence/',kind:'vendor'},
    {label:'UC Today: WebexOne 2026 coverage of the Ceiling Speaker Pro for medium and large rooms',url:'https://uctoday.com/webexone-2026-cisco-bets-on-ai-to-redefine-the-meeting-room',kind:'press'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,label:'The meeting',caption:'A voice from the front. The back row leans in',
      say:'What: someone on the call is talking, and her voice comes out of the display at the front. By the back row it has faded, so people lean in. So what: the people furthest from the screen miss the point and stop joining in. Now what: bring the ceiling speakers in.'},
    {id:'change',at:4,label:'Someone speaks',caption:'No amplifier rack: each speaker runs on one cable',
      camera:{angle:-.62,elevation:.42,distance:4.8,target:[0,.8,.1],portrait:{angle:-.6,elevation:.46,distance:6.8,target:[0,.85,.1]}},
      say:'What: the old way flashes up in red: an amplifier rack in the corner and a speaker cable to every speaker. It is crossed out, and the four Ceiling Speaker Pros come alive one by one, each on its own network cable from the Room Kit Pro G2, which carries both power and audio. So what: no amplifiers and no DSP rack to buy or wire, however many speakers the room needs; another speaker is another cable. Now what: look at the sound itself.'},
    {id:'aiView',at:10,label:'Through the device',caption:'Each speaker sets its own level and timing',sensor:'sound-view',
      overlay:{anchor:'backRow',label:'Back row · in time, in level',state:'noticed'},
      say:'What: this is the sound, slowed right down. Each speaker covers the seats beneath it; the front pair start first and the rear pair a moment later, so the sound arrives at the back row together. Her voice is louder on the left, where her picture is. So what: the same voice, at the same level, in every seat. Now what: back to the room.'},
    {id:'review',at:16,label:'Everyone gets it',caption:'The same voice, the same level, in every seat',
      camera:{angle:2.8,elevation:.3,distance:3.7,target:[-.1,.65,1.3],ease:1.6,portrait:{angle:2.8,elevation:.34,distance:5.6,target:[-.1,.7,1.3]}},
      overlay:{anchor:'backRow',label:'Same level, every seat',state:'noticed'},
      say:'What: the back row sits back and joins in, and the call carries on from the ceiling. So what: a big room behaves like a small one for the people on the call. Now what: the speakers tune themselves, but the room’s hard surfaces and echo are still worth checking.'},
  ],
  variation:{id:'in-room',label:'In-room voice',caption:'The presenter’s voice is lifted for the back rows',
    captions:{review:'The back rows hear the presenter; the front stays natural'},
    overlay:{anchor:'backRow',label:'In-room voice · back rows',state:'unclear'}},
  // Narration (owner's ElevenLabs file, 26 Oct 2026, cut at its pauses). Delays land each line on its on-screen event;
  // with the variation on, its clip plays at the AI view and the review stays silent (the normal review line would not fit).
  narration:{base:'/map-assets/lab/audio/meeting.ceiling-sound/',lines:{scene:'scene.mp3',change:'change.mp3',aiView:'aiView.mp3',review:'review.mp3'},variation:{aiView:'variation.mp3',review:null},delay:{scene:0,change:.4,aiView:0,review:1}},
};
