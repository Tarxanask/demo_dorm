import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'Dormzy',
  description: 'Connect with residents from Kaunas dormitories',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo.png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dormzy" />
        <meta name="application-name" content="Dormzy" />
        <meta name="msapplication-TileColor" content="#0070f3" />
        <meta name="msapplication-TileImage" content="/images/logo.png" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
      </head>
      <body>
        <Providers>
          {children}
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}

