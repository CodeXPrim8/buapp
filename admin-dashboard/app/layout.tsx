import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BU Admin Dashboard',
  description: 'Super Admin Dashboard for Bison Note App',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
