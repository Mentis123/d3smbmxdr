// E1. Pure data: read by the renderer and (via sync) by the Data#3 host.
export default {
  id:'energy.intake-vision',world:'energy',featured:true,order:1,
  locationId:'energy.dam.intake',label:'Intake debris',view:'intake',anchor:[-4.4,1.8,-1.02],
  title:'Keep the water moving',
  benefit:'Maintenance hears about debris on the intake bars while it is still small.',
  limits:'The camera sees the surface and the bars above it; glare, night and murky water hide debris, so a person always checks.',
  whereItRuns:['Intake camera','Site GPU','Maintenance'],
  provenance:[
    {label:'Pattern: region and persistence rules on video analytics (NVIDIA DeepStream nvdsanalytics)',url:'https://docs.nvidia.com/metropolis/deepstream/8.0/text/DS_plugin_gst-nvdsanalytics.html',kind:'pattern'},
    {label:'Pattern: promptable video segmentation for the mask (Meta SAM 2)',url:'https://ai.meta.com/research/sam2/',kind:'pattern'},
    {label:'Local GPU inference on site: the pattern Coles uses in store (retail, not hydro)',url:'https://news.microsoft.com/source/asia/features/coles-deepens-its-relationship-with-shoppers-using-ai-to-understand-the-customer-experience-and-improve-efficiency-in-store/',kind:'verified'},
  ],
  duration:26,
  chapters:[
    {id:'scene',at:0,caption:'Water flows through the intake bars to the turbines',
      say:'This is the intake at the dam. Steel bars stop debris before the water reaches the turbines. Leaves drift through; flow is steady. Nothing needs doing.'},
    {id:'change',at:4,caption:'A branch catches and debris starts gathering on the bars',
      camera:{angle:.3,elevation:.5,distance:3.2,target:[.15,1.05,-.25],portrait:{angle:.22,elevation:.5,distance:5.4,target:[-.38,1.3,-.3]}},
      say:'One branch catches across the bars and more debris gathers behind it. Water still finds a way round, so flow looks normal for now. Left alone, a mat like this cuts flow and loads the rack.'},
    {id:'aiView',at:10,caption:'The intake camera sees debris staying on the bars',sensor:'intake-cam',
      overlay:{anchor:'debris',label:'Debris on bars',state:'review'},
      say:'The camera on the wall watches the rack all day. The site GPU outlines the debris, and a rule flags it only because it stayed and grew, not because one twig drifted past. The video stays on site.'},
    {id:'review',at:16.5,caption:'Maintenance inspects the rack at intake 2',
      camera:{angle:.36,elevation:.36,distance:7.0,target:[-.05,1.8,-.35],portrait:{angle:-.45,elevation:.42,distance:9.5,target:[-.1,1.7,-.3]}},
      overlay:{anchor:'debris',label:'Inspect intake 2',state:'review'},
      say:'The finding reaches maintenance as "build-up at intake 2". Someone walks out on the deck, looks, and decides whether to rake the bars. AI noticed early; people decide.'},
  ],
  variation:{id:'glare',label:'Glare',caption:'View unclear · another look needed',overlay:{anchor:'debris',label:'View unclear',state:'unclear'}},
  // Narration (owner's ElevenLabs file, 23 Oct 2026). With the variation on, its clip plays at the AI view and the review stays silent.
  narration:{base:'/map-assets/lab/audio/energy.intake-vision/',lines:{scene:'scene.mp3',change:'change.mp3',aiView:'aiView.mp3',review:'review.mp3'},variation:{aiView:'variation.mp3',review:null},delay:{change:1.6}},
};
