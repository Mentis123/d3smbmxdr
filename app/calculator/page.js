'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './calculator.module.css'

const basePricing = {
  essential: { base: 30, min: 500 },
  professional: { base: 40, min: 750 },
  enterprise: { base: 55, min: 1200 }
}

const industryMultiplier = {
  general: 1, professional: 1.1, healthcare: 1.25,
  finance: 1.3, retail: 1.05, manufacturing: 1.1, government: 1.15
}

const slaMultiplier = { '24': 1, '8': 1.15, '4': 1.35 }

const addons = { vuln: 200, compliance: 150, training: 100, ir: 500 }

const tierFeatures = {
  essential: ['24/7 threat monitoring', 'Endpoint detection & response', 'Expert threat hunting', 'Incident investigation', 'Monthly security reports'],
  professional: ['24/7 threat monitoring', 'Endpoint detection & response', 'Expert threat hunting', 'Incident investigation', 'Weekly security reports', 'Vulnerability management', 'Compliance dashboards', 'Dedicated analyst'],
  enterprise: ['24/7 threat monitoring', 'Full XDR capabilities', 'Advanced threat hunting', 'Incident investigation & remediation', 'Real-time dashboards', 'Vulnerability management', 'Compliance automation', 'Dedicated security team', 'Executive briefings', 'Tabletop exercises']
}

const tierDescriptions = {
  essential: '24/7 monitoring with expert response',
  professional: 'Enhanced protection with dedicated support',
  enterprise: 'Full XDR with white-glove service'
}

export default function Calculator() {
  const [endpoints, setEndpoints] = useState(25)
  const [employees, setEmployees] = useState(20)
  const [industry, setIndustry] = useState('general')
  const [sla, setSla] = useState('24')
  const [addonsSelected, setAddonsSelected] = useState({ vuln: false, compliance: false, training: false, ir: false })
  const [result, setResult] = useState({ tier: 'essential', total: 875, perEndpoint: 35 })

  useEffect(() => {
    calculate()
  }, [endpoints, employees, industry, sla, addonsSelected])

  const calculate = () => {
    let tier = 'essential'
    const complianceIndustries = ['healthcare', 'finance', 'government']
    
    if (endpoints > 100 || complianceIndustries.includes(industry) || sla === '4' || addonsSelected.ir) {
      tier = 'enterprise'
    } else if (endpoints > 50 || addonsSelected.compliance || addonsSelected.vuln || sla === '8') {
      tier = 'professional'
    }

    const pricing = basePricing[tier]
    let perEndpoint = pricing.base * industryMultiplier[industry] * slaMultiplier[sla]
    
    if (endpoints >= 100) perEndpoint *= 0.85
    else if (endpoints >= 50) perEndpoint *= 0.92

    let total = Math.max(perEndpoint * endpoints, pricing.min)
    
    if (addonsSelected.vuln) total += addons.vuln
    if (addonsSelected.compliance) total += addons.compliance
    if (addonsSelected.training) total += addons.training
    if (addonsSelected.ir) total += addons.ir

    setResult({ tier, total: Math.round(total), perEndpoint: perEndpoint.toFixed(2) })
  }

  const toggleAddon = (key) => {
    setAddonsSelected(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      <header>
        <a href="https://www.data3.com" className="logo">Data<sup>#</sup>3</a>
        <Link href="/" className={styles.backLink}>← Back to Options</Link>
      </header>

      <main className={styles.main}>
        <div className={styles.form}>
          <h2>MXDR Calculator</h2>
          <p>Enter your business details to get a personalized estimate.</p>

          <div className={styles.formGroup}>
            <label>Number of Endpoints <small>(desktops, laptops, servers)</small></label>
            <input type="number" min="1" max="500" value={endpoints} onChange={(e) => setEndpoints(Number(e.target.value))} />
          </div>

          <div className={styles.formGroup}>
            <label>Number of Employees</label>
            <input type="number" min="1" max="500" value={employees} onChange={(e) => setEmployees(Number(e.target.value))} />
          </div>

          <div className={styles.formGroup}>
            <label>Industry</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="general">General Business</option>
              <option value="professional">Professional Services</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Financial Services</option>
              <option value="retail">Retail</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="government">Government/Education</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Response SLA Required</label>
            <select value={sla} onChange={(e) => setSla(e.target.value)}>
              <option value="24">24-hour response</option>
              <option value="8">8-hour response</option>
              <option value="4">4-hour response (Premium)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Additional Services Needed</label>
            <div className={styles.checkboxGroup}>
              {[
                { key: 'vuln', label: 'Vulnerability Scanning' },
                { key: 'compliance', label: 'Compliance Reporting' },
                { key: 'training', label: 'Security Training' },
                { key: 'ir', label: 'IR Retainer' }
              ].map(({ key, label }) => (
                <label key={key} className={`${styles.checkboxItem} ${addonsSelected[key] ? styles.checked : ''}`}>
                  <input type="checkbox" checked={addonsSelected[key]} onChange={() => toggleAddon(key)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.results}>
          <div className={styles.resultsCard}>
            <h2>Your Recommendation</h2>
            
            <div className={`${styles.recommendation} ${styles[result.tier]}`}>
              <h3>{result.tier.charAt(0).toUpperCase() + result.tier.slice(1)}</h3>
              <p>{tierDescriptions[result.tier]}</p>
            </div>

            <div className={styles.priceDisplay}>
              <div className={styles.amount}>${result.total.toLocaleString()}</div>
              <div className={styles.period}>per month</div>
              <div className={styles.perEndpoint}>${result.perEndpoint} per endpoint</div>
            </div>

            <ul className={styles.featuresList}>
              {tierFeatures[result.tier].map((feature, i) => (
                <li key={i}><span className={styles.check}>✓</span> {feature}</li>
              ))}
            </ul>
          </div>

          <Link href="/chat" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
            Discuss with an Advisor →
          </Link>

          <p className={styles.disclaimer}>* Estimates are indicative only. Final pricing subject to assessment.</p>
        </div>
      </main>
    </>
  )
}
