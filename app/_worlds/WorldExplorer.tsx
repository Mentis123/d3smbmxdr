"use client";
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import './world-explorer.css';

// Shared host page for a synced 3D world plus a side panel (/nextdc, /datacenter). The world (iframe) carries pins
// and light; this panel carries the words. Text is read at runtime from the world's own data module
// (/map-assets/<world>-data.js, synced from adamrappaport), so it is written once and both sides agree.
// Messages: world:ready and world:hotspot come in; world:story, world:select and worlds:focus go out.
// Docs: adamrappaport/docs/SHARED-WORLDS.md.

type Status = {label: string; note: string; color: string};
type Fact = {value: string; label: string};
type Check = {title: string; detail: string};
type Item = {
  id: string; label: string; status?: string; color?: string; kicker?: string;
  // Infographic-style cards (datacenter).
  lead?: string; facts?: Fact[]; checklist?: Check[]; takeaway?: string; inWorld?: string;
  // Explainer cards (nextdc).
  what?: string; why?: string; demo?: string; next?: string; vendor?: string;
};
type Step = {view: string; caption: string; focus?: string};
type Story = {id: string; title: string; summary: string; steps: Step[]};
type Intro = {eyebrow: string; title: string; quote?: string; text: string};
type Outcome = {title: string; text: string; color?: string};
type Data = {ITEMS: Item[]; STORIES: Story[]; STATUSES?: Record<string, Status>; INTRO?: Intro; OUTCOMES?: Outcome[]; TAGLINE?: string; DISCLAIMER: string};

