import type { Metadata } from "next"
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://code-telemetry-lab.vercel.app"),
  title: {
    default: "CodeTelemetryLabs",
    template: "%s | CodeTelemetryLabs",
  },
  description:
    "Premium software engineering and automation for startups, agencies, and product teams.",
  applicationName: "CodeTelemetryLabs",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    title: "CodeTelemetryLabs",
    description:
      "Premium software engineering and automation for startups, agencies, and product teams.",
    url: "https://code-telemetry-lab.vercel.app",
    siteName: "CodeTelemetryLabs",
    images: ["/og-image.svg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeTelemetryLabs",
    description:
      "Premium software engineering and automation for startups, agencies, and product teams.",
    images: ["/og-image.svg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plusJakartaSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
