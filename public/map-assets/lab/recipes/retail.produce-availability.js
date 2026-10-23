// R3. Pure data: read by the renderer and (via sync) by the Data#3 host.
export default {
  id:'retail.produce-availability',world:'retail',featured:true,order:3,
  locationId:'retail.produce.display',label:'Produce display',view:'display',anchor:[4.5,.85,2.4],
  title:'Keep produce available',
  benefit:'Colleagues refill the crate that is running low, not every crate on the round.',
  limits:'The camera sees how full a crate looks from above, not how much is in the stockroom or whether the produce is fresh. A hand, a shopper or a trolley can hide the crate, and then it waits for a clear view.',
  whereItRuns:['Display camera','Store GPU','Colleague'],
  provenance:[
    {label:'Verified category: computer vision monitoring fresh-produce stock levels, Coles Group media release (30 October 2025)',url:'https://www.colesgroup.com.au/FormBuilder/_Resource/_module/ZD2n6-Cs4kiufz91cjPU3Q/301025_Media_Release_Coles_accelerates_AI_adoption_in_retail_with_OpenAI.pdf',kind:'verified'},
    {label:'Pattern: region-of-interest rules on video analytics (NVIDIA DeepStream nvdsanalytics)',url:'https://docs.nvidia.com/metropolis/deepstream/8.0/text/DS_plugin_gst-nvdsanalytics.html',kind:'pattern'},
  ],
  duration:28,
  chapters:[
    {id:'scene',at:0,caption:'The produce display starts the morning well stocked',
      camera:{angle:.55,elevation:.42,distance:8.0,target:[.2,.45,.1],portrait:{angle:.45,elevation:.5,distance:10.0,target:[-.5,.8,.1]}},
      say:'This is the fresh-produce display in a fictional store: bananas, apples and lemons. Every crate is full and a shopper is on the way in. Nothing needs doing.'},
    {id:'change',at:4,caption:'Over the morning the middle crate runs low',
      camera:{angle:.5,elevation:.58,distance:2.7,target:[-.55,1.0,-.2],portrait:{angle:.85,elevation:.55,distance:3.7,target:[-.75,1.0,0]}},
      say:'Watch the clock: this is a few hours squeezed into a few seconds. Shoppers keep taking apples, so the middle crate empties while the crates either side stay full.'},
    {id:'aiView',at:10,caption:'The display camera sees the apple crate running low',sensor:'display-cam',
      overlay:{anchor:'crate',label:'Check display',state:'review'},
      say:'The camera on the mast looks down at the crates. The store GPU judges how full each crate looks, and a fullness rule flags this one for a colleague. It does not know what is in the stockroom.'},
    {id:'review',at:16,caption:'A colleague checks stock and refills the crate',
      camera:{angle:-.16,elevation:.42,distance:6.4,target:[.05,1.0,-.25],ease:1.5,portrait:{angle:-.45,elevation:.55,distance:8.4,target:[.35,.95,-.3]}},
      overlay:{anchor:'crate',label:'Colleague refills',state:'noticed'},
      say:'The finding goes from the store GPU to the colleague\'s handheld. In the stockroom doorway the colleague checks the stock record, pushes the trolley out and refills the crate. The camera pointed at the gap; the colleague decided what to do about it.'},
  ],
  variation:{id:'hand-over',label:'Hand over the crate',caption:'View blocked · no finding until the view clears',overlay:{anchor:'crate',label:'View blocked',state:'unclear'}},
  // Narration (owner's ElevenLabs file, 23 Oct 2026). Delays land each line on its on-screen event; with the variation on, its clip plays at the AI view and the review stays silent.
  narration:{base:'/map-assets/lab/audio/retail.produce-availability/',lines:{scene:'scene.mp3',change:'change.mp3',aiView:'aiView.mp3',review:'review.mp3'},variation:{aiView:'variation.mp3',review:null},delay:{change:1.0,review:2.0}},
};
