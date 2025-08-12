import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/common/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { GlobalErrorProvider } from '@/components/common/GlobalErrorProvider';
import { GlobalLoadingSpinner } from '@/components/common/GlobalLoadingSpinner';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { AccessibilityProvider, SkipLinks } from '@/components/accessibility';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aptitude Chatbot',
  description: 'AI-powered aptitude test analysis and consultation platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AccessibilityProvider>
              <GlobalErrorProvider>
                <SkipLinks />
                {children}
                <GlobalLoadingSpinner />
                <Toaster />
                <ShadcnToaster />
              </GlobalErrorProvider>
            </AccessibilityProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
