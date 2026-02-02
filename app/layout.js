import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
