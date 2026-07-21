import type { Metadata } from "next"
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { BRAND_NAME, SITE_URL, absoluteUrl } from "@/lib/seo"

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} | AI & Custom Software Development Agency`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "CodeTelemetryLab is an international software agency for AI development, automation, SaaS, MVP, and custom software. Serving US, Canada, UK, UAE, Australia, and India metros.",
  applicationName: BRAND_NAME,
  keywords: [
    "CodeTelemetryLab",
    "CodeTelemetry Lab",
    "CodeTelemetry",
    "AI development company",
    "AI automation agency",
    "custom software development",
    "SaaS development",
    "MVP development",
    "Next.js development",
    "React development company",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": absoluteUrl("/feed.xml"),
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/ct-labs-mark.png", type: "image/png" },
    ],
    apple: "/brand/ct-labs-mark.png",
  },
  openGraph: {
    title: `${BRAND_NAME} | AI & Custom Software Development Agency`,
    description:
      "AI development, automation, SaaS, MVP, and custom software for startups and product teams across the US, Canada, UK, UAE, Australia, and India.",
    url: SITE_URL,
    siteName: BRAND_NAME,
    images: [
      {
        url: "/brand/ct-labs-logo.png",
        width: 1536,
        height: 1024,
        alt: `${BRAND_NAME} — Code. Automate. Elevate.`,
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | AI & Custom Software Development Agency`,
    description:
      "AI development, automation, SaaS, MVP, and custom software for international product teams.",
    images: ["/brand/ct-labs-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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
