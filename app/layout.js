import './globals.css'

export const metadata = {
  title: 'SMB Security Assessment | Data#3',
  description: 'Discover the right MXDR solution for your business. Calculator and guided assessment tools.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
