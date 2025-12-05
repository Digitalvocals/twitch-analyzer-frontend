import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StreamScout - Find Your Best Twitch Streaming Opportunities',
  description: 'Real-time analysis of 120+ Twitch games. Discover hidden streaming opportunities with low competition and high discoverability. Free forever.',
  keywords: 'twitch streaming, best games to stream, twitch analytics, streaming opportunities, grow twitch channel, small streamer tips, twitch growth, stream discoverability',
  authors: [{ name: 'StreamScout' }],
  creator: 'StreamScout',
  publisher: 'StreamScout',
  metadataBase: new URL('https://streamscout.gg'),
  alternates: {
    canonical: 'https://streamscout.gg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://streamscout.gg',
    siteName: 'StreamScout',
    title: 'StreamScout - Find Your Best Twitch Streaming Opportunities',
    description: 'Real-time analysis of 120+ Twitch games. Discover hidden streaming opportunities with low competition and high discoverability.',
    images: [
      {
        url: '/streamscout-logo.jpg',
        width: 1024,
        height: 341,
        alt: 'StreamScout - Find Your Audience. Grow Your Channel.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamScout - Find Your Best Twitch Streaming Opportunities',
    description: 'Real-time analysis of 120+ Twitch games. Discover hidden streaming opportunities for small streamers.',
    images: ['/streamscout-logo.jpg'],
    creator: '@StreamScoutGG',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google-adsense-account': 'ca-pub-6164260798755117',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-X5JXBGFR5Z"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-X5JXBGFR5Z');
          `}
        </Script>
        
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6164260798755117"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
