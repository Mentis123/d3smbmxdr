'use client'
import { useState, useEffect } from 'react'

// Schnell Master Template v4
// Locked system style + JSON scene payload + locked rules + negative prompt

const SYSTEM_STYLE = `SYSTEM STYLE — LOCKED (DO NOT CHANGE): Clean, modern enterprise cybersecurity illustration system. High-end SaaS visual language suitable for B2B and boardroom contexts. Flat plus subtle 3D hybrid with soft depth and smooth surfaces. Minimalist, uncluttered composition with excellent legibility. Restrained dark-mode palette with deep navy or charcoal background, subtle gradients, and accent colours limited to blue, cyan, and soft teal. Soft diffused studio lighting, gentle glow effects only where meaningful. Calm, professional, trustworthy tone. Perspective is straight-on or very slight isometric. Vector-like clarity, consistent line weight, studio-polished finish. No visual noise, no grunge, no photorealism, no branding.`

const RENDERING_RULES = `RENDERING & CONSISTENCY RULES — LOCKED: Maintain consistency in colour, lighting, and proportions across all generations. Background must be a simple, clean gradient with no patterns. No text, no logos, no symbols that resemble real brands. If human figures appear, use simplified silhouettes only. All elements should feel cohesive as part of the same product visual system.`

const NEGATIVE_PROMPT = `NEGATIVE PROMPT — LOCKED: photorealistic face, uncanny valley, human skin texture, heavy realism, busy background, clutter, glitch effects, cyberpunk styling, neon overload, text, typography, logos, watermarks, brand names, harsh lighting, strong bloom, lens flare, blur, low resolution, jpeg artifacts, creepy expressions, extra fingers, distorted features`

