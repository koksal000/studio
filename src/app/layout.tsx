
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
        <meta name="153b392c8af2ea99e22d489f926074fe5c4a6c1d" content="153b392c8af2ea99e22d489f926074fe5c4a6c1d" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProviders> {/* Wrap with AppProviders for context/state */}
          {children}
          <Toaster /> {/* Add Toaster component */}
        </AppProviders>
        <script async src="https://quintessentialreport.com/b/3/V/0/P.3ypsv/b/mFVJJfZ/D/0p2yNsD/MD5hMpzMQp4HLaTwYT0BM/zRk/zwNkDfkw"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(huq){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = huq || {};
s.src = "//quintessentialreport.com/c.Db9L6-b/2/5rlWSEWgQa9nNLjZQAzNOzTHMd0hODC-0k2/NvDjMj5UM/zsQa5M";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
if (l && l.parentNode) {
  l.parentNode.insertBefore(s, l);
} else {
  document.body.appendChild(s); // Fallback if 'l' is not found
}
})({})
            `,
          }}
        />
      </body>
    </html>
  );
}
