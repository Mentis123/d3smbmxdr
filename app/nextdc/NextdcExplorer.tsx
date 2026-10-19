"use client";
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

// Host page for the shared NEXTDC world. The world (iframe) carries pins and light; this panel carries the words.
// The text, statuses and stories are read at runtime from the same module the world uses (/map-assets/nextdc-data.js,
// synced from adamrappaport), so they are written once. Messages: world:ready and world:hotspot come in;
// world:story, world:select and worlds:focus go out. Brief: adamrappaport/docs/NEXTDC-DESIGN.md.

type Status = {label: string; note: string; color: string};
type Item = {id: string; label: string; scope: 'far' | 'near'; status: string; what: string; why: string; demo: string; next: string; vendor?: string};
type Step = {view: string; caption: string; state: Record<string, unknown>};
type Story = {id: string; title: string; summary: string; steps: Step[]};
type Data = {STATUSES: Record<string, Status>; ITEMS: Item[]; STORIES: Story[]; DISCLAIMER: string};

const DATA_URL = '/map-assets/nextdc-data.js';
const WORLD_URL = '/lab-worlds/nextdc.html?embed=1&controls=compact';

export default function NextdcExplorer() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [story, setStory] = useState<{id: string; step: number} | null>(null);

  useEffect(() => {
    // A variable URL keeps the bundler from resolving it; the browser loads the synced module natively.
    const url = DATA_URL;
    import(/* webpackIgnore: true */ url).then(m => setData(m as Data)).catch(() => setFailed(true));
  }, []);

  const send = useCallback((message: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === 'world:ready' && e.data.world === 'nextdc') setReady(true);
      if (e.data?.type === 'world:hotspot' && e.data.world === 'nextdc') setSelected(e.data.id);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const items = useMemo(() => Object.fromEntries((data?.ITEMS || []).map(i => [i.id, i])), [data]);
  const activeStory = data?.STORIES.find(s => s.id === story?.id) || null;
  const step = activeStory && story ? activeStory.steps[story.step] : null;
  const item = selected ? items[selected] : null;

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
    <main className="ndc-shell">
      <header className="ndc-nav">
        <a className="ndc-brand" href="/links"><span>Data<sup>#</sup>3</span><i/><strong>Showcase concept<small>ONE CONNECTED DATACENTRE</small></strong></a>
        <a className="ndc-back" href="/links">← Site index</a>
      </header>
      <section className="ndc-workspace">
        <div className="ndc-world">
          <iframe ref={frame} title="Interactive miniature datacentre world" src={WORLD_URL} allow="fullscreen"/>
          {!ready && <p className="ndc-loading" role="status">Preparing the world…</p>}
        </div>
        <aside className="ndc-panel" aria-live="polite">
          {failed && <p className="ndc-error">The world's text could not load. Reload the page to try again.</p>}
          {!data && !failed && <p className="ndc-muted">Loading…</p>}
          {data && (
            <>
              {step && activeStory && story ? (
                <section className="ndc-story" aria-label="Story">
                  <p className="ndc-eyebrow">STORY · STEP {story.step + 1} OF {activeStory.steps.length}</p>
                  <h2>{activeStory.title}</h2>
                  <p className="ndc-caption">{step.caption}</p>
                  <div className="ndc-steps" role="group" aria-label="Story steps">
                    <button type="button" onClick={() => playStep(activeStory.id, story.step - 1)} disabled={story.step === 0}>Back</button>
                    {story.step < activeStory.steps.length - 1
                      ? <button type="button" className="ndc-primary" onClick={() => playStep(activeStory.id, story.step + 1)}>Next</button>
                      : <button type="button" className="ndc-primary" onClick={exitStory}>Finish</button>}
                  </div>
                  <button type="button" className="ndc-text" onClick={exitStory}>Leave this story</button>
                </section>
              ) : item ? (
                <ItemCard item={item} status={data.STATUSES[item.status]} onClose={() => setSelected(null)}/>
              ) : (
                <section className="ndc-intro">
                  <p className="ndc-eyebrow">OUTSIDE → INSIDE → CONNECTED</p>
                  <h1>One connected datacentre world.</h1>
                  <p>Explore the facility, fly into the Data#3 showcase cage, then follow a workload through it. Tap a pin in the world, or choose a story.</p>
                </section>
              )}
              {step && item && <ItemCard item={item} status={data.STATUSES[item.status]} onClose={() => setSelected(null)}/>}

              <section aria-label="Stories">
                <p className="ndc-eyebrow">STORIES</p>
                <div className="ndc-stories">
                  {data.STORIES.map(s => (
                    <button type="button" key={s.id} aria-pressed={story?.id === s.id} onClick={() => playStep(s.id, 0)}>
                      <strong>{s.title}</strong><small>{s.summary}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section aria-label="Places">
                <p className="ndc-eyebrow">PLACES</p>
                <div className="ndc-chips">
                  {data.ITEMS.map(i => (
                    <button type="button" key={i.id} aria-pressed={selected === i.id} onClick={() => select(i.id)} style={{['--c' as string]: data.STATUSES[i.status].color}}>
                      {i.label}
                    </button>
                  ))}
                </div>
              </section>

              <section aria-label="Status labels" className="ndc-legend">
                <p className="ndc-eyebrow">STATUS LABELS</p>
                <ul>
                  {Object.entries(data.STATUSES).map(([key, s]) => (
                    <li key={key}><span className="ndc-badge" style={{['--c' as string]: s.color}}>{s.label}</span>{s.note}</li>
                  ))}
                </ul>
              </section>
              <p className="ndc-disclaimer">{data.DISCLAIMER}</p>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

function ItemCard({item, status, onClose}: {item: Item; status: Status; onClose: () => void}) {
  return (
    <section className="ndc-item" aria-label={item.label}>
      <div className="ndc-item-head">
        <span className="ndc-badge" style={{['--c' as string]: status.color}}>{status.label}</span>
        <button type="button" className="ndc-close" onClick={onClose} aria-label="Close details">×</button>
      </div>
      <h2>{item.label}</h2>
      <dl>
        <dt>What it is</dt><dd>{item.what}</dd>
        <dt>Why it matters</dt><dd>{item.why}</dd>
        <dt>What we could demonstrate</dt><dd>{item.demo}</dd>
        <dt>Next step</dt><dd>{item.next}</dd>
      </dl>
      {item.vendor && (
        <details className="ndc-vendor">
          <summary>Equipment details</summary>
          <p>{item.vendor}</p>
        </details>
      )}
    </section>
  );
}
