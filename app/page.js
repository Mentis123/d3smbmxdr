'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

// Image generation prompt template (locked)
const IMAGE_SYSTEM = `SYSTEM STYLE — LOCKED: Clean, modern enterprise cybersecurity illustration system. High-end SaaS visual language suitable for B2B and boardroom contexts. Flat plus subtle 3D hybrid with soft depth and smooth surfaces. Minimalist, uncluttered composition with excellent legibility. Restrained dark-mode palette with deep navy or charcoal background, subtle gradients, and accent colours limited to blue, cyan, and soft teal. Soft diffused studio lighting, gentle glow effects only where meaningful. Calm, professional, trustworthy tone. Perspective is straight-on or very slight isometric. Vector-like clarity, consistent line weight, studio-polished finish. No visual noise, no grunge, no photorealism, no branding.`

const IMAGE_RULES = `RENDERING RULES — LOCKED: Maintain consistency in colour, lighting, and proportions. Background must be a simple, clean gradient with no patterns. No text, no logos, no symbols that resemble real brands. If human figures appear, use simplified silhouettes only.`

const IMAGE_NEGATIVE = `NEGATIVE PROMPT: photorealistic face, uncanny valley, human skin texture, heavy realism, busy background, clutter, glitch effects, cyberpunk styling, neon overload, text, typography, logos, watermarks, brand names, harsh lighting, strong bloom, lens flare, blur, low resolution, jpeg artifacts, creepy expressions`

const SYSTEM_PROMPT = `You are a friendly, knowledgeable security advisor for Data#3, Australia's leading technology solutions provider. Your role is to have a natural conversation with SMB prospects to understand their security needs and guide them toward the right MXDR solution.

IMPORTANT: Always write "Data#3" with the hash symbol. Never write "Data 3" or "Data3".

## YOUR APPROACH
You are NOT a calculator or a form. You're having a genuine conversation. Ask questions one or two at a time, naturally. Listen to their answers and adapt.

## CONVERSATION STAGES
As the conversation progresses, indicate transitions between stages by including a stage marker at the START of your response:

[STAGE: discovery] - Getting to know them (industry, size, basics)
[STAGE: assessment] - Understanding their security situation  
[STAGE: deep-dive] - Exploring specific needs and gaps
[STAGE: recommendation] - Making your MXDR recommendation

Only include the stage marker when transitioning to a NEW stage. Don't repeat it every message.

## DYNAMIC IMAGE GENERATION
You have the ability to generate contextual visuals that enhance the conversation. Use this power INTELLIGENTLY based on the flow of conversation.

IMPORTANT: Place the image tag AS A VISUAL BREAK between your acknowledgment and your next question. Structure like this:

[Acknowledge what they shared - 1-2 sentences]

[IMAGE: {"scene_goal": "...", "hero": "...", "supporting_elements": ["...", "..."], "context_cue": "...", "emotion": "..."}]

[Move forward with context + your next question]

Example response structure:
"Thanks! The healthcare industry has unique security challenges, especially around patient data protection.

[IMAGE: {"scene_goal": "Healthcare data security", "hero": "medical records protected by digital shield", "supporting_elements": ["patient privacy icon", "compliance checkmark"], "context_cue": "healthcare clinic", "emotion": "reassuring and professional"}]

Knowing you're a medical clinic with 40 staff helps me understand your situation. Many healthcare organizations face compliance requirements around data protection. Do you have any specific compliance needs, like HIPAA or requirements from partners you work with?"

WHEN to generate images (use your judgment):
- When the conversation reaches a natural visual moment (they've shared something meaningful)
- When transitioning to a new stage  
- When discussing something that benefits from visualization
- When you're about to make a recommendation

WHAT to show (be contextually smart):
- Reflect THEIR specific situation back to them
- If they mention patient records → healthcare security visual
- If they mention compliance pressure → audit/certification visual
- If they mention an incident/close call → threat detection visual
- If they mention cloud/hybrid → cloud security architecture visual
- For recommendations → show the protection they'd get

Keep scene_goal to ONE clear sentence. Be specific to their situation.
Generate 2-4 images max per conversation. Quality over quantity.

## THE "ILLUSION OF CHOICE" FRAMEWORK
Every question should:
1. Feel like genuine discovery to the prospect
2. Actually identify a pain point MXDR solves
3. Lead naturally to the next question OR to your recommendation

If they answer "no" to a qualifying question, don't dead-end — pivot to another angle that still leads to MXDR.

## QUALIFYING QUESTIONS

INDUSTRY & SIZE (ask early):
- "What industry are you in?"
- "How many employees do you have?"

THIRD PARTY / COMPLIANCE:
- "Do you work with third parties who require you to demonstrate your cybersecurity capability?"
- "Have you ever been asked by a customer or vendor about your security posture?"

VISIBILITY & RESPONSE:
- "Do you currently have someone managing your security for you?"
- "Do you have visibility into threats in your environment today?"
- "If something happened right now, could your team respond effectively?"

ENVIRONMENT:
- "Is your business mostly cloud-based, on-premises, or hybrid?"
- "Are you using Microsoft 365? Which license level?"

DATA SECURITY:
- "Do you handle sensitive customer data or financial information?"

## CONVERSATION FLOW
1. GREETING: Warm, professional, brief.
2. DISCOVERY: Industry and size first, then third-party relationships, current security setup.
3. QUALIFYING: Use questions above conversationally — not like a checklist.
4. RECOMMENDATION: Clear recommendation with WHY based on their answers.
5. HANDOFF: "Ready to take the next step? Download our data sheet or connect with our team."

## TONE
- Conversational, not robotic
- No jargon — explain simply
- Confident but not pushy
- 1-2 questions at a time
- Short paragraphs (2-3 sentences max)
- Acknowledge their answers before moving on

## WHAT MXDR INCLUDES
- 24/7 threat monitoring and response
- Endpoint detection and response (EDR)
- Threat hunting by security experts
- Incident investigation
- Security reporting

Never make up pricing. Never promise specific SLAs. Just qualify and recommend.`

