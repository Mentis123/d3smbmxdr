import styles from './mining-home.module.css'

export const metadata = {title:'Mining experiences | Data#3',description:'Explore the Mining Lab, Mining AI Lab and Agent 0 Decision Room.',openGraph:{title:'Mining experiences | Data#3',description:'Three immersive ways to explore the mining business.'}}

export default function Home() {
 return <main className={styles.home}>
  <header className={styles.header}><span className={styles.brand}>Data<sup>#</sup>3</span><span>MINING & RESOURCES / EXPERIENCES</span></header>
  <section className={styles.intro}><p>EXPLORE. DISCOVER. DISCUSS.</p><h1>Mining, brought to life.</h1><div>Three ways to explore the industry, see technology at work and start a better customer conversation.</div></section>
  <section className={styles.showcase} aria-labelledby="mining-title"><div className={styles.visual}><iframe src="/lab-worlds/mining-region.html?embed=1&controls=compact&pins=0" title="Mining Lab region preview" loading="lazy"/><span>01 / THE SHOWCASE</span></div><div className={styles.feature}><p className={styles.kicker}>EXPLORE THE INDUSTRY</p><h2 id="mining-title">The Mining Lab</h2><p>Explore industry use cases brought to life. Enter a working world and discover three animated, narrated labs: mine operations, engineering delivery and export security.</p><a className={styles.primary} href="/mining/lab" target="_blank" rel="noopener noreferrer">Enter the Mining Lab <span>↗</span></a><small>Opens in a new window</small></div></section>
  <section className={styles.more} aria-label="More mining experiences">
   <article className={styles.card}><img src="/map-assets/mining-poster.jpg" alt="An open-pit mine and processing infrastructure"/><div><p className={styles.kicker}>02 / LOCAL AI IN ACTION</p><h2>The Mining AI Lab</h2><p>Explore Local AI Use Cases in an immersive 3D environment.</p><a href="/ai-lab/mining" target="_blank" rel="noopener noreferrer">Open the Mining AI Lab ↗</a><small>Opens in a new window</small></div></article>
   <article className={styles.card}><img src="/decision-room-art/agent-0.webp" alt="Agent 0 mining Decision Room"/><div><p className={styles.kicker}>03 / THE DECISION ROOM</p><h2>Agent 0</h2><p>The Cybersecurity and AI Mining Tabletop. Get customers talking about real tradeoffs in a scenario.</p><a href="/decision-room/agent-0" target="_blank" rel="noopener noreferrer">Open the Agent 0 Decision Room ↗</a><small>Opens in a new window</small></div></article>
  </section><footer className={styles.footer}>Data<sup>#</sup>3 · Delivering the Digital Future</footer>
 </main>
}