export default function WorldExplorer({world, brand, intro}: {world: string; brand: {title: string; small: string}; intro?: Intro}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [story, setStory] = useState<{id: string; step: number} | null>(null);

  useEffect(() => {
    // A variable URL keeps the bundler from resolving it; the browser loads the synced module natively.
    const url = `/map-assets/${world}-data.js`;
    import(/* webpackIgnore: true */ url).then(m => setData(m as Data)).catch(() => setFailed(true));
  }, [world]);

  const send = useCallback((message: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === 'world:ready' && e.data.world === world) setReady(true);
      if (e.data?.type === 'world:hotspot' && e.data.world === world) setSelected(e.data.id);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [world]);

  // Full screen: native where the browser allows it on an element, otherwise a fixed viewport-sized fallback
  // (iPhone Safari). Same iframe either way, so the world never reloads.
  const toggleFull = useCallback(() => {
    if (full) {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      setFull(false);
      return;
    }
    setFull(true);
    try { stage.current?.requestFullscreen?.()?.catch(() => {}); } catch { /* The fallback stays active. */ }
  }, [full]);
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setFull(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    if (full) document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('fullscreenchange', onChange); window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [full]);

  const items = useMemo(() => Object.fromEntries((data?.ITEMS || []).map(i => [i.id, i])), [data]);
  const activeStory = data?.STORIES.find(s => s.id === story?.id) || null;
  const step = activeStory && story ? activeStory.steps[story.step] : null;
  const stepItem = step?.focus ? items[step.focus] : null;
  const item = selected ? items[selected] : null;
  const shownIntro = data?.INTRO || intro;
  const status = (i: Item) => (i.status && data?.STATUSES ? data.STATUSES[i.status] : null);

  const playStep = (id: string, index: number) => {
    setStory({id, step: index});
    setSelected(null);
    send({type: 'world:story', id, step: index});
  };
  const exitStory = () => {
    setStory(null);
    send({type: 'world:story', id: null});
    send({type: 'worlds:focus', view: 'hero'});
  };
  const select = (id: string) => {
    setSelected(id);
    send({type: 'world:select', id});
  };

  return (
    <main className="wx-shell">
      <header className="wx-nav">
        <a className="wx-brand" href="/links"><span>Data<sup>#</sup>3</span><i/><strong>{brand.title}<small>{brand.small}</small></strong></a>
        <a className="wx-back" href="/links">← Site index</a>
      </header>
      <section className="wx-workspace">
        <div className={full ? 'wx-world wx-full' : 'wx-world'} ref={stage}>
          <button type="button" className="wx-full-toggle" onClick={toggleFull} aria-pressed={full}>{full ? 'Exit full screen' : 'Full screen'}</button>
          <iframe ref={frame} title={`${brand.title}: interactive miniature world`} src={`/lab-worlds/${world}.html?embed=1&controls=compact`} allow="fullscreen"/>
          {!ready && <p className="wx-loading" role="status">Preparing the world…</p>}
        </div>
        <aside className="wx-panel" aria-live="polite">
          {failed && <p className="wx-error">The world’s text could not load. Reload the page to try again.</p>}
          {!data && !failed && <p className="wx-muted">Loading…</p>}
          {data && (
            <>
              {step && activeStory && story ? (
                <section className="wx-story" aria-label="Story">
                  <p className="wx-eyebrow">{activeStory.title.toUpperCase()} · STEP {story.step + 1} OF {activeStory.steps.length}</p>
                  <p className="wx-caption">{step.caption}</p>
                  <div className="wx-steps" role="group" aria-label="Story steps">
                    <button type="button" onClick={() => playStep(activeStory.id, story.step - 1)} disabled={story.step === 0}>Back</button>
                    {story.step < activeStory.steps.length - 1
                      ? <button type="button" className="wx-primary" onClick={() => playStep(activeStory.id, story.step + 1)}>Next</button>
                      : <button type="button" className="wx-primary" onClick={exitStory}>Finish</button>}
                  </div>
                  <button type="button" className="wx-text" onClick={exitStory}>Leave this story</button>
                </section>
              ) : item ? null : shownIntro && (
                <section className="wx-intro">
                  <p className="wx-eyebrow">{shownIntro.eyebrow}</p>
                  <h1>{shownIntro.title}</h1>
                  {shownIntro.quote && <p className="wx-quote">{shownIntro.quote}</p>}
                  <p>{shownIntro.text}</p>
                  {data.STORIES[0] && <button type="button" className="wx-primary wx-start" onClick={() => playStep(data.STORIES[0].id, 0)}>{data.STORIES[0].title}</button>}
                </section>
              )}
              {/* During a story, the step's card (or the outcomes) sits under the caption. The opener's caption is the quote itself. */}
              {step && stepItem && <ItemCard item={stepItem} status={status(stepItem)}/>}
              {/* The last step's caption is the tagline, so the outcomes there omit it. */}
              {step?.focus === 'outcomes' && data.OUTCOMES && <Outcomes outcomes={data.OUTCOMES}/>}
              {item && <ItemCard item={item} status={status(item)} onClose={() => setSelected(null)}/>}

              {data.STORIES.length > 1 && (
                <section aria-label="Stories">
                  <p className="wx-eyebrow">STORIES</p>
                  <div className="wx-stories">
                    {data.STORIES.map(s => (
                      <button type="button" key={s.id} aria-pressed={story?.id === s.id} onClick={() => playStep(s.id, 0)}>
                        <strong>{s.title}</strong><small>{s.summary}</small>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section aria-label="Places">
                <p className="wx-eyebrow">{data.STATUSES ? 'PLACES' : 'THE CHECKS'}</p>
                <div className="wx-chips">
                  {data.ITEMS.map(i => (
                    <button type="button" key={i.id} aria-pressed={selected === i.id} onClick={() => select(i.id)} style={{['--c' as string]: status(i)?.color || i.color || '#78dcff'}}>
                      {i.label}
                    </button>
                  ))}
                </div>
              </section>

              {data.OUTCOMES && step?.focus !== 'outcomes' && <Outcomes outcomes={data.OUTCOMES} tagline={data.TAGLINE}/>}

              {data.STATUSES && (
                <section aria-label="Status labels" className="wx-legend">
                  <p className="wx-eyebrow">STATUS LABELS</p>
                  <ul>
                    {Object.entries(data.STATUSES).map(([key, s]) => (
                      <li key={key}><span className="wx-badge" style={{['--c' as string]: s.color}}>{s.label}</span>{s.note}</li>
                    ))}
                  </ul>
                </section>
              )}
              <p className="wx-disclaimer">{data.DISCLAIMER}</p>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

function ItemCard({item, status, onClose}: {item: Item; status: Status | null; onClose?: () => void}) {
  const accent = status?.color || item.color || '#78dcff';
  return (
    <section className="wx-item" aria-label={item.label} style={{['--c' as string]: accent}}>
      <div className="wx-item-head">
        {status ? <span className="wx-badge" style={{['--c' as string]: status.color}}>{status.label}</span> : <span className="wx-kicker">{item.kicker}</span>}
        {onClose && <button type="button" className="wx-close" onClick={onClose} aria-label="Close details">×</button>}
      </div>
      <h2>{item.label}</h2>
      {item.lead && <p className="wx-lead">{item.lead}</p>}
      {item.facts && (
        <dl className="wx-facts">
          {item.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
      )}
      {item.checklist && (
        <ul className="wx-checklist">
          {item.checklist.map(c => <li key={c.title}><strong>{c.title}</strong><span>{c.detail}</span></li>)}
        </ul>
      )}
      {item.takeaway && <p className="wx-takeaway">{item.takeaway}</p>}
      {item.what && (
        <dl className="wx-explain">
          <dt>What it is</dt><dd>{item.what}</dd>
          <dt>Why it matters</dt><dd>{item.why}</dd>
          <dt>What we could demonstrate</dt><dd>{item.demo}</dd>
          <dt>Next step</dt><dd>{item.next}</dd>
        </dl>
      )}
      {item.inWorld && <p className="wx-inworld"><b>In the world</b>{item.inWorld}</p>}
      {item.vendor && (
        <details className="wx-vendor">
          <summary>Partner and equipment</summary>
          <p>{item.vendor}</p>
        </details>
      )}
    </section>
  );
}

function Outcomes({outcomes, tagline}: {outcomes: Outcome[]; tagline?: string}) {
  return (
    <section aria-label="Outcomes" className="wx-outcomes">
      <p className="wx-eyebrow">WHY IT MATTERS</p>
      <ul>
        {outcomes.map(o => <li key={o.title} style={{['--c' as string]: o.color || '#78dcff'}}><strong>{o.title}</strong><span>{o.text}</span></li>)}
      </ul>
      {tagline && <p className="wx-tagline">{tagline}</p>}
    </section>
  );
}
