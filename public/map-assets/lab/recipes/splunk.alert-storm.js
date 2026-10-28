// S2. Pure data: read by the renderer and (via sync) by the Data#3 host. Chosen by the owner (28 Oct 2026) as the most
// visual of three ideas: seeing forty alerts collapse into one cause. Claims checked 28 Oct 2026 against Splunk's own
// wording: Event iQ is "AI-powered alert correlation" (cross-field, topology-aware and fuzzy matching; machine learning
// picks the fields), and Diagnose uses a large language model for the summary, likely root cause and confidence-scored
// next step. Not "machine learning clustering". Sites, counts and times are illustrative.
export default {
  id:'splunk.alert-storm', world:'splunk', featured:true, order:2,
  locationId:'splunk.campus.core', label:'Alert storm', view:'core', anchor:[-3.5,2.6,1.0],
  title:'Forty alerts, one cause',
  benefit:'When one switch fails and forty alerts fire, Splunk shows the team one problem with its likely cause, so they fix the switch instead of chasing forty tickets.',
  limits:'Illustrative: the sites, counts and times are made up. Event iQ groups alerts by matching their fields, the network’s topology and near-matches, and its summary is written by a large language model; it suggests a cause and a next step with a confidence level, and people decide. It groups only what the alerts and topology data connect, so a real second problem stays its own episode.',
  whereItRuns:['Network devices','Splunk ITSI · Event iQ','Network team'],
  provenance:[
    {label:'Splunk ITSI 5.0: Event iQ, “an AI powered alert correlation engine that groups related alerts into episodes using cross field matching, topology awareness, and fuzzy matching”; Diagnose “uses a large language model” for the summary, likely root cause and confidence-scored next steps (GA 30 June 2026)',url:'https://www.splunk.com/en_us/blog/observability/introducing-splunk-it-service-intelligence-5-0.html',kind:'vendor'},
    {label:'Splunk ITSI docs: investigating an episode, with its AI summary, suspected root cause and next steps',url:'https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/detect-and-act-on-notable-events/5.0/episode-review/investigate-episodes-in-itsi',kind:'verified'},
    {label:'Splunk at .conf26 (Sept 2026): ITSI 5.0 and Event iQ generally available; Event iQ Detect uses machine learning to pick the fields for correlation',url:'https://www.splunk.com/en_us/blog/observability/splunk-observability-at-conf26-optimize-ai-at-scale.html',kind:'vendor'},
    {label:'Data#3 and Splunk: Premier partner',url:'https://www.data3.com/partners/splunk/',kind:'vendor'},
  ],
  duration:32,
  chapters:[
    {id:'scene',at:0,label:'All quiet',caption:'One campus core switch carries every building’s traffic',
      say:'What: the campus, its core switch pair, both data centres and the SaaS apps, all streaming into Splunk. So what: everything the campus does runs through Core A. Now what: watch what happens when it stops.'},
    {id:'change',at:6,label:'The storm',caption:'Core A fails. Forty alerts fire across nine systems',
      camera:{angle:.12,elevation:.62,distance:6.6,target:[-.6,.38,.2],portrait:{angle:.08,elevation:.7,distance:9.6,target:[-.8,.42,.3]}},
      overlay:{anchor:'noc',label:'40 alerts · 9 systems',state:'noticed'},
      say:'What: the core switch loses power. Every building’s switch, the ThousandEyes agent, the load balancers, SAP in both data centres and the SaaS tests all raise alerts. Forty of them reach the network team in a minute and a half. So what: forty alerts look like forty problems. Now what: see what Splunk makes of them.'},
    {id:'aiView',at:13,label:'One episode',caption:'Event iQ pulls all forty into one episode at Core A',sensor:'splunk-view',
      overlay:{anchor:'coreA',label:'Likely cause · Core A',state:'noticed'},
      say:'What: this is Splunk’s view. Event iQ matches the alerts’ fields and the network’s topology, traces them back along the links, and groups all forty into one episode. Its summary names the likely root cause, Core A, and suggests a next step with a confidence level. So what: one problem, one owner, one fix. Now what: the team decides.'},
    {id:'review',at:21,label:'Fixed once',caption:'Uplinks move to Core B. One fix clears all forty',
      camera:{angle:-.28,elevation:.42,distance:4.1,target:[-1.15,.3,.75],ease:1.6,portrait:{angle:-.25,elevation:.5,distance:6.4,target:[-1.2,.35,.8]}},
      overlay:{anchor:'coreB',label:'Campus on Core B',state:'neutral'},
      say:'What: the team approves. The campus uplinks move to Core B, the buildings come back and the forty alerts clear together. So what: the team fixed one switch instead of working forty tickets. Now what: the failed power supply on Core A gets replaced in hours, not in the middle of a firefight.'},
  ],
  variation:{id:'two-causes',label:'Two causes',caption:'Two causes, two episodes: Bayside stays separate',
    captions:{review:'Campus fixed. Bayside is its own ticket'},
    overlay:{anchor:'bayside',label:'Separate episode',state:'unclear'}},
};
