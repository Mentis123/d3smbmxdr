'use client'
import { useState, useEffect } from 'react'

// Schnell Master Prompt Template
// Style Lock + Swap Zone + Consistency Rules + Negative Prompt

const STYLE_LOCK = `STYLE LOCK (DO NOT CHANGE): Clean modern enterprise cybersecurity illustration, minimal and consistent product-visual system. Flat + subtle 3D hybrid (soft depth, no heavy realism), smooth gradients, crisp edges, high legibility, uncluttered. Dark-mode UI feel with restrained palette: deep navy/charcoal background, accents in teal/cyan and a small amount of violet. Soft diffused lighting, gentle glow, no harsh bloom. Composition: centered hero object + 2–4 supporting elements, lots of negative space, balanced symmetry. Perspective: slight isometric or straight-on, not wide-angle. High-end SaaS branding aesthetic, calm and trustworthy. No visual noise, no busy patterns, no grunge, no photoreal faces. Quality: sharp, clean, consistent line weight, vector-like clarity, studio polish.`

const CONSISTENCY_RULES = `CONSISTENCY RULES (KEEP): Same background tone and palette, same lighting softness, same minimal element count. No extra objects beyond the ones listed. No messy data streams; if data is shown, use simple clean lines and neat nodes. If people appear: silhouettes only, no faces, no crowds.`

const NEGATIVE_PROMPT = `NEGATIVE PROMPT: photorealistic, overly detailed, cluttered, noisy texture, grunge, glitch chaos, neon overload, lens flare, strong bloom, busy background, lots of text, tiny unreadable text, watermark, logo, brand names, distorted UI text, creepy faces, extra fingers, low-res, blur, jpeg artifacts`

const DEFAULT_SWAP_ZONES = {
  agent: {
    goal: "Introduce the AI security assistant as a trustworthy digital guide",
    hero: "Abstract humanoid avatar with shield integrated into chest, gender-neutral silhouette",
    supporting: "Small shield badge, subtle data nodes, protective aura ring",
    industry: "None - universal",
    emotion: "CALM / TRUSTWORTHY",
    text: ""
  },
  healthcare: {
    goal: "Show healthcare data is protected by enterprise security",
    hero: "Medical cross symbol enclosed in translucent shield",
    supporting: "Patient record card, secure database icon, compliance checkmark",
    industry: "Hospital cross, heartbeat line accent",
    emotion: "CALM / CONFIDENT",
    text: ""
  },
  accounting: {
    goal: "Communicate financial data security and compliance",
    hero: "Secure vault door with digital lock interface",
    supporting: "Financial document stack, currency symbol, audit badge",
    industry: "Finance chart subtle in background, calculator outline",
    emotion: "CONFIDENT",
    text: ""
  },
  manufacturing: {
    goal: "Illustrate industrial operations protected from cyber threats",
    hero: "Factory control panel with protective shield overlay",
    supporting: "Endpoint device, secure network node, threat radar",
    industry: "Factory gear outline, production line silhouette",
    emotion: "CONFIDENT / URGENT-BUT-CONTROLLED",
    text: ""
  },
  retail: {
    goal: "Show retail transactions and customer data are secure",
    hero: "POS terminal with shield protection barrier",
    supporting: "Payment card secure, customer data lock, receipt with checkmark",
    industry: "Retail tag, shopping bag outline, barcode element",
    emotion: "CALM / CONFIDENT",
    text: ""
  },
  compliance: {
    goal: "Demonstrate third-party compliance and certification readiness",
    hero: "Certification badge with checkmark and shield",
    supporting: "Compliance document, verification seal, audit timeline",
    industry: "Generic - applies to all",
    emotion: "CONFIDENT",
    text: ""
  },
  visibility: {
    goal: "Show comprehensive threat visibility and monitoring capability",
    hero: "Security dashboard with threat radar and status indicators",
    supporting: "Alert badge, timeline graph, magnifier over network",
    industry: "None - SOC aesthetic",
    emotion: "CALM / URGENT-BUT-CONTROLLED",
    text: ""
  },
  recommendation: {
    goal: "Present MXDR as the comprehensive managed security solution",
    hero: "Business building silhouette with encompassing 24/7 shield dome",
    supporting: "Clock/24-7 indicator, expert team silhouette, threat blocked icon",
    industry: "None - universal business",
    emotion: "CONFIDENT / CALM",
    text: "MXDR"
  }
}

