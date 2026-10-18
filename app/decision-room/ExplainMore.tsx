"use client";
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import './explain-more.css';

/** Supplemental context only: callers still supply only content authorised for the current view/round. */
export default function ExplainMore({title,children,label='Explain more'}:{title:string;children:ReactNode;label?:string}){
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),titleId=useId();
 useEffect(()=>{if(!open)return;const node=dialog.current;if(!node)return;node.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{node.close();document.body.style.overflow=overflow;};},[open]);
 return <><button type="button" className="dr-explain-button" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}>{label}<span aria-hidden="true">＋</span></button><dialog ref={dialog} className="dr-explain-dialog" aria-labelledby={titleId} onCancel={e=>{e.preventDefault();setOpen(false);}} onClick={e=>{if(e.target===dialog.current)setOpen(false);}}><header className="dr-explain-heading"><h2 id={titleId}>{title}</h2><button type="button" aria-label="Close explanation" onClick={()=>setOpen(false)}>Close ×</button></header><div className="dr-explain-content">{children}</div></dialog></>;
}
