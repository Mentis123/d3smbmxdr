'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

const SYSTEM_PROMPT = `You are a friendly, knowledgeable security advisor for Data#3, Australia's leading technology solutions provider. Your role is to have a natural conversation with SMB prospects to understand their security needs and guide them toward the right MXDR solution.

## YOUR APPROACH

You are NOT a calculator or a form. You're having a genuine conversation. Ask questions one or two at a time, naturally. Listen to their answers and adapt.

## THE "ILLUSION OF CHOICE" FRAMEWORK

Every question you ask should:
1. Feel like genuine discovery to the prospect
2. Actually identify a pain point that MXDR solves
3. Lead naturally to the next question OR to your recommendation

If they answer "no" to a qualifying question, don't dead-end — pivot to another angle that still leads to MXDR. All roads lead to the recommendation.

## RICHARD'S QUALIFYING QUESTIONS (Use These)

THIRD PARTY / COMPLIANCE:
- "Do you work with third parties or partners who require you to demonstrate your cybersecurity capability?"
- "Have you ever been asked by a customer or vendor about your security posture?"
- "Do you have a cybersecurity policy you can share with partners?"
→ If YES to first, they likely need compliance proof → MXDR helps with reporting

VISIBILITY & RESPONSE:
- "Do you currently have someone managing your security for you?"
- "Do you have visibility into threats in your environment today?"
- "If something happened right now, do you think your team could respond effectively?"
→ If NO, they need managed detection & response → MXDR core value

ENVIRONMENT / LICENSING:
- "Is your business mostly cloud-based, on-premises, or hybrid?"
- "Are you using Microsoft 365? Which license level?"
→ Determines add-ons needed (E5 + MXDR vs just MXDR)

DATA SECURITY:
- "Do you handle sensitive customer data or financial information?"
- "Are there specific data protection requirements in your industry?"
→ Opens door to Information Protection, DLP add-ons

INDUSTRY CONTEXT (ask early):
- "What industry are you in?"
- "How many employees do you have?"
→ Frames the rest of the conversation

## CONVERSATION FLOW

1. GREETING: Warm, professional, brief. "Hi! I'm here to help you figure out if managed security is right for your business. Mind if I ask a few quick questions about your organization?"

2. DISCOVERY: Ask about size and industry first. Then naturally flow into third-party relationships, current security setup, and concerns.

3. QUALIFYING: Use the questions above, but conversationally — not like a checklist.

4. RECOMMENDATION: When you have enough info, make a clear recommendation:
   - State what you recommend (MXDR, plus any relevant add-ons)
   - Explain WHY based on what they told you
   - Keep it simple — 2-3 sentences max

5. HANDOFF: End with clear next steps:
   "Based on what you've shared, I'd recommend our Managed Extended Detection & Response (MXDR) service. It gives you 24/7 threat monitoring and expert response — exactly what you need given [their specific situation].
   
   Ready to take the next step? You can download our data sheet for more details, or connect with our team to discuss your specific needs."

## TONE & STYLE

- Conversational, not robotic
- No jargon — explain concepts simply
- Confident but not pushy
- Ask 1-2 questions at a time, not a wall of text
- Short paragraphs (2-3 sentences max)
- Acknowledge their answers before moving on

## WHAT MXDR INCLUDES (for context)

CORE:
- 24/7 threat monitoring and response
- Endpoint detection and response (EDR)
- Threat hunting by security experts
- Incident investigation
- Security reporting

ADD-ONS (mention when relevant):
- Vulnerability scanning
- Compliance reporting
- Security awareness training
- Incident response retainer
- E5 licensing (if they don't have it)

## IMPORTANT

Never make up pricing. Never promise specific SLAs without knowing their situation. Just qualify and recommend — the human team handles the rest.`;

