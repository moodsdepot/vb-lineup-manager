import { Metadata } from 'next';
import './globals.css';

// Add basic metadata first
export const metadata: Metadata = {
  title: {
    default: 'LineupMan - Volleyball Lineup Manager',
    template: '%s | LineupMan'
  },
  description: 'Create, manage, and share your volleyball lineups with ease. A simple, intuitive tool for volleyball coaches.',
  keywords: ['volleyball', 'lineup', 'rotation', 'sports', 'coaching', 'team management', 'volleyball positions'],
  authors: [{ name: 'LineupMan' }],
  creator: 'LineupMan',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com', // Replace with your actual domain when ready
    title: 'LineupMan - Volleyball Lineup Manager',
    description: 'Create, manage, and share your volleyball lineups with ease',
    siteName: 'LineupMan',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LineupMan - Volleyball Lineup Manager',
    description: 'Create, manage, and share your volleyball lineups with ease',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
