import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import NotificationHandler from '@/components/NotificationHandler';
import AuthButton from '@/components/AuthButton';
import Link from 'next/link';

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
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
        />
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                  if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                    window.location.href = event.data.url || '/home';
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          {/* Mobile-responsive header */}
          <header style={{
            position: 'sticky',
            top: 0,
            background: '#303030',
            borderBottom: '1px solid #555555',
            padding: '0.75rem 1rem',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Link href="/home" style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#667eea',
              textDecoration: 'none'
            }}>
              Dormzy
            </Link>
            
            <AuthButton />
          </header>
          
          {children}
          <PWAInstallPrompt />
          <NotificationHandler />
        </Providers>
      </body>
    </html>
  );
}

