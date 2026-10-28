// S1. Pure data: read by the renderer and (via sync) by the Data#3 host. The storyline is the owner's (28 Oct 2026):
// Splunk monitors campus -> data centre -> SaaS via ThousandEyes; at 10:00 it alerts that the South data centre's SAP
// instance is trending to 80 % by 10:30 and an outage at 11:00; the AI agent finds a North/South imbalance and asks to
// redirect a smaller site to the North data centre with the load balancers; the network team approves and utilisation
// returns to normal before the outage. Sites, numbers and the compressed clock are illustrative, said so in limits.
export default {
  id:'splunk.sap-forecast', world:'splunk', featured:true, order:1,
  locationId:'splunk.dc-south.sap', label:'SAP forecast', view:'sap', anchor:[5.6,4.7,-4.5],
  title:'The outage that never happened',
  benefit:'Splunk sees the SAP slowdown coming an hour out, its AI agent finds the cause and asks first, and the team fixes it with one approved change.',
  limits:'Illustrative: the sites, the numbers and the compressed clock are made up for the demonstration. ITSI Predictive Analytics forecasts a service’s health 30 minutes ahead from KPIs it has been trained on; the 11:00 outage is that trend carried forward. The agent explains and proposes; nothing moves until a person approves, and the change runs through the load balancers’ own change process. Agent workspaces in Splunk (AI Canvas, Agent Builder) were in alpha in October 2026.',
  whereItRuns:['ThousandEyes agents','Splunk ITSI','Network team'],
  provenance:[
    {label:'Splunk ITSI docs: Predictive Analytics forecasts a service’s health score 30 minutes ahead and lists the top five KPIs likely driving it',url:'https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/visualize-and-assess-service-health/5.0/predictive-analytics/use-the-predictive-analytics-dashboard-in-itsi',kind:'verified'},
    {label:'Cisco ThousandEyes App for Splunk: streaming test data, event detection and activity logs into Splunk',url:'https://www.thousandeyes.com/product/innovations/cisco-thousandeyes-app-for-splunk',kind:'vendor'},
    {label:'Splunk ITSI 5.0: Event iQ groups alerts into episodes and summarises the likely root cause and next steps',url:'https://www.splunk.com/en_us/blog/observability/introducing-splunk-it-service-intelligence-5-0.html',kind:'vendor'},
    {label:'Cisco newsroom, Splunk .conf26 (Sept 2026): AI agents in Splunk, with AI Canvas and Agent Builder in alpha',url:'https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m09/cisco-delivers-trusted-ai-at-scale-through-new-splunk-advancements.html',kind:'press'},
    {label:'Data#3 and Splunk: Premier partner',url:'https://www.data3.com/partners/splunk/',kind:'vendor'},
  ],
  duration:33.5,
  chapters:[
    {id:'scene',at:0,label:'Watching everything',caption:'Splunk watches campus, data centres and SaaS through ThousandEyes',
      say:'What: one view of the whole network. The campus and two branch sites at the front, the North and South data centres at the back, the SaaS apps in the cloud. ThousandEyes agents test every path, and every device streams into Splunk. So what: the network team is not stitching together five consoles. Now what: watch the clock reach ten.'},
    {id:'change',at:7.5,label:'10:00 alert',caption:'10:00: SAP South is forecast to hit 80% by 10:30',
      camera:{angle:.38,elevation:.3,distance:4.4,target:[1.55,.78,-1.25],portrait:{angle:.3,elevation:.34,distance:7.4,target:[1.3,.85,-1.3]}},
      overlay:{anchor:'southSap',label:'SAP South · 80% by 10:30',state:'noticed'},
      say:'What: at ten o’clock Splunk alerts the network team. The SAP instance in the South data centre is trending to hit its 80 percent threshold by 10:30, and on that path it goes down at eleven. So what: nothing is broken yet. This is a warning an hour ahead, not a page at the moment it fails. Now what: ask why.'},
    {id:'aiView',at:14.5,label:'The agent asks',caption:'The agent finds a North/South imbalance and asks to move Riverside',sensor:'splunk-view',
      overlay:{anchor:'riverside',label:'Move Riverside north?',state:'noticed'},
      say:'What: this is Splunk’s view. The buildings fade and the data stays. The AI agent works out the cause: South is carrying the campus and the Riverside site, North is half idle. It proposes redirecting Riverside, the smaller site, to the North data centre with the load balancers, and asks the team. So what: a cause and a fix in one message, and nothing changes until someone says yes. Now what: the team decides.'},
    {id:'review',at:22.5,label:'Approved',caption:'The team approves. Utilisation settles long before 11:00',
      camera:{angle:.42,elevation:.52,distance:7.2,target:[.25,.55,-.25],ease:1.6,portrait:{angle:.3,elevation:.6,distance:11.5,target:[1.0,.6,-.4]}},
      overlay:{anchor:'southGauge',label:'South back under 80%',state:'neutral'},
      say:'What: the network team approves. The load balancers send Riverside north, South drops back to around sixty percent and North picks up the difference. Eleven o’clock comes and goes. So what: the outage never happens, and no user ever knew it was coming. Now what: the same pattern works for any service Splunk can forecast.'},
  ],
  variation:{id:'north-busy',label:'North busy too',caption:'Both data centres are busy. No safe move to suggest',
    captions:{review:'The agent escalates. The on-call team decides'},
    overlay:{anchor:'northGauge',label:'No safe move',state:'unclear'}},
  // Narration (owner's ElevenLabs file, 28 Oct 2026, cut at its pauses). The scene line runs 7.4 s, so the chapters start
  // 1.5 s later than first built. Delays land "Ten o'clock" just before the alert, "The team says yes" on the approval and
  // "No outage" on the 11:00 card; with the variation on, its clip plays at the AI view and the review stays silent.
  narration:{base:'/map-assets/lab/audio/splunk.sap-forecast/',lines:{scene:'scene.mp3',change:'change.mp3',aiView:'aiView.mp3',review:'review.mp3'},variation:{aiView:'variation.mp3',review:null},delay:{scene:0,change:1.3,aiView:.8,review:1.4}},
};
