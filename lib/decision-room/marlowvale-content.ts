/**
 * Marlow Vale: fictional seller dilemmas for the Data#3 Data & AI practice. Revision 1, edited in place
 * before any room ran. Every option names a Data#3 offer, using only names already in customer-facing
 * material; each discussion opens with the customer's view and ends with the table's opening line.
 * This text ships in a public bundle (facilitator notes too): no prices, funding amounts, targets,
 * launch dates, capacity ratings, competitor names or real pursuits.
 */
const DISCUSS_CLOSE = ["What are you giving up by choosing this?", "Say your opening line to the customer out loud."] as const;

export const MARLOWVALE_MODULES = [
  {
    id: "first-move", title: "Ride the momentum, or earn the roadmap?", topic: "The first conversation",
    situation: "The CEO has just seen a Copilot demo and wants a quote for all 900 staff. The CIO says nobody can show what today's licences achieve, and staff-built agents are appearing without oversight. Finance will fund one meaningful AI spend this year. You get one follow-up meeting before the budget closes.",
    question: "What do you bring to the follow-up meeting?",
    options: ["Licences for all staff (Copilot Scale Deployment)", "A pilot for two teams (Copilot Pilot)", "Govern the agents already built (AI Platform & Agent Governance)", "Find and rank the use cases (AI Envisioning: Copilot & Agents)"],
    tradeoffs: ["Captures the budget now; IT's doubts stay open and low use could sour the renewal.", "Produces evidence from real work; most staff wait and the CEO may read it as hesitation.", "Addresses a live risk IT cares about; gives the CEO nothing visible this year.", "Gives both sides one prioritised plan; the budget window may close before anything is bought."],
    discuss: ["Who in that meeting pushes back on your choice, and what would they need to hear?", ...DISCUSS_CLOSE],
    reveal: "Optional probe: the CIO says privately they will block any broad licence purchase until they see a measured result.",
    reconsider: "Is your next commitment to the person with the budget, or the person who can stop it?",
    boundary: "Capture who must commit next, what evidence they need, and what the customer is not buying yet.",
    notes: "Pilots come in Bronze, Silver and Gold; a measured pilot turns the CIO's doubt into evidence. Envisioning suits a customer with more enthusiasm than direction. Microsoft partner funding can help start an Envisioning or a Pilot, but it is a nomination, not an approval: show only the first-milestone amount in the investment summary and never call the work free. The practice sells services with licence pull-through, so no option is off-strategy. Trap: proposing all four at once. Optional probe: the CEO says \"just give me a number\".",
  },
  {
    id: "platform", title: "Move the reports, or rethink the data?", topic: "Data platform",
    situation: "Marlow Vale's Power BI reports must move to Microsoft Fabric before renewal in six months. IT sees a straight migration. The finance director sees a chance to finally trust the numbers: three departments report different rates revenue. The data team is two people, and every option needs their time.",
    question: "What do you put forward first?",
    options: ["Move them fast (Fabric Foundation Rapid)", "Design the target first (Analytics Assessment & Design)", "Build the foundations properly (Data Platform Foundations)", "Start from the AI ideas (AI Envisioning: Azure AI & Fabric)"],
    tradeoffs: ["Meets the renewal date on a standard platform; the conflicting numbers move across unchanged.", "A plan IT and finance can both sign; nothing moves for weeks while the clock runs.", "Trusted data on a governed platform; the biggest commitment, tying up the data team for months.", "Ties the platform to outcomes the executives want; the migration deadline still needs an answer."],
    discuss: ["What does IT need to hear, and what does the finance director need to hear?", ...DISCUSS_CLOSE],
    reveal: "Optional probe: the renewal date moves forward by two months.",
    reconsider: "Is this a migration or a data problem, and who decides?",
    boundary: "Capture what moves, what gets fixed, by when, and who owns the numbers.",
    notes: "Fabric Foundation Rapid comes in tiers (Essentials, Standard, Plus), so \"fast\" still involves a scope choice. Analytics Assessment & Design fits when the real problem is trust in the numbers; Data Platform Foundations when the design is agreed; Envisioning when executives want AI outcomes and the platform is the means. Trap: selling a migration as a data fix, or quoting an indicative range as a price. Optional probe: the finance director offers budget if the rates numbers are fixed first.",
  },
  {
    id: "readiness", title: "Copilot this month, or Copilot safely?", topic: "Readiness and security",
    situation: "Child-protection, planning-dispute and personnel files sit on sites far more people can open than should. The CEO wants Copilot with 100 staff within a month. Targeted controls can protect named sites within weeks, but not the whole estate, and some need entitlements the council may not have.",
    question: "What do you propose before Copilot reaches 100 people?",
    options: ["Assess first, then decide (M365 Copilot Readiness Assessment)", "Protect the riskiest sites, then pilot (Copilot Shield)", "Pilot now with a low-risk team (Copilot Pilot)", "Assess and protect together (Readiness and Shield)"],
    tradeoffs: ["An evidence-based picture of the risk; no protection and no users for weeks.", "Users start with the worst exposure controlled; files outside the protected sites stay exposed.", "Meets the deadline with little exposure; proves little about the teams that matter most.", "Evidence and protection in one push; the largest up-front ask, and still not estate-wide."],
    discuss: ["The CEO fears losing momentum; IT fears a data leak. Which fear does your choice answer?", ...DISCUSS_CLOSE],
    reveal: "Optional probe: the customer asks you to confirm in writing that no extra licensing is needed.",
    reconsider: "What exactly are you willing to promise is protected?",
    boundary: "Capture which content is protected and which is not, who owns the rest, and any licensing the promise depends on.",
    notes: "The Readiness Assessment finds problems and reports oversharing risk; Copilot Shield applies Purview and SharePoint Advanced Management controls to specified sites; a pilot proves value. They are not interchangeable, but assessment and Shield can run side by side. Never call the result \"Copilot ready\". Traps: implying estate-wide remediation, or promising no extra licensing before checking the scope. Optional probe: in week two a pilot user finds a personnel file through Copilot.",
  },
  {
    id: "sponsor", title: "Business champion, or IT gatekeeper?", topic: "Who commits next",
    situation: "The Fabric move is under way. The asset manager wants roads and drainage dashboards before storm season and has budget to spend. IT wants every new request to wait for the platform and its own prioritisation. The asset data sits in three systems of uneven quality. Each side can quietly slow the other.",
    question: "Who do you build the next engagement around?",
    options: ["Build the asset team's dashboards (Data Product Factory)", "Check the asset data first (AI Data Readiness)", "Both teams rank the requests (Use Case Assessment)", "Wait for IT's platform to settle"],
    tradeoffs: ["A working data product every fortnight; IT may refuse to support what it did not prioritise.", "Finds out what the data can and cannot support; storm season arrives before any dashboard.", "Lowers the risk of a later veto; costs both teams' time and reads as delay.", "Keeps IT onside; the budget lapses and the asset manager may find another partner."],
    discuss: ["Who would block your choice, and what would win them over?", ...DISCUSS_CLOSE],
    reveal: "Optional probe: the asset manager's budget lapses if it is not spent this quarter.",
    reconsider: "If the other stakeholder said no next month, would your engagement survive?",
    boundary: "Capture who must commit next, what each stakeholder gets, and what the other is asked to accept.",
    notes: "Data Product Factory suits a business sponsor with a clear need and usable data; AI Data Readiness when nobody knows whether the data can support the use; Use Case Assessment when several sponsors compete for one team. Waiting is a legitimate choice, but name what it costs. The lesson is neither \"always lead with the business\" nor \"always lead with IT\". Trap: promising dashboards before anyone has checked the data. Optional probe: one of the asset systems is one IT says cannot be connected this year.",
  },
  {
    id: "production", title: "Extend the demo, or price production?", topic: "From prototype to production",
    situation: "A prototype agent answering residents' development-application questions impressed the councillors, who want it live next month. Production needs integration with the planning system, governance, testing and a council owner. The specialists who build agents are in demand, and their next opening is unconfirmed. The demo ran on a cleaned copy of the data.",
    question: "What do you put in front of the councillors?",
    options: ["Extend the prototype to staff (Agent Prototyping)", "Build it properly (Iterative Agent Builds)", "The governed platform first (AI Platform & Agent Governance)", "Make it safe first (AI Security & Risk Controls)"],
    tradeoffs: ["Keeps momentum with limited risk; residents get nothing, and \"temporary\" can become permanent.", "The real thing, integrated and governed; costs more and the start date is uncertain.", "A governed base for every agent to come; not the service the councillors asked for.", "Answers the risk question before residents rely on it; nothing goes live and enthusiasm fades."],
    discuss: ["What would make the councillors confident to say yes, and what would make them nervous?", ...DISCUSS_CLOSE],
    reveal: "Optional probe: the planning system's vendor says integration needs their own paid work, available in eight weeks.",
    reconsider: "What date, if any, can you commit to?",
    boundary: "Capture what is promised, by when, what it depends on, and who at the council owns the agent after go-live.",
    notes: "Agent Prototyping proves a use case; Iterative Agent Builds integrate, evaluate and release it; the platform governs every agent that follows; AI Security & Risk Controls give the assurance a public-facing agent needs. A platform is not the resident service, and a prototype on clean data is not production. Ask a build table what start date it can honestly give. Trap: committing specialist time or a launch date you do not control. Optional probe: a councillor asks whether the agent could give a resident wrong planning advice.",
  },
  {
    id: "lifecycle", title: "One phase, or the whole lifecycle?", topic: "After go-live",
    situation: "The resident agent is live and working. The council wants a two-year partner: new agents, help for staff to use them well, and someone to keep it all running. A global integrator is offering a managed programme. The council's team is small, and the board wants one accountable partner. It chooses within a month.",
    question: "What do you propose for the next two years?",
    options: ["Hand over, then build on request (Iterative Agent Builds)", "Adoption and ongoing support (Recurring Support Services)", "An ongoing team (AI Squads)", "Run it for them (AI Managed Service & Support)"],
    tradeoffs: ["Keeps commitments small and clear; the council's stretched team carries the running load.", "Value keeps growing with training and impact reports; each new agent is a separate project.", "Continuity across discovery, build and adoption; depends on team availability and start dates you must confirm.", "One accountable partner, matching the integrator; you take on service levels you must confirm before promising."],
    discuss: ["What does the council fear most about picking a partner, and how does your offer answer it?", ...DISCUSS_CLOSE],
    reveal: "Optional probe: the council asks for service levels in writing.",
    reconsider: "What would you need to confirm before putting this in writing?",
    boundary: "Capture what you would offer, what must be confirmed first, and what you will not put in writing.",
    notes: "Appearing in a customer deck, being deliverable today and being a fully packaged service are three different things. Confirm availability, capacity, start dates and service levels with the practice before positioning AI Squads or the managed service. Recurring Support Services keeps adoption and impact reporting going; AI Operations sets up the council's own run model. Ask a managed-service table what it would put in writing today. Trap: promising team capacity or service levels nobody has confirmed. Optional probe: the council says it would rather wait for Data#3 than sign with the integrator.",
  },
] as const;

export const MARLOWVALE_STORY = "Marlow Vale is a fictional regional council with about 900 staff on Microsoft 365 E5 and Power BI. A handful of people have Copilot licences, and staff have built several agents on their own. The CEO wants AI everywhere by year end; IT wants a roadmap and proof of value first. Budget is tight, and everything you commit to has to be delivered. You are the Data#3 account team: choose which offer to put forward, name what it gives up, and hear why another table chose differently.";
