"use client";
import {useEffect,useState} from 'react';

/** Typed view over the synced renderer registry (/map-assets/lab/recipes/index.js). One source for the words. */
export type ChapterId='scene'|'change'|'aiView'|'review';
export type LabChapter={id:ChapterId;at:number;caption:string;say:string;sensor?:string;overlay?:{anchor:string;label:string;state:string}};
export type LabRecipe={
 id:string;world:string;featured:boolean;order:number;locationId:string;label:string;
 title:string;benefit:string;limits:string;whereItRuns:[string,string,string];
 provenance:{label:string;url:string;kind:'verified'|'vendor'|'pattern'}[];
 duration:number;chapters:LabChapter[];
 variation?:{id:string;label:string;caption:string};stub?:boolean;
};
export type LabRegistry={RECIPES:Record<string,LabRecipe>;FEATURED:Record<string,LabRecipe[]>;LEGACY_IDS:readonly string[]};
export type RecipeState={chapter:number;chapterId:ChapterId;time:number;duration:number;playing:boolean;variation:string|null;hold:boolean;sensor:boolean;sensorLabel:string|null;ended:boolean};

export const CHAPTER_NAMES:Record<ChapterId,string>={scene:'Scene',change:'Change',aiView:'AI view',review:'Review'};
const REGISTRY_URL='/map-assets/lab/recipes/index.js';
let cached:Promise<LabRegistry>|null=null;

export function loadLabRegistry(){
 // A variable URL plus webpackIgnore keeps the bundler away: the browser loads the synced file the world also reads.
 const url=REGISTRY_URL;
 cached??=import(/* webpackIgnore: true */ url).then(m=>({RECIPES:m.RECIPES,FEATURED:m.FEATURED,LEGACY_IDS:m.LEGACY_IDS}) as LabRegistry).catch(e=>{cached=null;throw e;});
 return cached;
}

export function useLabRegistry(){
 const [registry,setRegistry]=useState<LabRegistry|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let live=true;loadLabRegistry().then(r=>{if(live)setRegistry(r);}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[]);
 return {registry,failed};
}
