import type { Metadata } from 'next'
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Analytics } from "@vercel/analytics/next"

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EcoTuned - Energy Saving Made Simple',
  description: "Get personalised energy-saving recommendations based on your postcode's weather forecast",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>
          <header className="relative overflow-hidden bg-gradient-to-r from-eco-mint/50 via-eco-sky/50 to-eco-lemon/40 border-b-4 border-eco-sky">
            <div className="container max-w-6xl mx-auto px-4 lg:px-0 py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-5xl font-display font-black text-eco-black tracking-tighter uppercase">
                    EcoTuned
                  </h1>
                  <p className="text-sm text-eco-black font-bold uppercase tracking-wide mt-1">
                    Weather-smart energy tips
                  </p>
                </div>
                <div id="header-controls"></div>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6">
            {children}
            <Analytics />
          </main>
          <footer className="mt-16 relative overflow-hidden bg-gradient-to-r from-eco-sage/30 via-eco-mint/30 to-eco-azure/30 border-t-4 border-eco-mint">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center">
                <p className="text-eco-black/70 font-display font-black tracking-tighter uppercase text-base">
                  EcoTuned
                </p>
                <div className="mt-4 text-eco-black/60 text-xs space-y-1">
                  <p>
                    Weather data from{' '}
                    <a
                      href="https://open-meteo.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-eco-black transition underline"
                    >
                      Open-Meteo
                    </a>
                  </p>
                  <p>
                    Postcode lookup via{' '}
                    <a
                      href="https://postcodes.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-eco-black transition underline"
                    >
                      Postcodes.io
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
