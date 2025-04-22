import { Metadata, Viewport } from 'next';
import './globals.css';

// --- Define metadataBase with your actual domain ---
const productionUrl = process.env.NODE_ENV === 'production' 
  ? new URL('https://lineupman.net') // Use your domain here
  : new URL(`http://localhost:${process.env.PORT || 3000}`);

// --- Define Metadata ---
export const metadata: Metadata = {
  // Add metadataBase
  metadataBase: productionUrl,
  
  title: {
    default: 'LineupMan - Volleyball Lineup Manager',
    template: '%s | LineupMan'
  },
  description: 'Create, manage, and share your volleyball lineups with ease. A simple, intuitive tool for volleyball coaches.',
  keywords: ['volleyball', 'lineup', 'rotation', 'sports', 'coaching', 'team management', 'volleyball positions'],
  authors: [{ name: 'LineupMan' }],
  creator: 'LineupMan',
  
  icons: {
    icon: '/volleyball-logo.png', 
    shortcut: '/volleyball-logo.png',
    apple: '/volleyball-logo.png',
  },
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'LineupMan - Volleyball Lineup Manager',
    description: 'Create, manage, and share your volleyball lineups with ease',
    siteName: 'LineupMan',
    images: [ 
      {
        url: '/volleyball-logo.png', 
        width: 100,
        height: 100,
        alt: 'LineupMan Volleyball Logo', 
      },
    ],
  },
  
  twitter: {
    card: 'summary', 
    title: 'LineupMan - Volleyball Lineup Manager',
    description: 'Create, manage, and share your volleyball lineups with ease',
    images: ['/volleyball-logo.png'], 
  },
};

// --- Define Viewport Separately ---
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// --- Root Layout Component ---
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased overflow-auto touch-pan-y">
        {children}
      </body>
    </html>
  );
}
