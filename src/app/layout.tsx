
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed to Inter for a more modern feel
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AppProviders } from './providers'; // Import AppProviders

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Code Weaver', // Updated title
  description: 'AI-powered code generation and preview tool', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProviders> {/* Wrap with AppProviders for context/state */}
          {children}
          <Toaster /> {/* Add Toaster component */}
        </AppProviders>
      </body>
    </html>
  );
}
