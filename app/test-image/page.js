'use client'
import { useState, useEffect } from 'react'

// Test page for image generation - workshop and refine prompts
// Access at /test-image

const DEFAULT_PROMPTS = {
  agent: `Professional digital avatar for a cybersecurity AI assistant named "Shield". 
Gender-neutral humanoid figure with a sleek, modern design. 
Subtle blue and cyan glow effects suggesting digital protection. 
Clean corporate aesthetic suitable for enterprise B2B. 
No text or logos. Simple background gradient.
Professional, trustworthy, approachable.`,
  
  healthcare: `Modern healthcare facility security concept. Medical cross symbol with digital shield overlay. Clean, professional, blue and white color palette. No people, abstract representation. Enterprise security aesthetic.`,
  
  accounting: `Financial data protection concept. Abstract representation of secure documents and numbers. Professional blue and gold accents. Shield motif integrated subtly. Corporate aesthetic.`,
  
  manufacturing: `Industrial cybersecurity concept. Factory floor meets digital protection. Subtle shield overlay on machinery silhouettes. Blue and orange industrial palette. Modern, clean design.`,
  
  retail: `Retail point of sale security concept. Abstract POS terminal with protective digital shield. Clean commercial aesthetic. Blue security tones with retail warmth. No people.`,
  
  compliance: `Compliance and certification concept. Abstract checkmarks, shields, and document symbols. Professional blue palette. Clean corporate aesthetic suggesting trust and verification.`,
  
  visibility: `Security operations center concept. Abstract representation of monitoring dashboards and threat visibility. Blue glow effects. Dark professional background. Digital protection aesthetic.`,
  
  recommendation: `Managed security solution concept. Protective shield encompassing a business. 24/7 monitoring visualization. Professional blue and cyan. Trustworthy enterprise aesthetic.`
}

const PROMPT_LABELS = {
  agent: '🤖 Agent Avatar (Shield)',
  healthcare: '🏥 Healthcare Context',
  accounting: '📊 Accounting/Finance',
  manufacturing: '🏭 Manufacturing',
  retail: '🛒 Retail',
  compliance: '✅ Compliance/Third-Party',
  visibility: '👁️ Security Visibility',
  recommendation: '🛡️ MXDR Recommendation'
}

export default function TestImage() {
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const [selectedKey, setSelectedKey] = useState('agent')
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS)
  const [provider, setProvider] = useState(null)
  const [genTime, setGenTime] = useState(null)
  const [history, setHistory] = useState([])
  const [showExport, setShowExport] = useState(false)

  // Load saved prompts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mxdr-image-prompts')
    if (saved) {
      try {
        setPrompts({ ...DEFAULT_PROMPTS, ...JSON.parse(saved) })
      } catch (e) {}
    }
  }, [])

  // Save prompts to localStorage
  const savePrompts = () => {
    localStorage.setItem('mxdr-image-prompts', JSON.stringify(prompts))
    alert('✅ Prompts saved to browser!')
  }

  const resetPrompt = (key) => {
    setPrompts(prev => ({ ...prev, [key]: DEFAULT_PROMPTS[key] }))
  }

  const updatePrompt = (key, value) => {
    setPrompts(prev => ({ ...prev, [key]: value }))
  }

  const generateImage = async () => {
    setLoading(true)
    setError(null)
    
    const startTime = Date.now()
    const prompt = prompts[selectedKey]

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const result = {
        image: data.image,
        prompt,
        key: selectedKey,
        provider: data.provider,
        time: ((Date.now() - startTime) / 1000).toFixed(1),
        timestamp: new Date().toISOString()
      }
      
      setImage(result.image)
      setProvider(result.provider)
      setGenTime(result.time)
      setHistory(prev => [result, ...prev.slice(0, 9)]) // Keep last 10
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportPrompts = () => {
    const json = JSON.stringify(prompts, null, 2)
    navigator.clipboard.writeText(json)
    alert('📋 Prompts copied to clipboard!')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1419',
      color: '#f0f6fc',
      padding: '2rem',
      fontFamily: '-apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>🎨 Image Prompt Workshop</h1>
            <p style={{ color: '#8b949e', margin: 0 }}>Edit prompts, generate, refine, save</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={savePrompts} style={btnStyle}>💾 Save All</button>
            <button onClick={exportPrompts} style={btnStyle}>📋 Export JSON</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left: Prompt Editor */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '0.85rem' }}>
                Select context to edit:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.keys(PROMPT_LABELS).map(key => (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: selectedKey === key ? '#58a6ff' : '#1a2332',
                      border: '1px solid ' + (selectedKey === key ? '#58a6ff' : '#30363d'),
                      borderRadius: '6px',
                      color: selectedKey === key ? '#0f1419' : '#8b949e',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: selectedKey === key ? '600' : '400'
                    }}
                  >
                    {PROMPT_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ color: '#8b949e', fontSize: '0.85rem' }}>
                  Prompt for {PROMPT_LABELS[selectedKey]}:
                </label>
                <button 
                  onClick={() => resetPrompt(selectedKey)} 
                  style={{ ...btnStyle, padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  ↺ Reset
                </button>
              </div>
              <textarea
                value={prompts[selectedKey]}
                onChange={(e) => updatePrompt(selectedKey, e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#1a2332',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  color: '#f0f6fc',
                  fontSize: '0.9rem',
                  minHeight: '200px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
              />
            </div>
            
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
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '8px',
                color: '#ff6b6b'
              }}>
                ❌ {error}
              </div>
            )}
          </div>
          
          {/* Right: Generated Image */}
          <div>
            <div style={{
              background: '#1a2332',
              border: '1px solid #30363d',
              borderRadius: '12px',
              overflow: 'hidden',
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {image ? (
                <div style={{ width: '100%' }}>
                  <img 
                    src={image} 
                    alt="Generated" 
                    style={{ width: '100%', display: 'block' }}
                  />
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    color: '#8b949e',
                    fontSize: '0.8rem',
                    borderTop: '1px solid #30363d'
                  }}>
                    <span>{provider} • {genTime}s</span>
                    <a 
                      href={image} 
                      download={`mxdr-${selectedKey}-${Date.now()}.png`}
                      style={{ color: '#58a6ff', textDecoration: 'none' }}
                    >
                      ⬇️ Download
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6e7681', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</div>
                  <p>Generated image will appear here</p>
                </div>
              )}
            </div>
            
            {/* History */}
            {history.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#8b949e' }}>
                  Recent generations:
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {history.map((item, i) => (
                    <img
                      key={i}
                      src={item.image}
                      alt={`History ${i}`}
                      onClick={() => {
                        setImage(item.image)
                        setSelectedKey(item.key)
                        setProvider(item.provider)
                        setGenTime(item.time)
                      }}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        opacity: 0.7,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.target.style.opacity = 1; e.target.style.borderColor = '#58a6ff' }}
                      onMouseOut={(e) => { e.target.style.opacity = 0.7; e.target.style.borderColor = 'transparent' }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p style={{ 
          marginTop: '2rem', 
          textAlign: 'center', 
          color: '#6e7681',
          fontSize: '0.8rem'
        }}>
          <a href="/" style={{ color: '#58a6ff' }}>← Back to Chat</a>
          {' | '}
          <a href="/leads" style={{ color: '#58a6ff' }}>Lead Dashboard →</a>
        </p>
      </div>
    </div>
  )
}

const btnStyle = {
  padding: '0.5rem 1rem',
  background: '#232d3f',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#f0f6fc',
  cursor: 'pointer',
  fontSize: '0.85rem'
}