const ZONE_LABELS = {
  agent: '🤖 Agent',
  healthcare: '🏥 Health',
  accounting: '📊 Finance',
  manufacturing: '🏭 Mfg',
  retail: '🛒 Retail',
  compliance: '✅ Comply',
  visibility: '👁️ Visibility',
  recommendation: '🛡️ MXDR'
}

export default function TestImage() {
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const [selectedKey, setSelectedKey] = useState('agent')
  const [swapZones, setSwapZones] = useState(DEFAULT_SWAP_ZONES)
  const [provider, setProvider] = useState(null)
  const [genTime, setGenTime] = useState(null)
  const [history, setHistory] = useState([])
  const [showLocked, setShowLocked] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('mxdr-schnell-v3')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.swapZones) setSwapZones({ ...DEFAULT_SWAP_ZONES, ...data.swapZones })
      } catch (e) {}
    }
  }, [])

  const saveAll = () => {
    localStorage.setItem('mxdr-schnell-v3', JSON.stringify({ swapZones }))
    alert('✅ Saved!')
  }

  const resetZone = (key) => {
    setSwapZones(prev => ({ ...prev, [key]: DEFAULT_SWAP_ZONES[key] }))
  }

  const updateField = (key, field, value) => {
    setSwapZones(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }))
  }

  const buildSwapZone = (zone) => {
    return `SWAP ZONE (EDIT ONLY THIS BLOCK):
Scene goal: ${zone.goal}
Primary subject (hero): ${zone.hero}
Supporting elements (2–4): ${zone.supporting}
Industry context cues (subtle): ${zone.industry}
Emotion: ${zone.emotion}${zone.text ? `\nOptional on-image text (short, 1–4 words): "${zone.text}" (bold sans-serif, very high contrast, placed bottom-left or top-left)` : ''}`
  }

  const getFullPrompt = () => {
    const zone = swapZones[selectedKey]
    return `${STYLE_LOCK}\n\n${buildSwapZone(zone)}\n\n${CONSISTENCY_RULES}\n\n${NEGATIVE_PROMPT}`
  }

  const generateImage = async () => {
    setLoading(true)
    setError(null)
    const startTime = Date.now()

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: getFullPrompt() })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setImage(data.image)
      setProvider(data.provider)
      setGenTime(((Date.now() - startTime) / 1000).toFixed(1))
      setHistory(prev => [{
        image: data.image,
        key: selectedKey,
        zone: swapZones[selectedKey],
        time: ((Date.now() - startTime) / 1000).toFixed(1)
      }, ...prev.slice(0, 11)])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const zone = swapZones[selectedKey]

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', padding: '1.5rem', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>🎨 Schnell Prompt Workshop</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowLocked(!showLocked)} style={btnStyle}>{showLocked ? '🔒 Hide' : '👁️ Show'} Locked</button>
            <button onClick={saveAll} style={{ ...btnStyle, background: '#238636', borderColor: '#238636' }}>💾 Save</button>
          </div>
        </div>

        {/* Zone Selector */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {Object.keys(ZONE_LABELS).map(key => (
            <button key={key} onClick={() => setSelectedKey(key)} style={{
              padding: '0.4rem 0.7rem', fontSize: '0.8rem',
              background: selectedKey === key ? '#58a6ff' : '#21262d',
              border: '1px solid ' + (selectedKey === key ? '#58a6ff' : '#30363d'),
              borderRadius: '6px', color: selectedKey === key ? '#0d1117' : '#8b949e',
              cursor: 'pointer', fontWeight: selectedKey === key ? '600' : '400'
            }}>{ZONE_LABELS[key]}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
          
          {/* Left: Prompt Builder */}
          <div>
            {/* Style Lock (collapsible) */}
            {showLocked && (
              <div style={{ ...lockedBox, marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#6e7681', marginBottom: '0.5rem' }}>🔒 STYLE LOCK</div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#8b949e', lineHeight: '1.4' }}>{STYLE_LOCK}</p>
              </div>
            )}

            {/* Swap Zone - Editable Fields */}
            <div style={{ background: '#161b22', border: '2px solid #58a6ff', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: '#58a6ff', fontSize: '0.8rem', fontWeight: '600' }}>✏️ SWAP ZONE — {ZONE_LABELS[selectedKey]}</span>
                <button onClick={() => resetZone(selectedKey)} style={btnSmall}>↺ Reset</button>
              </div>
              
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                <Field label="Scene goal" value={zone.goal} onChange={v => updateField(selectedKey, 'goal', v)} />
                <Field label="Primary subject (hero)" value={zone.hero} onChange={v => updateField(selectedKey, 'hero', v)} />
                <Field label="Supporting elements (2-4)" value={zone.supporting} onChange={v => updateField(selectedKey, 'supporting', v)} />
                <Field label="Industry context cues" value={zone.industry} onChange={v => updateField(selectedKey, 'industry', v)} />
                <Field label="Emotion" value={zone.emotion} onChange={v => updateField(selectedKey, 'emotion', v)} />
                <Field label="On-image text (optional)" value={zone.text} onChange={v => updateField(selectedKey, 'text', v)} placeholder="Leave empty for no text" />
              </div>
            </div>

            {/* Consistency + Negative (collapsible) */}
            {showLocked && (
              <>
                <div style={{ ...lockedBox, marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#6e7681', marginBottom: '0.3rem' }}>🔒 CONSISTENCY RULES</div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b949e', lineHeight: '1.35' }}>{CONSISTENCY_RULES}</p>
                </div>
                <div style={{ ...lockedBox, marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#6e7681', marginBottom: '0.3rem' }}>🚫 NEGATIVE PROMPT</div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#f85149', lineHeight: '1.35' }}>{NEGATIVE_PROMPT}</p>
                </div>
              </>
            )}

            {/* Generate */}
            <button onClick={generateImage} disabled={loading} style={{
              width: '100%', padding: '0.9rem',
              background: loading ? '#30363d' : 'linear-gradient(135deg, #0066cc, #00a3e0)',
              border: 'none', borderRadius: '8px', color: 'white',
              fontSize: '1rem', fontWeight: '600', cursor: loading ? 'wait' : 'pointer'
            }}>
              {loading ? '⏳ Generating...' : '🚀 Generate'}
            </button>

            {error && <div style={{ marginTop: '0.5rem', padding: '0.6rem', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.4)', borderRadius: '6px', color: '#f85149', fontSize: '0.8rem' }}>❌ {error}</div>}

            <details style={{ marginTop: '0.75rem' }}>
              <summary style={{ color: '#6e7681', cursor: 'pointer', fontSize: '0.75rem' }}>View full prompt</summary>
              <pre style={{ marginTop: '0.4rem', padding: '0.6rem', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', fontSize: '0.7rem', color: '#8b949e', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>{getFullPrompt()}</pre>
            </details>
          </div>

          {/* Right: Output */}
          <div>
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '10px', overflow: 'hidden', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {image ? (
                <div style={{ width: '100%' }}>
                  <img src={image} alt="Generated" style={{ width: '100%', display: 'block' }} />
                  <div style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', color: '#8b949e', fontSize: '0.75rem', borderTop: '1px solid #30363d' }}>
                    <span>{provider} • {genTime}s</span>
                    <a href={image} download={`mxdr-${selectedKey}.png`} style={{ color: '#58a6ff', textDecoration: 'none' }}>⬇️ Download</a>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#484f58', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🖼️</div>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>Output here</p>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ fontSize: '0.7rem', color: '#6e7681', marginBottom: '0.4rem' }}>History:</p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {history.map((item, i) => (
                    <img key={i} src={item.image} alt="" onClick={() => { setImage(item.image); setSelectedKey(item.key); setSwapZones(prev => ({ ...prev, [item.key]: item.zone })) }}
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '2px solid transparent', opacity: 0.8 }}
                      onMouseOver={e => { e.target.style.borderColor = '#58a6ff'; e.target.style.opacity = 1 }}
                      onMouseOut={e => { e.target.style.borderColor = 'transparent'; e.target.style.opacity = 0.8 }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', color: '#484f58', fontSize: '0.75rem' }}>
          <a href="/" style={{ color: '#58a6ff' }}>← Chat</a> • <a href="/leads" style={{ color: '#58a6ff' }}>Leads →</a>
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: '0.2rem' }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '0.5rem 0.6rem', background: '#0d1117', border: '1px solid #30363d', borderRadius: '5px', color: '#e6edf3', fontSize: '0.85rem' }}
      />
    </div>
  )
}

const btnStyle = { padding: '0.45rem 0.85rem', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', cursor: 'pointer', fontSize: '0.8rem' }
const btnSmall = { padding: '0.2rem 0.5rem', background: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#8b949e', cursor: 'pointer', fontSize: '0.7rem' }
const lockedBox = { background: '#0d1117', border: '1px solid #21262d', borderRadius: '6px', padding: '0.6rem' }
