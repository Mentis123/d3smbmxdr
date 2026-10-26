// C2. Pure data: read by the renderer and (via sync) by the Data#3 host. Storyboard: docs/three-worlds/MEETING-ROOM-LAB-PLAN.md s3.
// Figures only from Cisco's datasheet (64 microphones, 8 AI adaptive beams). No accuracy, level or latency claims.
export default {
  id:'meeting.adaptive-beams', world:'meeting', featured:true, order:1,
  locationId:'meeting.ceiling.mic', label:'Microphone', view:'mic', anchor:[0,5.15,-2.6],
  title:'The ceiling hears the voices, not the room',
  benefit:'People at both ends of the table come through clearly, and the coffee machine and the air vent do not.',
  whyLocal:[
    {key:'Latency',text:'The beams are formed inside the microphone, so they follow whoever is talking as the conversation moves.'},
    {key:'Privacy',text:'It listens to directions, not identities: the camera tells it where people sit, never who they are.'},
  ],
  limits:'A beam picks a direction, not a person, so two people talking at once in the same spot share a beam. Each microphone covers about 3.5 m, which is why this room has two. Without a camera in the room it has to cover the empty seats as well.',
  whereItRuns:['Ceiling Microphone Pro','Room Kit Pro G2','Far end'],
  provenance:[
    {label:'Cisco Ceiling Microphone Pro data sheet: 64 microphones, 8 AI adaptive beams, 3.5 m pickup, AI noise removal',url:'https://www.cisco.com/c/en/us/products/collateral/collaboration-endpoints/collaboration-peripherals/ceiling-microphone-pro-ds.html',kind:'verified'},
    {label:'Cisco blog: the microphone uses the camera’s head detection to decide where to listen',url:'https://blog.webex.com/workspaces/behind-the-scenes-first-ai-adaptive-ceiling-microphone/',kind:'vendor'},
    {label:'Cisco Live BRKCOL-2558: audio over IP (encrypted AES67) on one cable to the codec',url:'https://www.ciscolive.com/c/dam/r/ciscolive/apjc/docs/2025/pdf/BRKCOL-2558.pdf',kind:'vendor'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,label:'The meeting',caption:'A full room, a coffee machine and an air vent',
      say:'What: a town hall in a big meeting room, with a discussion at the table. The coffee machine by the door is running and the air vent hums. So what: an ordinary microphone hears all of it, and the people on the call hear the room, not the speaker. Now what: watch what the ceiling microphone does with it.'},
    {id:'change',at:4,label:'Someone speaks',caption:'Two voices at opposite ends of the table',
      camera:{angle:.62,elevation:.3,distance:4.0,target:[-.15,.62,-.1],portrait:{angle:.62,elevation:.34,distance:5.8,target:[-.2,.7,-.1]}},
      say:'What: someone near the screens makes a point and the person at the far end answers. They are nearly four metres apart, with noise between them. So what: a single microphone in the middle either hears both badly or hears the coffee machine best. Now what: look through the microphone itself.'},
    {id:'aiView',at:10,label:'Through the device',caption:'Eight beams find two voices. The noise is removed',sensor:'mic-view',
      overlay:{anchor:'talkerA',label:'Voice found',state:'noticed'},
      say:'What: this is the view from the Ceiling Microphone Pro, straight down. Its 64 microphones form eight beams; two swing onto the two people talking and lock on. The beam over the empty seats stays parked, because the camera has told it nobody sits there. The coffee machine and the vent are removed on the device. So what: the far end hears two clear voices instead of a room. Now what: see what reaches the call.'},
    {id:'review',at:16,label:'Everyone gets it',caption:'Both voices arrive clean at the far end',
      camera:{angle:-1.3,elevation:.3,distance:4.5,target:[-.05,.72,-.25],ease:1.6,portrait:{angle:-1.25,elevation:.34,distance:6.6,target:[-.05,.8,-.25]}},
      overlay:{anchor:'farEnd',label:'Far end hears both',state:'noticed'},
      say:'What: back in the room, the beams stay on the two people talking and the audio goes down one cable to the Room Kit Pro G2 and out to the call. So what: nobody has to lean into a microphone or move seats, and nobody on the call asks them to repeat it. Now what: two people talking over each other in the same spot is where to look first.'},
  ],
  variation:{id:'one-beam',label:'Two in one beam',caption:'Two voices in one beam · both come through',
    captions:{review:'Both voices come through together, not separated'},
    overlay:{anchor:'talkerA',label:'Two voices · one beam',state:'unclear'}},
  // Narration (owner's ElevenLabs file, 26 Oct 2026, cut at its pauses). Delays land each line on its on-screen event;
  // with the variation on, its clip plays at the AI view and the review stays silent (the normal review line would not fit).
  narration:{base:'/map-assets/lab/audio/meeting.adaptive-beams/',lines:{scene:'scene.mp3',change:'change.mp3',aiView:'aiView.mp3',review:'review.mp3'},variation:{aiView:'variation.mp3',review:null},delay:{scene:0,change:.6,aiView:0,review:1}},
};
