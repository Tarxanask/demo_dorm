import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dormzy - Student Community Platform',
  description: 'Connect with students in KTU, LSMU, VDU dorms. Chat, organize events, and build your community.',
  manifest: '/manifest.json',
  themeColor: '#0070f3',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dormzy',
  },
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
  keywords: 'dormzy, student dorms, university housing, dorm chat, student community, KTU, LSMU, VDU, Lithuania students',
  authors: [{ name: 'Dormzy' }],
  openGraph: {
    title: 'Dormzy - Student Community Platform',
    description: 'Connect with students in your dorm. Chat, events, and community.',
    url: 'https://dormzy.vercel.app',
    siteName: 'Dormzy',
    images: [
      {
        url: 'https://dormzy.vercel.app/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'Dormzy - Student Community Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dormzy - Student Community Platform',
    description: 'Connect with students in your dorm',
    images: ['https://dormzy.vercel.app/images/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};
