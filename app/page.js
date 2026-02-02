import Link from 'next/link'

export default function Home() {
  return (
    <>
      <header>
        <a href="https://www.data3.com" className="logo">Data<sup>#</sup>3</a>
        <a href="https://www.data3.com/services/managed-services/managed-security-services/" className="badge">SMB Security</a>
      </header>
      
      <section className="hero">
        <h1>Find Your Security Solution</h1>
        <p>Get a personalized MXDR recommendation for your business. Choose how you'd like to explore your options.</p>
      </section>
      
      <div className="tools">
        <Link href="/calculator" className="card">
          <div className="card-icon">🧮</div>
          <h3>Quick Calculator</h3>
          <p>Enter your business details and get an instant estimate. See pricing tiers, features included, and recommended solutions based on your size and needs.</p>
          <span className="card-cta">Calculate Now →</span>
        </Link>
        
        <Link href="/chat" className="card">
          <div className="card-icon">💬</div>
          <h3>Guided Assessment</h3>
          <p>Have a conversation about your security needs. Our AI assistant will ask the right questions and recommend the perfect solution for your situation.</p>
          <span className="card-cta">Start Chat →</span>
        </Link>
      </div>
      
      <section className="features">
        <h2>Why Data<sup>#</sup>3 MXDR?</h2>
        <div className="feature-grid">
          <div className="feature">
            <div className="feature-icon">🛡️</div>
            <div>
              <h4>24/7 Monitoring</h4>
              <p>Round-the-clock threat detection and response by security experts.</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <div>
              <h4>Rapid Response</h4>
              <p>Minutes to detect, hours to remediate. Not days or weeks.</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <div>
              <h4>SMB-Focused</h4>
              <p>Enterprise-grade security sized and priced for smaller businesses.</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <div>
              <h4>Clear Reporting</h4>
              <p>Monthly reports you can actually understand. No security jargon.</p>
            </div>
          </div>
        </div>
      </section>
      
      <footer>
        <p>Data<sup>#</sup>3 Limited | Australia's leading technology solutions provider</p>
        <p><a href="https://data3.com.au">data3.com.au</a></p>
      </footer>
    </>
  )
}