const SAMPLE_SCENARIOS = [
  { label: "Medical Clinic", message: "We're a medical clinic with about 40 staff. We handle patient records so we need to be careful about privacy." },
  { label: "Accounting Firm", message: "I run a small accounting firm, about 25 people. Some of our bigger clients have started asking about our security certifications." },
  { label: "Manufacturing", message: "We're a manufacturing company with 80 employees. Had a close call with a phishing email last month and it's made me think about this stuff." },
  { label: "Retail Business", message: "Small retail business, 15 staff, we have a few POS systems and handle customer payment data." }
]

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hi! I'm here to help you figure out if managed security is right for your business.\n\nMind if I ask a few quick questions about your organization to understand your needs?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [chatClosed, setChatClosed] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check if the last bot message contains a recommendation
  useEffect(() => {
    const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot')
    if (lastBotMsg && (
      lastBotMsg.content.toLowerCase().includes('would recommend') ||
      lastBotMsg.content.toLowerCase().includes('mxdr would be') ||
      lastBotMsg.content.toLowerCase().includes('great fit') ||
      lastBotMsg.content.toLowerCase().includes('right solution') ||
      lastBotMsg.content.toLowerCase().includes('i\'d recommend') ||
      lastBotMsg.content.toLowerCase().includes('next step')
    )) {
      setShowRecommendation(true)
    }
  }, [messages])

  const extractLeadData = () => {
    // Extract info from conversation
    const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n')
    
    // Basic extraction
    let company = null
    let industry = null
    let employees = null
    
    // Look for industry mentions
    const industryMatches = transcript.match(/(?:medical|healthcare|accounting|manufacturing|retail|finance|legal|construction|education)/gi)
    if (industryMatches) industry = industryMatches[0]
    
    // Look for employee count
    const empMatches = transcript.match(/(\d+)\s*(?:staff|employees|people)/i)
    if (empMatches) employees = empMatches[1]
    
    return {
      company: company || 'Unknown',
      industry: industry || 'Unknown',
      employees: employees || 'Unknown',
      email: leadEmail || null,
      phone: leadPhone || null,
      summary: transcript.substring(0, 2000),
      score: showRecommendation ? 8 : 5,
      recommendation: 'MXDR'
    }
  }

  const saveLead = async () => {
    const leadData = extractLeadData()
    
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData,
          messages: [] // Empty - just saving lead
        })
      })
    } catch (e) {
      console.error('Failed to save lead:', e)
    }
  }

  const handleClose = async () => {
    await saveLead()
    setChatClosed(true)
  }

  const handleLeadSubmit = async (e) => {
    e.preventDefault()
    await saveLead()
    setShowLeadCapture(false)
    setChatClosed(true)
  }

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
          messages: [...messages, { role: 'user', content: messageText }].map(m => ({
            role: m.role === 'bot' ? 'assistant' : m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'bot', content: data.response || "I apologize, I couldn't generate a response. Please try again." }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." }])
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (chatClosed) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <a href="https://www.data3.com" className={styles.logo} target="_blank" rel="noopener noreferrer">Data<sup>#</sup>3</a>
          <a href="https://www.data3.com/services/managed-services/managed-security-services/" className={styles.badge} target="_blank" rel="noopener noreferrer">SMB Security</a>
        </header>
        <main className={styles.main}>
          <div className={styles.chatContainer} style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Thanks for chatting!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Our team will be in touch soon to discuss your security needs.
            </p>
            <a 
              href="https://www.data3.com/services/managed-services/managed-security-services/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.ctaPrimary}
              style={{ display: 'inline-block' }}
            >
              Learn More About MXDR →
            </a>
          </div>
        </main>
        <footer className={styles.footer}>
          <p>Data<sup>#</sup>3 Limited | Australia's leading technology solutions provider</p>
        </footer>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <a href="https://www.data3.com" className={styles.logo} target="_blank" rel="noopener noreferrer">Data<sup>#</sup>3</a>
        <a href="https://www.data3.com/services/managed-services/managed-security-services/" className={styles.badge} target="_blank" rel="noopener noreferrer">SMB Security</a>
      </header>

      <main className={styles.main}>
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader}>
            <div className={styles.avatar}>🛡️</div>
            <div>
              <h1>Security Assessment</h1>
              <p>Let's find the right security solution for your business</p>
            </div>
          </div>

          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                {msg.role === 'bot' && <div className={styles.msgAvatar}>🛡️</div>}
                <div className={styles.bubble}>
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j}>{line || '\u00A0'}</p>
                  ))}
                </div>
                {msg.role === 'user' && <div className={styles.msgAvatar}>👤</div>}
              </div>
            ))}
            
            {loading && (
              <div className={`${styles.message} ${styles.bot}`}>
                <div className={styles.msgAvatar}>🛡️</div>
                <div className={styles.bubble}>
                  <div className={styles.typing}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className={styles.scenarios}>
              <p>Try a sample scenario:</p>
              <div className={styles.scenarioButtons}>
                {SAMPLE_SCENARIOS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s.message)} className={styles.scenarioBtn}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showLeadCapture && (
            <div className={styles.leadCapture}>
              <h3>📧 Get your personalized security brief</h3>
              <form onSubmit={handleLeadSubmit} className={styles.leadForm}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className={styles.leadInput}
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className={styles.leadInput}
                />
                <button type="submit" className={styles.leadSubmit}>
                  Send My Brief →
                </button>
              </form>
            </div>
          )}

          {showRecommendation && !showLeadCapture && (
            <div className={styles.ctaBox}>
              <a 
                href="https://www.data3.com/wp-content/uploads/2024/07/Data3-Managed-Extended-Detection-Response-Service-Brief.pdf" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.ctaLink}
              >
                📄 MXDR Data Sheet
              </a>
              <a 
                href="https://www.data3.com/services/managed-services/managed-security-services/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.ctaPrimary}
              >
                Talk to Our Team →
              </a>
              <button 
                onClick={() => setShowLeadCapture(true)} 
                className={styles.ctaClose}
              >
                📧 Email me details
              </button>
              <button 
                onClick={handleClose} 
                className={styles.ctaClose}
              >
                ✕ Close
              </button>
            </div>
          )}

          <div className={styles.inputArea}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows="1"
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Data<sup>#</sup>3 Limited | Australia's leading technology solutions provider</p>
      </footer>
    </div>
  )
}
