// AI-ready datacenter world: the words, written once. Source: the "Your journey to AI-ready infrastructure"
// infographic. The 3D world (datacenter-scene.js) reads ids, captions and the journey from here; the d3smbmxdr
// /datacenter side panel imports this file at runtime. No Three.js import. Brief: docs/DATACENTER-DESIGN.md.

export const INTRO = {
  eyebrow: 'YOUR JOURNEY TO AI-READY INFRASTRUCTURE',
  title: 'Before GPUs come power, cooling and structural reality.',
  quote: '“I have ten racks. I should be good, right?”',
  text: 'Walk the journey: three reasons a datacenter is not ready for AI, then what ready looks like.',
};

// The four cards. Text is the infographic's own; "inWorld" says what the visitor is looking at.
export const ITEMS = [
  {id: 'hungry', label: 'Too hungry', kicker: 'Power density shock', color: '#2aa8ff',
    lead: 'Not if those racks were designed for 10 kW and your AI rack needs 250 kW.',
    facts: [{value: '5–20 kW', label: 'Traditional enterprise rack'}, {value: '100–250+ kW', label: 'Modern AI rack'}],
    takeaway: 'AI doesn’t need more racks. It needs more power per rack.',
    inWorld: 'Ten traditional racks with 10 kW gauges beside one AI rack whose gauge fills to 250 kW, on the same scale. Thin, slow feeds against one fat, fast busway.'},
  {id: 'hot', label: 'Too hot', kicker: 'Cooling reality check', color: '#c24dff',
    lead: 'Air cooling hits its limits. High-density AI racks demand liquid-assisted cooling.',
    facts: [{value: 'Limited capacity', label: 'Air cooled'}, {value: 'High capacity', label: 'Liquid cooled'}],
    takeaway: 'If your cooling strategy ends at air, your AI journey may end there too.',
    inWorld: 'The air-cooled rack heats up as hot air pours out of it. The liquid-cooled rack stays calm while coolant circulates through its loop.'},
  {id: 'heavy', label: 'Too heavy', kicker: 'Structural constraints', color: '#22d6e8',
    lead: 'Modern AI racks are heavy. Many facilities weren’t built to handle the load.',
    facts: [{value: '2,000–5,000+ lbs', label: 'Rack weight'}, {value: 'Limits exceeded', label: 'Floor loading'}, {value: 'Path challenges', label: 'Cable & pipe'}],
    takeaway: 'Not every datacenter can physically support modern AI racks.',
    inWorld: 'An AI rack on a raised floor. The tiles under it sag and crack, and the cut-away edge shows cables and pipes crowded underneath.'},
  {id: 'ready', label: 'AI ready', kicker: 'AI ready datacenter', color: '#5dff6a',
    lead: 'Power, cooling and structure ready before the GPUs arrive.',
    checklist: [
      {title: 'High density power', detail: '100–250 kW+ per rack'},
      {title: 'Liquid cooling strategy', detail: 'Built for high performance'},
      {title: 'Structural validation', detail: 'Floors, weight, cabling & more'},
      {title: 'GPU-ready infrastructure', detail: 'Reliable. Scalable. Future-proof.'},
    ],
    takeaway: 'Power. Cooling. Structure.',
    inWorld: 'Rows of AI racks on a slab, fed overhead by power from the substation and a liquid loop to rooftop dry coolers.'},
];

// One guided journey, in the infographic's order. Each step names the view, the card in focus and a caption.
export const STORIES = [
  {id: 'journey', title: 'Walk the journey', summary: 'The question, the three reality checks, then what ready looks like.', steps: [
    {view: 'hungryWide', focus: 'opener', caption: '“I have ten racks. I should be good, right?”'},
    {view: 'hungry', focus: 'hungry', caption: 'Too hungry. Racks designed for 10 kW; an AI rack needs 250 kW. AI needs more power per rack, not more racks.'},
    {view: 'hot', focus: 'hot', caption: 'Too hot. Air cooling hits its limits; high-density AI racks demand liquid-assisted cooling.'},
    {view: 'heavy', focus: 'heavy', caption: 'Too heavy. AI racks weigh 2,000–5,000+ lbs. Floor loading limits and cable and pipe paths get exceeded.'},
    {view: 'ready', focus: 'ready', caption: 'AI ready: high-density power, a liquid cooling strategy, structural validation and GPU-ready infrastructure.'},
    {view: 'hero', focus: 'outcomes', caption: 'Power. Cooling. Structure. The real AI readiness checklist.'},
  ]},
];

export const OUTCOMES = [
  {title: 'Lower deployment risk', text: 'Avoid expensive redesigns, delays and cost overruns.', color: '#9be564'},
  {title: 'Faster time to AI', text: 'Deploy where infrastructure is ready, not where you hope it is.', color: '#c24dff'},
  {title: 'Future ready', text: 'Support next-generation GPU clusters and beyond.', color: '#2aa8ff'},
];

export const TAGLINE = 'Power. Cooling. Structure. The real AI readiness checklist.';
export const DISCLAIMER = 'Illustrative model. The layout is fictional; figures are the infographic’s typical ranges, not measurements of any real facility.';
