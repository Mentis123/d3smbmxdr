import type { ReactNode } from 'react';
import './lab.css';
import { HUB_SHARE } from '../../lib/ai-lab/share';

export const metadata={...HUB_SHARE,title:'AI Lab | Data#3'};
export default function Layout({children}:{children:ReactNode}){return <div className="al-shell" lang="en-AU">{children}</div>;}
