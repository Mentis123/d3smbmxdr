import { LABS, type LabDefinition, type LabIndustry } from './content';

export type RecipeKind='vision'|'procedure'|'historian';
export type LabRecipe=LabDefinition & {
  id:string;industry:LabIndustry;kind:RecipeKind;question:string;
  inputLabel:string;processingLabel:string;evidenceLabel:string;
  computeNodes:Array<{label:string;detail:string}>;
};
const visionNodes=[{label:'Camera',detail:'Device / observation'},{label:'Site edge',detail:'Proposed local analysis'},{label:'Cloud',detail:'Illustrated status hand-off'}];
export const RECIPES:LabRecipe[]=[
  {...LABS.energy,id:'energy.intake-vision',industry:'energy',kind:'vision',question:'Could a camera help an operator notice debris before it restricts an intake?',inputLabel:'Synthetic illustration',processingLabel:'Scripted output',evidenceLabel:'Illustrative industry adaptation; no deployment claim',computeNodes:visionNodes},
  {...LABS.mining,id:'mining.conveyor-vision',industry:'mining',kind:'vision',question:'Could a camera draw attention to material spilling beside a conveyor?',inputLabel:'Synthetic illustration',processingLabel:'Scripted output',evidenceLabel:'Illustrative industry adaptation; no deployment claim',computeNodes:visionNodes},
  {id:'mining.procedure-control',industry:'mining',kind:'procedure',title:'Is this the approved procedure?',subtitle:'Workshop / document authority',locationId:'mining.workshop',view:'workshop',poster:'/map-assets/mining-poster.jpg',question:'The newest file is a draft. Which revision can the worker rely on?',inputLabel:'Original fictional documents + approval register',processingLabel:'Rules-based example + scripted explanation',evidenceLabel:'Industry-informed proposed workflow; no verified deployment',
    observation:'Two fictional revisions of an equipment-record procedure and a central register show why issue date and approval are different.',
    interpretation:'The register determines approval; an assistant could compare versions or find relevant text, but cannot promote a draft or merge conflicting instructions into authority.',
    compute:'An endpoint could view an authorised cache, while a site or central service checks the controlled register. Retrieval and comparison are proposed architecture; this page executes example rules only.',
    response:'The document controller resolves conflicting records and approves publication. The worker checks the document identifier, revision and applicability before using a controlled instruction.',
    verification:'Compare the selected document with the register entry and source text. An offline cache retains its issue and synchronisation dates; current status cannot be confirmed from the cache alone.',
    benefit:'A referenced document view could reduce time spent searching while making approval gaps visible.',
    limitation:'Permissions, ownership and a reliable register are prerequisites. A fluent answer or newer filename is not approval. These fictional records are not maintenance instructions.',
    computeNodes:[{label:'Worker PC',detail:'Illustrated authorised cache + document view'},{label:'Site service',detail:'Proposed retrieval / comparison'},{label:'Central register',detail:'Illustrated approval authority'}]},
  {id:'mining.historian-gap',industry:'mining',kind:'historian',title:'The historian is silent. Is the plant?',subtitle:'Control room / conveyor telemetry',locationId:'mining.control-room',view:'control',poster:'/map-assets/mining-poster.jpg',question:'The trend has stopped updating. Is the conveyor stopped, or are observations missing?',inputLabel:'Synthetic trend, heartbeat + independent state',processingLabel:'Gap rules + scripted explanation',evidenceLabel:'Industry-informed backlog adaptation; no verified deployment',
    observation:'A fictional conveyor tag is sampled every ten seconds. Compare its trend with a gateway heartbeat and independent machine-state evidence.',
    interpretation:'A freshness rule can detect missing samples without AI. AI could help explain the evidence and suggest checks, but missing readings do not establish an equipment fault.',
    compute:'The proposed site edge checks freshness; an on-premises service could correlate events and explain gaps, with optional cloud reporting. Only deterministic fixture rules and scripted summaries execute here.',
    response:'An OT or data engineer checks the historian, gateway and an independent reading before assigning a cause or repair task. The view does not stop or restart real equipment.',
    verification:'Inspect timestamps and event sources. Recorded zeros with a shutdown event differ from absent samples. Verify any conclusion with an authorised operator and independent site evidence.',
    benefit:'Separating data availability from operating state could prevent a missing trend being mistaken for normal operation or a shutdown.',
    limitation:'Expected sample rates, tag semantics and time synchronisation must be known. Simulated evidence is not a validated diagnostic system; no missing values are filled in as measurements.',
    computeNodes:[{label:'Site edge',detail:'Illustrated timestamp / freshness checks'},{label:'On-premises',detail:'Proposed event correlation + explanation'},{label:'Cloud',detail:'Illustrated reporting only'}]},
];
export const recipesFor=(industry:LabIndustry)=>RECIPES.filter(r=>r.industry===industry);
export const recipeFor=(industry:LabIndustry,id:string|null|undefined)=>recipesFor(industry).find(r=>r.id===id)??recipesFor(industry)[0];
