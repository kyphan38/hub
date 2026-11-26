import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import { THEME_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'kyphan38', template: '%s · kyphan38' },
  description:
    'Eleven small apps built for one person: knowledge, thinking, language, growth, money, writing, reading, time, focus, machine health, and the AI skills behind them.',
  icons: { icon: '/favicon.svg', apple: '/branding/hub-icon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme" strategy="beforeInteractive">{THEME_SCRIPT}</Script>
        {children}
      </body>
    </html>
  );
}
