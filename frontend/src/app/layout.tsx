// app/layout.tsx

import './globals.css'
import type { Metadata } from 'next'
import { Space_Grotesk, DM_Sans, Playfair_Display } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import MainNav from '@/components/navigation/MainNav'
import { GlobalAuthModals } from '@/components/auth/GlobalAuthModals'
import { DragDropProtection } from '@/components/ui/DragDropProtection'

// Configure DM Sans font (replacing Inter)
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

// Configure Space Grotesk font (for headings)
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

// Configure Playfair Display font (retained for LOGO)
const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'Munich Weekly',
  description: 'Photography submissions and voting platform.',
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-gray-50 min-h-screen">
        <DragDropProtection>
          <AuthProvider>
            <MainNav />
            {children}
            <GlobalAuthModals />
          </AuthProvider>
        </DragDropProtection>
      </body>
    </html>
  )
}