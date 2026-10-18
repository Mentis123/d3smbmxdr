import { notFound } from 'next/navigation';
import LabExplorer from '../LabExplorer';

export function generateStaticParams(){return [{industry:'energy'},{industry:'mining'}];}
export function generateMetadata({params}:{params:{industry:string}}){return {title:(params.industry==='energy'?'Water and energy':params.industry==='mining'?'Mining operations':'Not found')+' | AI Lab | Data#3'};}
export default function Page({params}:{params:{industry:string}}){if(params.industry!=='energy'&&params.industry!=='mining')notFound();return <LabExplorer industry={params.industry}/>;}
