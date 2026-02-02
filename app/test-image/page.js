'use client'
import { useState, useEffect } from 'react'

// Prompt Workshop with Master Template
// Locked prefix/suffix + editable zone per context

const MASTER_TEMPLATE = {
  prefix: `Professional enterprise cybersecurity illustration. Clean corporate B2B aesthetic. Abstract representation, no people, no text, no logos. Modern minimalist style. Blue and cyan color palette with subtle glow effects.`,
  suffix: `Simple dark gradient background. High quality, sharp details. Suitable for enterprise marketing materials.`
}

const DEFAULT_ZONES = {
  agent: `Digital AI assistant avatar. Gender-neutral humanoid silhouette. Protective shield motif. Trustworthy and approachable presence.`,
  healthcare: `Medical healthcare security. Cross symbol with digital shield overlay. Clean clinical aesthetic with protective elements.`,
  accounting: `Financial data protection. Secure documents, numbers, currency symbols. Gold accents suggesting value and trust.`,
  manufacturing: `Industrial security. Factory machinery silhouettes with digital protection overlay. Orange industrial accents.`,
  retail: `Retail point-of-sale security. POS terminal with protective barrier. Commercial warmth with security confidence.`,
  compliance: `Compliance and certification. Checkmarks, verification badges, document seals. Trust and verification symbols.`,
  visibility: `Security operations monitoring. Dashboard displays, threat radar, visibility metaphors. Dark SOC aesthetic with blue glow.`,
  recommendation: `Managed security protection. Business building with encompassing shield. 24/7 protection visualization.`
}

const ZONE_LABELS = {
  agent: '🤖 Agent Avatar',
  healthcare: '🏥 Healthcare',
  accounting: '📊 Finance',
  manufacturing: '🏭 Manufacturing',
  retail: '🛒 Retail',
  compliance: '✅ Compliance',
  visibility: '👁️ Visibility',
  recommendation: '🛡️ MXDR'
}

