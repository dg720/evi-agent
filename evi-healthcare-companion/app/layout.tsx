import type React from "react"
import type { Metadata, Viewport } from "next"
import { Fraunces, IBM_Plex_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Evi – LBS Healthcare Companion",
  description:
    "Navigate NHS services with confidence. Fast, friendly guidance for GP registration, triage, eligibility, and next steps across UK care pathways.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0F1A2B",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${ibmPlexSans.variable}`}>
      <body className="font-sans antialiased">
        <div className="bg-coral text-white text-xs sm:text-sm text-center py-2 px-4">
          Not for emergencies. If you are in immediate danger, call 999.
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
