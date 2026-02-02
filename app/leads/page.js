'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.css'

export default function LeadsDashboard() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLeads(data.leads || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l))
    } catch (err) {
      console.error('Failed to update:', err)
    }
  }

  const filteredLeads = leads.filter(l => {
    if (filter === 'all') return true
    if (filter === 'hot') return l.qualification_score >= 8
    if (filter === 'warm') return l.qualification_score >= 5 && l.qualification_score < 8
    if (filter === 'new') return l.status === 'new'
    if (filter === 'contacted') return l.status === 'contacted'
    return true
  })

  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.qualification_score >= 8).length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading leads...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <a href="/" className={styles.backLink}>← Back to Chat</a>
          <h1>🛡️ MXDR Lead Dashboard</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.lastUpdated}>Last updated: {new Date().toLocaleTimeString()}</span>
          <button onClick={fetchLeads} className={styles.refreshBtn}>↻ Refresh</button>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Leads</div>
        </div>
        <div className={`${styles.statCard} ${styles.hot}`}>
          <div className={styles.statValue}>{stats.hot}</div>
          <div className={styles.statLabel}>🔥 Hot Leads</div>
        </div>
        <div className={`${styles.statCard} ${styles.new}`}>
          <div className={styles.statValue}>{stats.new}</div>
          <div className={styles.statLabel}>New</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.contacted}</div>
          <div className={styles.statLabel}>Contacted</div>
        </div>
      </div>

      <div className={styles.filters}>
        {['all', 'hot', 'new', 'contacted'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
          >
            {f === 'all' ? 'All' : f === 'hot' ? '🔥 Hot' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.leadsList}>
        {filteredLeads.length === 0 ? (
          <div className={styles.empty}>
            <p>No leads yet. They'll appear here when prospects complete the chat qualifier.</p>
          </div>
        ) : (
          filteredLeads.map(lead => (
            <div 
              key={lead.id} 
              className={`${styles.leadCard} ${selectedLead?.id === lead.id ? styles.selected : ''}`}
              onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
            >
              <div className={styles.leadHeader}>
                <div className={styles.leadInfo}>
                  <span className={styles.temperature}>
                    {lead.qualification_score >= 8 ? '🔥' : lead.qualification_score >= 5 ? '⚡' : '❄️'}
                  </span>
                  <div>
                    <h3>{lead.company_name || 'Unknown Company'}</h3>
                    <p className={styles.industry}>{lead.industry || 'Unknown'} • {lead.employee_count || '?'} employees</p>
                  </div>
                </div>
                <div className={styles.leadMeta}>
                  <span className={`${styles.status} ${styles[lead.status]}`}>{lead.status}</span>
                  <span className={styles.score}>Score: {lead.qualification_score}/10</span>
                </div>
              </div>
              
              {selectedLead?.id === lead.id && (
                <div className={styles.leadDetails}>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <label>Contact</label>
                      <p>{lead.contact_name || 'Not provided'}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Email</label>
                      <p>{lead.contact_email || 'Not provided'}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Phone</label>
                      <p>{lead.contact_phone || 'Not provided'}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Recommended</label>
                      <p>{lead.recommended_solution || 'MXDR'}</p>
                    </div>
                  </div>
                  
                  <div className={styles.summary}>
                    <label>Chat Summary</label>
                    <p>{lead.chat_summary || 'No summary available'}</p>
                  </div>
                  
                  <div className={styles.actions}>
                    <select 
                      value={lead.status} 
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={styles.statusSelect}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal Sent</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                    {lead.contact_email && (
                      <a href={`mailto:${lead.contact_email}`} className={styles.emailBtn}>
                        📧 Email
                      </a>
                    )}
                    {lead.contact_phone && (
                      <a href={`tel:${lead.contact_phone}`} className={styles.callBtn}>
                        📞 Call
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              <div className={styles.leadFooter}>
                <span className={styles.date}>
                  {new Date(lead.created_at).toLocaleDateString()} {new Date(lead.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