export default function TestImage() {
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const [selectedKey, setSelectedKey] = useState('agent')
  const [masterPrefix, setMasterPrefix] = useState(MASTER_TEMPLATE.prefix)
  const [masterSuffix, setMasterSuffix] = useState(MASTER_TEMPLATE.suffix)
  const [zones, setZones] = useState(DEFAULT_ZONES)
  const [provider, setProvider] = useState(null)
  const [genTime, setGenTime] = useState(null)
  const [history, setHistory] = useState([])
  const [editingMaster, setEditingMaster] = useState(false)

  // Load saved from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mxdr-prompt-workshop-v2')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.prefix) setMasterPrefix(data.prefix)
        if (data.suffix) setMasterSuffix(data.suffix)
        if (data.zones) setZones({ ...DEFAULT_ZONES, ...data.zones })
      } catch (e) {}
    }
  }, [])

  const saveAll = () => {
    localStorage.setItem('mxdr-prompt-workshop-v2', JSON.stringify({
      prefix: masterPrefix,
      suffix: masterSuffix,
      zones
    }))
    alert('✅ Saved!')
  }

  const resetZone = (key) => {
    setZones(prev => ({ ...prev, [key]: DEFAULT_ZONES[key] }))
  }

  const resetMaster = () => {
    setMasterPrefix(MASTER_TEMPLATE.prefix)
    setMasterSuffix(MASTER_TEMPLATE.suffix)
  }

  const getFullPrompt = () => {
    return `${masterPrefix}\n\n${zones[selectedKey]}\n\n${masterSuffix}`
  }

  const generateImage = async () => {
    setLoading(true)
    setError(null)
    
    const startTime = Date.now()
    const prompt = getFullPrompt()

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      
      const result = {
        image: data.image,
        prompt,
        zone: zones[selectedKey],
        key: selectedKey,
        provider: data.provider,
        time: ((Date.now() - startTime) / 1000).toFixed(1)
      }
      
      setImage(result.image)
      setProvider(result.provider)
      setGenTime(result.time)
      setHistory(prev => [result, ...prev.slice(0, 9)])
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportAll = () => {
    const data = { prefix: masterPrefix, suffix: masterSuffix, zones }
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    alert('📋 Copied to clipboard!')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1419', color: '#f0f6fc', padding: '1.5rem', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🎨 Prompt Workshop</h1>
            <p style={{ color: '#8b949e', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Master template + editable zones</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setEditingMaster(!editingMaster)} style={btnStyle}>
              {editingMaster ? '🔒 Lock Master' : '⚙️ Edit Master'}
            </button>
            <button onClick={saveAll} style={{ ...btnStyle, background: '#238636', borderColor: '#238636' }}>💾 Save</button>
            <button onClick={exportAll} style={btnStyle}>📋 Export</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
          
          {/* Left: Prompt Builder */}
          <div>
            {/* Master Prefix */}
            <div style={{ ...boxStyle, marginBottom: '0.75rem', background: editingMaster ? '#1a2332' : '#0d1117' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#8b949e', fontSize: '0.75rem', textTransform: 'uppercase' }}>🔒 Master Prefix</span>
                {editingMaster && <button onClick={resetMaster} style={{ ...btnSmall, fontSize: '0.7rem' }}>↺ Reset</button>}
              </div>
              {editingMaster ? (
                <textarea
                  value={masterPrefix}
                  onChange={(e) => setMasterPrefix(e.target.value)}
                  style={{ ...textareaStyle, minHeight: '80px' }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6e7681', lineHeight: '1.4' }}>{masterPrefix}</p>
              )}
            </div>

            {/* Zone Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {Object.keys(ZONE_LABELS).map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: selectedKey === key ? '#58a6ff' : '#21262d',
                    border: '1px solid ' + (selectedKey === key ? '#58a6ff' : '#30363d'),
                    borderRadius: '6px',
                    color: selectedKey === key ? '#0f1419' : '#8b949e',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: selectedKey === key ? '600' : '400'
                  }}
                >
                  {ZONE_LABELS[key]}
                </button>
              ))}
            </div>

            {/* Editable Zone */}
            <div style={{ ...boxStyle, marginBottom: '0.75rem', borderColor: '#58a6ff', background: '#1a2332' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#58a6ff', fontSize: '0.75rem', textTransform: 'uppercase' }}>✏️ Editable Zone — {ZONE_LABELS[selectedKey]}</span>
                <button onClick={() => resetZone(selectedKey)} style={btnSmall}>↺ Reset</button>
              </div>
              <textarea
                value={zones[selectedKey]}
                onChange={(e) => setZones(prev => ({ ...prev, [selectedKey]: e.target.value }))}
                style={{ ...textareaStyle, minHeight: '100px' }}
              />
            </div>

            {/* Master Suffix */}
            <div style={{ ...boxStyle, marginBottom: '1rem', background: editingMaster ? '#1a2332' : '#0d1117' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#8b949e', fontSize: '0.75rem', textTransform: 'uppercase' }}>🔒 Master Suffix</span>
              </div>
              {editingMaster ? (
                <textarea
                  value={masterSuffix}
                  onChange={(e) => setMasterSuffix(e.target.value)}
                  style={{ ...textareaStyle, minHeight: '60px' }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6e7681', lineHeight: '1.4' }}>{masterSuffix}</p>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={generateImage}
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading ? '#30363d' : 'linear-gradient(135deg, #0066cc, #00a3e0)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {loading ? '⏳ Generating...' : '🚀 Generate Image'}
            </button>

            {error && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '8px', color: '#ff6b6b', fontSize: '0.85rem' }}>
                ❌ {error}
              </div>
            )}

            {/* Full Prompt Preview */}
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ color: '#6e7681', cursor: 'pointer', fontSize: '0.8rem' }}>View full prompt</summary>
              <pre style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#0d1117', borderRadius: '6px', fontSize: '0.75rem', color: '#8b949e', whiteSpace: 'pre-wrap', overflow: 'auto' }}>
                {getFullPrompt()}
              </pre>
            </details>
          </div>

          {/* Right: Image Output */}
          <div>
            <div style={{ ...boxStyle, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden' }}>
              {image ? (
                <div style={{ width: '100%' }}>
                  <img src={image} alt="Generated" style={{ width: '100%', display: 'block' }} />
                  <div style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', color: '#8b949e', fontSize: '0.75rem', borderTop: '1px solid #30363d' }}>
                    <span>{provider} • {genTime}s</span>
                    <a href={image} download={`mxdr-${selectedKey}-${Date.now()}.png`} style={{ color: '#58a6ff', textDecoration: 'none' }}>⬇️ Download</a>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6e7681', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🖼️</div>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Image appears here</p>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#6e7681', marginBottom: '0.5rem' }}>Recent:</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {history.map((item, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img
                        src={item.image}
                        alt={`History ${i}`}
                        onClick={() => {
                          setImage(item.image)
                          setSelectedKey(item.key)
                          setZones(prev => ({ ...prev, [item.key]: item.zone }))
                        }}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '2px solid transparent' }}
                        onMouseOver={(e) => e.target.style.borderColor = '#58a6ff'}
                        onMouseOut={(e) => e.target.style.borderColor = 'transparent'}
                      />
                      <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: '#0f1419', padding: '0 3px', borderRadius: '2px', fontSize: '0.6rem', color: '#8b949e' }}>
                        {ZONE_LABELS[item.key]?.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#6e7681', fontSize: '0.8rem' }}>
          <a href="/" style={{ color: '#58a6ff' }}>← Chat</a>
          {' • '}
          <a href="/leads" style={{ color: '#58a6ff' }}>Leads →</a>
        </p>
      </div>
    </div>
  )
}

const btnStyle = {
  padding: '0.5rem 1rem',
  background: '#21262d',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#f0f6fc',
  cursor: 'pointer',
  fontSize: '0.85rem'
}

const btnSmall = {
  padding: '0.25rem 0.5rem',
  background: '#21262d',
  border: '1px solid #30363d',
  borderRadius: '4px',
  color: '#8b949e',
  cursor: 'pointer',
  fontSize: '0.75rem'
}

const boxStyle = {
  background: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '8px',
  padding: '0.75rem'
}

const textareaStyle = {
  width: '100%',
  padding: '0.75rem',
  background: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#f0f6fc',
  fontSize: '0.85rem',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: '1.4'
}
