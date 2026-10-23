// R2. Pure data: read by the renderer and (via sync) by the Data#3 host.
export default {
  id:'retail.deli-service',world:'retail',featured:true,order:2,
  locationId:'retail.deli.counter',label:'Deli counter',view:'deli',anchor:[-4.2,1.25,-2.3],
  title:'Help a waiting customer',
  benefit:'A colleague working out of sight knows a customer is waiting at the deli.',
  limits:'The camera notices someone standing in the service area, not who they are or what they want. A rule decides when it is worth a notification, and a colleague decides what to do.',
  whereItRuns:['Deli camera','Store GPU','Colleague'],
  provenance:[
    {label:'Verified: deli customer-arrival notifications from in-store cameras, the Coles case (Microsoft Source, 27 March 2024)',url:'https://news.microsoft.com/source/asia/features/coles-deepens-its-relationship-with-shoppers-using-ai-to-understand-the-customer-experience-and-improve-efficiency-in-store/',kind:'verified'},
    {label:'Pattern: region and dwell rules on video analytics (NVIDIA DeepStream nvdsanalytics)',url:'https://docs.nvidia.com/metropolis/deepstream/8.0/text/DS_plugin_gst-nvdsanalytics.html',kind:'pattern'},
  ],
  duration:24,
  chapters:[
    {id:'scene',at:0,caption:'A colleague prepares an order behind the deli',
      camera:{angle:.55,elevation:.42,distance:8.8,target:[.38,.21,.26],portrait:{angle:.5,elevation:.5,distance:10.2,target:[.1,.75,-.1]}},
      say:'This is the deli counter in a fictional store. The colleague is busy at the bench behind the partition and cannot see the counter from there. Nobody is waiting.'},
    {id:'change',at:4,caption:'A customer arrives and waits at the counter',
      camera:{angle:.45,elevation:.3,distance:5.0,target:[.6,1.0,.35],portrait:{angle:.45,elevation:.32,distance:6.6,target:[1.0,1.05,.45]}},
      say:'A customer walks up and stops in the marked area in front of the glass. From the bench, the colleague has no idea anyone is there.'},
    {id:'aiView',at:10,caption:'The deli camera sees someone waiting for service',sensor:'deli-cam',
      overlay:{anchor:'customer',label:'Customer waiting',state:'review'},
      say:'This is what the camera on the deli gantry sees: the floor in front of the glass. The store GPU finds a person in the marked area; a simple rule checks they are still there and that nobody is serving, then sends one notification. No faces, no names.'},
    {id:'review',at:16,caption:'A colleague sees the alert and comes to serve',
      camera:{angle:-.08,elevation:.4,distance:5.6,target:[-.05,1.15,-.55],ease:1.2,portrait:{angle:.18,elevation:.46,distance:8.4,target:[-.45,1.05,-.4]}},
      overlay:{anchor:'colleague',label:'Colleague responds',state:'noticed'},
      say:'The handheld lights up; the colleague acknowledges it, comes round the partition and serves. The video is processed on the store GPU and stays in the store. The camera only saw a person waiting; serving them is up to the colleague.'},
  ],
  variation:{id:'passer-by',label:'Just passing',caption:'Someone walks through without stopping · no alert',overlay:{anchor:'area',label:'Just passing · no alert',state:'unclear'}},
  // Narration (owner's ElevenLabs file, 23 Oct 2026). Delays land each line on its on-screen event; with the variation on, its clip plays at the AI view and the review stays silent.
  narration:{base:'/map-assets/lab/audio/retail.deli-service/',lines:{scene:'scene.mp3',change:'change.mp3',aiView:'aiView.mp3',review:'review.mp3'},variation:{aiView:'variation.mp3',review:null},delay:{change:1.1,review:1.6}},
};
