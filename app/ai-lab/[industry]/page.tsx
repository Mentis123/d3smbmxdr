import { notFound } from 'next/navigation';
import LabExplorer from '../LabExplorer';
import { LAB_WORLDS, type LabIndustry } from '../../../lib/ai-lab/content';

const isWorld=(id:string):id is LabIndustry=>Object.hasOwn(LAB_WORLDS,id);
export function generateStaticParams(){return Object.keys(LAB_WORLDS).map(industry=>({industry}));}
export function generateMetadata({params}:{params:{industry:string}}){return {title:(isWorld(params.industry)?LAB_WORLDS[params.industry].name:'Not found')+' | AI Lab | Data#3'};}
export default function Page({params}:{params:{industry:string}}){if(!isWorld(params.industry))notFound();return <LabExplorer industry={params.industry}/>;}