const DEFAULT_PAYLOADS = {
  agent: {
    scene_goal: "Introduce a professional, trustworthy cybersecurity AI assistant",
    hero: "gender-neutral humanoid digital avatar with modern, simplified features",
    supporting_elements: ["subtle blue and cyan ambient glow", "soft digital aura suggesting protection", "minimal abstract tech shapes"],
    industry_cue: "enterprise cybersecurity",
    emotion: "calm and confident",
    label: ""
  },
  healthcare: {
    scene_goal: "Communicate healthcare data protection and compliance",
    hero: "translucent protective shield enclosing a stylized medical cross",
    supporting_elements: ["secure patient record card", "compliance checkmark badge", "soft heartbeat line accent"],
    industry_cue: "healthcare and medical",
    emotion: "calm and reassuring",
    label: ""
  },
  accounting: {
    scene_goal: "Illustrate financial data security and regulatory compliance",
    hero: "secure digital vault with modern lock interface",
    supporting_elements: ["protected financial document stack", "audit verification badge", "subtle currency symbol"],
    industry_cue: "finance and accounting",
    emotion: "confident and trustworthy",
    label: ""
  },
  manufacturing: {
    scene_goal: "Show industrial operations protected from cyber threats",
    hero: "factory control panel with integrated security shield",
    supporting_elements: ["protected endpoint device", "secure network node", "threat detection radar"],
    industry_cue: "manufacturing and industrial",
    emotion: "confident and vigilant",
    label: ""
  },
  retail: {
    scene_goal: "Demonstrate retail transaction and customer data security",
    hero: "point-of-sale terminal with protective security barrier",
    supporting_elements: ["secured payment card icon", "protected customer data symbol", "verification checkmark"],
    industry_cue: "retail and commerce",
    emotion: "calm and reliable",
    label: ""
  },
  compliance: {
    scene_goal: "Demonstrate third-party compliance readiness and certification",
    hero: "prominent certification badge with verification checkmark",
    supporting_elements: ["compliance document with seal", "audit timeline indicator", "trust verification symbol"],
    industry_cue: "enterprise compliance",
    emotion: "confident and authoritative",
    label: ""
  },
  visibility: {
    scene_goal: "Show comprehensive threat visibility and real-time monitoring",
    hero: "security operations dashboard with threat radar display",
    supporting_elements: ["alert status indicator", "network monitoring graph", "detection magnifier"],
    industry_cue: "security operations center",
    emotion: "alert but controlled",
    label: ""
  },
  recommendation: {
    scene_goal: "Present MXDR as the complete managed security solution",
    hero: "business building silhouette protected by encompassing shield dome",
    supporting_elements: ["24/7 clock indicator", "expert team silhouette", "blocked threat icon"],
    industry_cue: "managed security services",
    emotion: "confident and protected",
    label: "MXDR"
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
  const [payloads, setPayloads] = useState(DEFAULT_PAYLOADS)
  const [provider, setProvider] = useState(null)
  const [genTime, setGenTime] = useState(null)
  const [history, setHistory] = useState([])
  const [showLocked, setShowLocked] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('mxdr-schnell-v4')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.payloads) setPayloads({ ...DEFAULT_PAYLOADS, ...data.payloads })
      } catch (e) {}
    }
  }, [])

  const saveAll = () => {
    localStorage.setItem('mxdr-schnell-v4', JSON.stringify({ payloads }))
    alert('✅ Saved!')
  }

  const resetPayload = (key) => {
    setPayloads(prev => ({ ...prev, [key]: DEFAULT_PAYLOADS[key] }))
  }

  const updateField = (key, field, value) => {
    setPayloads(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }))
  }

  const updateArrayField = (key, field, value) => {
    // Split by comma or newline
    const arr = value.split(/[,\n]/).map(s => s.trim()).filter(s => s)
    setPayloads(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: arr }
    }))
  }

  const buildPayloadBlock = (payload) => {
    return `SCENE PAYLOAD — EDIT ONLY THIS BLOCK:
{
  "scene_goal": "${payload.scene_goal}",
  "hero": "${payload.hero}",
  "supporting_elements": ${JSON.stringify(payload.supporting_elements)},
  "industry_cue": "${payload.industry_cue}",
  "emotion": "${payload.emotion}"${payload.label ? `,\n  "label": "${payload.label}"` : ''}
}`
  }

  const getFullPrompt = () => {
    const payload = payloads[selectedKey]
    return `${SYSTEM_STYLE}\n\n${buildPayloadBlock(payload)}\n\n${RENDERING_RULES}\n\n${NEGATIVE_PROMPT}`
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
        payload: payloads[selectedKey],
        time: ((Date.now() - startTime) / 1000).toFixed(1)
      }, ...prev.slice(0, 11)])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const payload = payloads[selectedKey]

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', padding: '1.5rem', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>🎨 Schnell Workshop</h1>
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
            {/* System Style (collapsible) */}
            {showLocked && (
              <div style={{ ...lockedBox, marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#6e7681', marginBottom: '0.5rem' }}>🔒 SYSTEM STYLE</div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b949e', lineHeight: '1.4' }}>{SYSTEM_STYLE}</p>
              </div>
            )}

            {/* Scene Payload - Editable */}
            <div style={{ background: '#161b22', border: '2px solid #58a6ff', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: '#58a6ff', fontSize: '0.8rem', fontWeight: '600' }}>✏️ SCENE PAYLOAD — {ZONE_LABELS[selectedKey]}</span>
                <button onClick={() => resetPayload(selectedKey)} style={btnSmall}>↺ Reset</button>
              </div>
              
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                <Field label="scene_goal" value={payload.scene_goal} onChange={v => updateField(selectedKey, 'scene_goal', v)} />
                <Field label="hero" value={payload.hero} onChange={v => updateField(selectedKey, 'hero', v)} />
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: '0.2rem' }}>supporting_elements (comma separated)</label>
                  <textarea
                    value={payload.supporting_elements.join(', ')}
                    onChange={e => updateArrayField(selectedKey, 'supporting_elements', e.target.value)}
                    style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                  />
                </div>
                <Field label="industry_cue" value={payload.industry_cue} onChange={v => updateField(selectedKey, 'industry_cue', v)} />
                <Field label="emotion" value={payload.emotion} onChange={v => updateField(selectedKey, 'emotion', v)} />
                <Field label="label (optional, leave empty for none)" value={payload.label} onChange={v => updateField(selectedKey, 'label', v)} />
              </div>
            </div>

            {/* Rendering Rules + Negative (collapsible) */}
            {showLocked && (
              <>
                <div style={{ ...lockedBox, marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#6e7681', marginBottom: '0.3rem' }}>🔒 RENDERING RULES</div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b949e', lineHeight: '1.35' }}>{RENDERING_RULES}</p>
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
              <pre style={{ marginTop: '0.4rem', padding: '0.6rem', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', fontSize: '0.7rem', color: '#8b949e', whiteSpace: 'pre-wrap', maxHeight: '250px', overflow: 'auto' }}>{getFullPrompt()}</pre>
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
                    <img key={i} src={item.image} alt="" onClick={() => { setImage(item.image); setSelectedKey(item.key); setPayloads(prev => ({ ...prev, [item.key]: item.payload })) }}
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

function Field({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: '0.2rem' }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  )
}

const btnStyle = { padding: '0.45rem 0.85rem', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', cursor: 'pointer', fontSize: '0.8rem' }
const btnSmall = { padding: '0.2rem 0.5rem', background: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#8b949e', cursor: 'pointer', fontSize: '0.7rem' }
const lockedBox = { background: '#0d1117', border: '1px solid #21262d', borderRadius: '6px', padding: '0.6rem' }
const inputStyle = { width: '100%', padding: '0.5rem 0.6rem', background: '#0d1117', border: '1px solid #30363d', borderRadius: '5px', color: '#e6edf3', fontSize: '0.85rem', fontFamily: 'inherit' }