const SAMPLE_SCENARIOS = [
  { label: "Medical Clinic", message: "We're a medical clinic with about 40 staff. We handle patient records so we need to be careful about privacy." },
  { label: "Accounting Firm", message: "I run a small accounting firm, about 25 people. Some of our bigger clients have started asking about our security certifications." },
  { label: "Manufacturing", message: "We're a manufacturing company with 80 employees. Had a close call with a phishing email last month." },
  { label: "Retail Business", message: "Small retail business, 15 staff, we have a few POS systems and handle customer payment data." }
]

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [advisorAvatar, setAdvisorAvatar] = useState(null)
  const [avatarLoading, setAvatarLoading] = useState(true)
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [chatClosed, setChatClosed] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Generate AI advisor avatar on load
  useEffect(() => {
    const generateAdvisorAvatar = async () => {
      const avatarPayload = {
        scene_goal: "Friendly AI security advisor portrait",
        hero: "abstract humanoid figure made of flowing digital particles and soft light",
        supporting_elements: ["shield motif integrated subtly", "warm glow", "professional yet approachable"],
        context_cue: "AI assistant",
        emotion: "welcoming and trustworthy"
      }
      
      try {
        const imageUrl = await generateImage(avatarPayload)
        setAdvisorAvatar(imageUrl)
      } catch (e) {
        console.error('Avatar generation failed:', e)
      }
      setAvatarLoading(false)
      
      // Show greeting after avatar loads (or fails)
      setMessages([
        { role: 'bot', content: "Hi! I'm your AI security advisor. I'm here to help you figure out if managed security is right for your business.\n\nMind if I ask a few quick questions about your organization?" }
      ])
    }
    
    generateAdvisorAvatar()
  }, [])

  useEffect(() => {
    const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot')
    if (lastBotMsg && (
      lastBotMsg.content.toLowerCase().includes('would recommend') ||
      lastBotMsg.content.toLowerCase().includes('i\'d recommend') ||
      lastBotMsg.content.toLowerCase().includes('next step')
    )) {
      setShowRecommendation(true)
    }
  }, [messages])

  const generateImage = async (payload) => {
    const prompt = `${IMAGE_SYSTEM}\n\nSCENE PAYLOAD:\n${JSON.stringify(payload, null, 2)}\n\n${IMAGE_RULES}\n\n${IMAGE_NEGATIVE}`
    
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      return data.image || null
    } catch (e) {
      console.error('Image generation failed:', e)
      return null
    }
  }

  const [currentStage, setCurrentStage] = useState('discovery')
  
  const STAGE_INFO = {
    discovery: { label: 'Getting to Know You', icon: '👋' },
    assessment: { label: 'Security Assessment', icon: '🔍' },
    'deep-dive': { label: 'Deep Dive', icon: '📊' },
    recommendation: { label: 'Your Recommendation', icon: '✨' }
  }

  const parseAndProcessResponse = async (text) => {
    let processedText = text
    
    // Check for stage marker
    const stageMatch = text.match(/\[STAGE:\s*(\w+(?:-\w+)?)\s*\]/i)
    if (stageMatch) {
      const newStage = stageMatch[1].toLowerCase()
      if (STAGE_INFO[newStage]) {
        setCurrentStage(newStage)
      }
      processedText = processedText.replace(stageMatch[0], '').trim()
    }
    
    // Check for image tag - now handling text BEFORE and AFTER the image
    const imageMatch = processedText.match(/\[IMAGE:\s*(\{[\s\S]*?\})\s*\]/i)
    
    if (imageMatch) {
      try {
        const payload = JSON.parse(imageMatch[1])
        const imageIndex = processedText.indexOf(imageMatch[0])
        const textBefore = processedText.substring(0, imageIndex).trim()
        const textAfter = processedText.substring(imageIndex + imageMatch[0].length).trim()
        
        // Add text BEFORE image first (acknowledgment)
        if (textBefore) {
          setMessages(prev => [...prev, { role: 'bot', content: textBefore }])
        }
        
        // Generate image (visual break)
        setGeneratingImage(true)
        const imageUrl = await generateImage(payload)
        setGeneratingImage(false)
        
        if (imageUrl) {
          setMessages(prev => [...prev, { role: 'image', content: imageUrl, payload }])
        }
        
        // Add text AFTER image (forward-looking question)
        if (textAfter) {
          setMessages(prev => [...prev, { role: 'bot', content: textAfter }])
        }
      } catch (e) {
        // If JSON parse fails, just show the text
        setMessages(prev => [...prev, { role: 'bot', content: processedText }])
      }
    } else {
      setMessages(prev => [...prev, { role: 'bot', content: processedText }])
    }
  }

  const extractLeadData = () => {
    const transcript = messages.map(m => m.role === 'image' ? '[image]' : `${m.role}: ${m.content}`).join('\n')
    let industry = null, employees = null
    const industryMatches = transcript.match(/(?:medical|healthcare|accounting|manufacturing|retail|finance|legal|construction|education)/gi)
    if (industryMatches) industry = industryMatches[0]
    const empMatches = transcript.match(/(\d+)\s*(?:staff|employees|people)/i)
    if (empMatches) employees = empMatches[1]
    return { company: 'Unknown', industry, employees, email: leadEmail, phone: leadPhone, summary: transcript.substring(0, 2000), score: showRecommendation ? 8 : 5, recommendation: 'MXDR' }
  }

  const saveLead = async () => {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadData: extractLeadData(), messages: [] })
      })
    } catch (e) {}
  }

  const handleClose = async () => { await saveLead(); setChatClosed(true) }
  const handleLeadSubmit = async (e) => { e.preventDefault(); await saveLead(); setShowLeadCapture(false); setChatClosed(true) }

  const sendMessage = async (text) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: messageText }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          messages: [...messages, { role: 'user', content: messageText }]
            .filter(m => m.role !== 'image')
            .map(m => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.content }))
        })
      })

      const data = await response.json()
      await parseAndProcessResponse(data.response || "I apologize, I couldn't generate a response.")
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "I apologize, but I'm having trouble connecting. Please try again." }])
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  if (chatClosed) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <a href="https://www.data3.com" className={styles.logo} target="_blank">Data<sup>#</sup>3</a>
          <a href="https://www.data3.com/services/managed-services/managed-security-services/" className={styles.badge} target="_blank">SMB Security</a>
        </header>
        <main className={styles.main}>
          <div className={styles.chatContainer} style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Thanks for chatting!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Our team will be in touch soon.</p>
            <a href="https://www.data3.com/services/managed-services/managed-security-services/" target="_blank" className={styles.ctaPrimary} style={{ display: 'inline-block' }}>Learn More About MXDR →</a>
          </div>
        </main>
        <footer className={styles.footer}><p>Data<sup>#</sup>3 Limited | Australia's leading technology solutions provider</p></footer>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <a href="https://www.data3.com" className={styles.logo} target="_blank">Data<sup>#</sup>3</a>
        <a href="https://www.data3.com/services/managed-services/managed-security-services/" className={styles.badge} target="_blank">SMB Security</a>
      </header>

      <main className={styles.main}>
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader}>
            <div className={styles.avatarContainer}>
              {avatarLoading ? (
                <div className={styles.avatarLoading}>
                  <div className={styles.avatarSpinner}></div>
                </div>
              ) : advisorAvatar ? (
                <img src={advisorAvatar} alt="AI Advisor" className={styles.advisorAvatar} />
              ) : (
                <div className={styles.avatar}>🛡️</div>
              )}
              <span className={styles.aiTag}>✨ AI</span>
            </div>
            <div>
              <h1>Security Assessment</h1>
              <p>Personalized visuals generated in real-time</p>
            </div>
            <div className={styles.stageIndicator}>
              <span className={styles.stageIcon}>{STAGE_INFO[currentStage]?.icon}</span>
              <span className={styles.stageLabel}>{STAGE_INFO[currentStage]?.label}</span>
            </div>
            <button 
              className={styles.resetBtn} 
              onClick={() => {
                if (window.confirm('Start a new conversation? Your current chat will be cleared.')) {
                  setMessages([])
                  setCurrentStage('discovery')
                  setShowRecommendation(false)
                  setShowLeadCapture(false)
                  setAdvisorAvatar(null)
                  setAvatarLoading(true)
                  // Regenerate avatar
                  const generateNewAvatar = async () => {
                    const avatarPayload = {
                      scene_goal: "Friendly AI security advisor portrait",
                      hero: "abstract humanoid figure made of flowing digital particles and soft light",
                      supporting_elements: ["shield motif integrated subtly", "warm glow", "professional yet approachable"],
                      context_cue: "AI assistant",
                      emotion: "welcoming and trustworthy"
                    }
                    try {
                      const imageUrl = await generateImage(avatarPayload)
                      setAdvisorAvatar(imageUrl)
                    } catch (e) {}
                    setAvatarLoading(false)
                    setMessages([
                      { role: 'bot', content: "Hi! I'm your AI security advisor. I'm here to help you figure out if managed security is right for your business.\n\nMind if I ask a few quick questions about your organization?" }
                    ])
                  }
                  generateNewAvatar()
                }
              }}
              title="Start new conversation"
            >
              ↻
            </button>
          </div>

          <div className={styles.messages}>
            {/* Hero Avatar Introduction */}
            {messages.length <= 1 && (
              <div className={styles.heroIntro}>
                {avatarLoading ? (
                  <div className={styles.heroAvatarLoading}>
                    <div className={styles.heroSpinner}></div>
                    <span>Creating your AI advisor...</span>
                  </div>
                ) : advisorAvatar ? (
                  <div className={styles.heroAvatarWrap}>
                    <img src={advisorAvatar} alt="Your AI Security Advisor" className={styles.heroAvatar} />
                    <div className={styles.heroAvatarGlow}></div>
                    <span className={styles.heroAiTag}>✨ AI-Generated</span>
                  </div>
                ) : null}
              </div>
            )}
            
            {messages.map((msg, i) => (
              msg.role === 'image' ? (
                <div key={i} className={styles.imageMessage}>
                  <img src={msg.content} alt="Security illustration" className={styles.generatedImage} />
                  <span className={styles.imageAiTag}>✨ Generated for you</span>
                </div>
              ) : (
                <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                  {msg.role === 'bot' && (
                    <div className={styles.msgAvatarWrap}>
                      {advisorAvatar ? (
                        <img src={advisorAvatar} alt="" className={styles.msgAvatarImg} />
                      ) : (
                        <div className={styles.msgAvatar}>🛡️</div>
                      )}
                    </div>
                  )}
                  <div className={styles.bubble}>
                    {msg.content.split('\n').map((line, j) => <p key={j}>{line || '\u00A0'}</p>)}
                  </div>
                  {msg.role === 'user' && <div className={styles.msgAvatar}>👤</div>}
                </div>
              )
            ))}
            
            {loading && (
              <div className={`${styles.message} ${styles.bot}`}>
                <div className={styles.msgAvatarWrap}>
                  {advisorAvatar ? (
                    <img src={advisorAvatar} alt="" className={styles.msgAvatarImg} />
                  ) : (
                    <div className={styles.msgAvatar}>🛡️</div>
                  )}
                </div>
                <div className={styles.bubble}><div className={styles.typing}><span></span><span></span><span></span></div></div>
              </div>
            )}
            
            {generatingImage && (
              <div className={styles.imageLoading}>
                <div className={styles.imageSpinner}></div>
                <span>Generating visual...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className={styles.scenarios}>
              <p>Try a sample scenario:</p>
              <div className={styles.scenarioButtons}>
                {SAMPLE_SCENARIOS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s.message)} className={styles.scenarioBtn}>{s.label}</button>
                ))}
              </div>
            </div>
          )}

          {showLeadCapture && (
            <div className={styles.leadCapture}>
              <h3>📧 Get your personalized security brief</h3>
              <form onSubmit={handleLeadSubmit} className={styles.leadForm}>
                <input type="email" placeholder="Your email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} className={styles.leadInput} />
                <input type="tel" placeholder="Phone (optional)" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} className={styles.leadInput} />
                <button type="submit" className={styles.leadSubmit}>Send My Brief →</button>
              </form>
            </div>
          )}

          {showRecommendation && !showLeadCapture && (
            <div className={styles.ctaBox}>
              <a href="https://www.data3.com/wp-content/uploads/2024/07/Data3-Managed-Extended-Detection-Response-Service-Brief.pdf" target="_blank" className={styles.ctaLink}>📄 MXDR Data Sheet</a>
              <a href="https://www.data3.com/services/managed-services/managed-security-services/" target="_blank" className={styles.ctaPrimary}>Talk to Our Team →</a>
              <button onClick={() => setShowLeadCapture(true)} className={styles.ctaClose}>📧 Email me details</button>
              <button onClick={handleClose} className={styles.ctaClose}>✕ Close</button>
            </div>
          )}

          <div className={styles.inputArea}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." rows="1" disabled={loading} />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      </main>

      <footer className={styles.footer}><p>Data<sup>#</sup>3 Limited | Australia's leading technology solutions provider</p></footer>
    </div>
  )
}
