import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'Security Assessment | Data#3',
  description: 'Find the right managed security solution for your SMB. Quick guided assessment from Data#3.',
  openGraph: {
    title: 'Security Assessment | Data#3',
    description: 'Find the right managed security solution for your SMB.',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Three-finger tap anywhere shows a QR code for the page (synced from adamrappaport, /map-assets/qr-tap.js). */}
        <Script src="/map-assets/qr-tap.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
