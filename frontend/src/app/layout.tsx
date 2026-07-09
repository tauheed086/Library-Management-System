import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// Provider Imports
import QueryProvider from '../components/QueryProvider';
import ThemeProvider from '../components/ThemeProvider';
import ToastContainer from '../components/ToastContainer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Nexus LMS - Enterprise Library Management System',
  description: 'Premium Enterprise Library Management System',
  viewport: 'width=device-width, initial-scale=1'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col font-sans bg-background text-foreground`}>
        <QueryProvider>
          <ThemeProvider>
            <ToastContainer />
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
