import type { ReactNode } from 'react';
import '../ai-lab/lab.css';

export const metadata = {title: 'AI-ready datacenter | Data#3', description: 'Your journey to AI-ready infrastructure: too hungry, too hot, too heavy. Select a marker in the miniature datacenter to see the reality check behind each.'};
export default function Layout({children}: {children: ReactNode}) { return <div className="al-shell" lang="en-AU">{children}</div>; }
