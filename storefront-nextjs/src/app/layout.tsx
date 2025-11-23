import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ApolloWrapper } from '@/lib/apollo-wrapper'
import { AuthProvider } from '@/lib/auth-context'
import { Header } from '@/components/Header'
import { CartDrawer } from '@/components/CartDrawer'
import TokenExpiredHandler from '@/components/TokenExpiredHandler'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Store - Produtos Premium',
  description: 'Descubra produtos extraordinários em nossa loja',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <ApolloWrapper>
          <AuthProvider>
            <Toaster 
              position="top-center"
              toastOptions={{
                style: {
                  borderRadius: '12px',
                  fontSize: '14px',
                },
              }}
            />
            <TokenExpiredHandler />
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <CartDrawer />
            
            {/* Apple-style footer */}
            <footer className="bg-gray-50 border-t border-gray-200">
              <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-12">
                <div className="text-center space-y-4">
                  <p className="text-xs text-gray-400">
                    Construído com Next.js 14, TypeScript, Tailwind CSS e Saleor
                  </p>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  )
}
