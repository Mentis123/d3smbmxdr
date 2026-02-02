'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import styles from './chat.module.css'

const SYSTEM_PROMPT = `You are a friendly, knowledgeable security advisor for Data#3, Australia's leading technology solutions provider. You're helping SMB customers understand their MXDR (Managed Extended Detection and Response) options.

Your role:
1. Ask questions to understand their security needs
2. Explain concepts simply (avoid jargon)
3. Recommend appropriate solutions
4. Provide indicative pricing

Key questions to gather (naturally, not all at once):
- Company size (employees, endpoints)
- Industry (compliance needs vary)
- Current security setup
- Main concerns (ransomware, data theft, compliance)
- Budget range

MXDR Tiers (indicative monthly pricing):
- Essential ($30-35/endpoint): 24/7 monitoring, EDR, threat hunting, incident investigation
- Professional ($40-45/endpoint): + vulnerability management, compliance dashboards, dedicated analyst
- Enterprise ($50-60/endpoint): Full XDR, security team, executive briefings, IR retainer

Add-ons: Vulnerability Scanning (+$200/mo), Compliance Reporting (+$150/mo), Security Training (+$100/mo), IR Retainer (+$500/mo)

Volume discounts: 50+ endpoints = 8% off, 100+ = 15% off

Compliance-heavy industries (healthcare, finance, government) typically need Professional or Enterprise.

Be conversational, helpful, and genuinely interested in solving their security challenges. Keep responses concise (2-3 paragraphs max). When you have enough info, provide a recommendation with estimated pricing.`

const SAMPLE_INPUTS = [
  { label: "Small Retail (15 staff)", message: "We're a small retail business with about 15 employees and maybe 20 computers including our POS systems. We've heard about ransomware attacks on retailers and want to make sure we're protected." },
  { label: "Medical Clinic (40 staff)", message: "I run a medical clinic with 40 staff members. We handle patient records so we need to be compliant with privacy regulations. We currently just have antivirus but I'm worried it's not enough anymore." },
  { label: "Accounting Firm (25 staff)", message: "We're an accounting firm with 25 people. We handle sensitive financial data for our clients and need to demonstrate we have proper security. Some clients are asking about our security certifications." },
  { label: "Manufacturing (80 staff)", message: "We're a manufacturing company with about 80 employees across our office and factory floor. We've got a mix of regular computers and some industrial systems. Had a close call with a phishing email last month." }
]

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: "👋 Hi there! I'm your Data#3 security advisor.\n\nI'm here to help you find the right MXDR solution for your business. I'll ask a few questions to understand your needs, and then recommend the best fit.\n\nTo start, could you tell me a bit about your business? How many employees do you have, and what industry are you in?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      setMessages(prev => [...prev, { role: 'bot', content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or use our Quick Calculator for an instant estimate." }])
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={styles.container}>
      <header>
        <a href="https://www.data3.com" className="logo">Data<sup>#</sup>3</a>
        <div className={styles.headerRight}>
          <Link href="/calculator" className={styles.calcLink}>🧮 Quick Calculator</Link>
          <Link href="/" className={styles.backLink}>← Back</Link>
        </div>
      </header>

      <div className={styles.chatContainer}>
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
              <div className={styles.avatar}>{msg.role === 'bot' ? '🛡️' : '👤'}</div>
              <div className={styles.bubble}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className={`${styles.message} ${styles.bot}`}>
              <div className={styles.avatar}>🛡️</div>
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
          <div className={styles.sampleInputs}>
            <p>Try a sample scenario:</p>
            <div className={styles.sampleButtons}>
              {SAMPLE_INPUTS.map((sample, i) => (
                <button key={i} onClick={() => sendMessage(sample.message)} className={styles.sampleBtn}>
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows="1"
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>→</button>
          </div>
        </div>
      </div>
    </div>
  )
}
