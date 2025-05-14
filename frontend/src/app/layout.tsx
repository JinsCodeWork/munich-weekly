// app/layout.tsx

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import MainNav from '@/components/navigation/MainNav'

// 配置Inter字体
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Munich Weekly',
  description: 'Photography submissions and voting platform.',
  icons: {
    icon: { url: '/logo.svg', type: 'image/svg+xml' }
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          integrity="sha512-YLVtSjb/VXY29fqxrGqA13Ml6Iaq5rARImpIRvac0JERsav8+pkFN50GJHQv4W0UIHPTkc/3dqGcKmCrOi80Q==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </head>
      <body className="font-sans antialiased bg-gray-50 min-h-screen">
        <AuthProvider>
          <MainNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}