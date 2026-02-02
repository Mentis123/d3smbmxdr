'use client'
import { useState } from 'react'

// Test page for image generation - parallel to main chat
// Access at /test-image

const AGENT_PROMPT = `Professional digital avatar for a cybersecurity AI assistant named "Shield". 
Gender-neutral humanoid figure with a sleek, modern design. 
Subtle blue and cyan glow effects suggesting digital protection. 
Clean corporate aesthetic suitable for enterprise B2B. 
No text or logos. Simple background gradient.
Professional, trustworthy, approachable.`

const CONTEXT_PROMPTS = {
  healthcare: `Modern healthcare facility security concept. Medical cross symbol with digital shield overlay. Clean, professional, blue and white color palette. No people, abstract representation. Enterprise security aesthetic.`,
  
  accounting: `Financial data protection concept. Abstract representation of secure documents and numbers. Professional blue and gold accents. Shield motif integrated subtly. Corporate aesthetic.`,
  
  manufacturing: `Industrial cybersecurity concept. Factory floor meets digital protection. Subtle shield overlay on machinery silhouettes. Blue and orange industrial palette. Modern, clean design.`,
  
  retail: `Retail point of sale security concept. Abstract POS terminal with protective digital shield. Clean commercial aesthetic. Blue security tones with retail warmth. No people.`,
  
  compliance: `Compliance and certification concept. Abstract checkmarks, shields, and document symbols. Professional blue palette. Clean corporate aesthetic suggesting trust and verification.`,
  
  visibility: `Security operations center concept. Abstract representation of monitoring dashboards and threat visibility. Blue glow effects. Dark professional background. Digital protection aesthetic.`,
  
  recommendation: `Managed security solution concept. Protective shield encompassing a business. 24/7 monitoring visualization. Professional blue and cyan. Trustworthy enterprise aesthetic.`
}

export default function TestImage() {
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const [selectedPrompt, setSelectedPrompt] = useState('agent')
  const [customPrompt, setCustomPrompt] = useState('')
  const [provider, setProvider] = useState(null)
  const [genTime, setGenTime] = useState(null)

  const generateImage = async () => {
    setLoading(true)
    setError(null)
    setImage(null)
    
    const startTime = Date.now()
    const prompt = selectedPrompt === 'custom' 
      ? customPrompt 
      : selectedPrompt === 'agent' 
        ? AGENT_PROMPT 
        : CONTEXT_PROMPTS[selectedPrompt]

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
      
      setImage(data.image)
      setProvider(data.provider)
      setGenTime(((Date.now() - startTime) / 1000).toFixed(1))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1419',
      color: '#f0f6fc',
      padding: '2rem',
      fontFamily: '-apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>🎨 Image Generation Test</h1>
        <p style={{ color: '#8b949e', marginBottom: '2rem' }}>
          Testing Flux Schnell for contextual chat images
        </p>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e' }}>
            Select context:
          </label>
          <select 
            value={selectedPrompt}
            onChange={(e) => setSelectedPrompt(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#1a2332',
              border: '1px solid #30363d',
              borderRadius: '8px',
              color: '#f0f6fc',
              fontSize: '1rem'
            }}
          >
            <option value="agent">🤖 Agent Avatar (Shield)</option>
            <option value="healthcare">🏥 Healthcare Context</option>
            <option value="accounting">📊 Accounting/Finance Context</option>
            <option value="manufacturing">🏭 Manufacturing Context</option>
            <option value="retail">🛒 Retail Context</option>
            <option value="compliance">✅ Compliance/Third-Party</option>
            <option value="visibility">👁️ Security Visibility</option>
            <option value="recommendation">🛡️ MXDR Recommendation</option>
            <option value="custom">✏️ Custom Prompt</option>
          </select>
        </div>
        
        {selectedPrompt === 'custom' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter your custom prompt..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#1a2332',
                border: '1px solid #30363d',
                borderRadius: '8px',
                color: '#f0f6fc',
                fontSize: '0.9rem',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />
          </div>
        )}
        
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          background: '#1a2332', 
          borderRadius: '8px',
          border: '1px solid #30363d'
        }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '0.8rem' }}>
            Prompt being used:
          </label>
          <pre style={{ 
            color: '#58a6ff', 
            fontSize: '0.8rem', 
            whiteSpace: 'pre-wrap',
            margin: 0
          }}>
            {selectedPrompt === 'custom' 
              ? customPrompt || '(enter a custom prompt)' 
              : selectedPrompt === 'agent' 
                ? AGENT_PROMPT 
                : CONTEXT_PROMPTS[selectedPrompt]}
          </pre>
        </div>
        
        <button
          onClick={generateImage}
          disabled={loading || (selectedPrompt === 'custom' && !customPrompt)}
          style={{
            width: '100%',
            padding: '1rem',
            background: loading ? '#30363d' : 'linear-gradient(135deg, #0066cc, #00a3e0)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'wait' : 'pointer',
            marginBottom: '1.5rem'
          }}
        >
          {loading ? '⏳ Generating...' : '🚀 Generate Image'}
        </button>
        
        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '8px',
            color: '#ff6b6b',
            marginBottom: '1.5rem'
          }}>
            ❌ {error}
          </div>
        )}
        
        {image && (
          <div style={{
            background: '#1a2332',
            border: '1px solid #30363d',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <img 
              src={image} 
              alt="Generated" 
              style={{ 
                width: '100%', 
                display: 'block' 
              }}
            />
            <div style={{ 
              padding: '1rem', 
              display: 'flex', 
              justifyContent: 'space-between',
              color: '#8b949e',
              fontSize: '0.85rem'
            }}>
              <span>Provider: {provider}</span>
              <span>Generated in {genTime}s</span>
            </div>
          </div>
        )}
        
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#1a2332', 
          borderRadius: '8px',
          border: '1px solid #30363d'
        }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>📝 Setup Required</h3>
          <p style={{ color: '#8b949e', fontSize: '0.85rem', margin: 0 }}>
            Add one of these env vars to Vercel:
            <br />• <code style={{ color: '#58a6ff' }}>TOGETHER_API_KEY</code> - Together.ai (recommended)
            <br />• <code style={{ color: '#58a6ff' }}>REPLICATE_API_TOKEN</code> - Replicate
          </p>
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
