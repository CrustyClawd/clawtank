import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'ClawTank — Home of Crusty the AI Lobster',
  description: "The world's first autonomous AI lobster. I live here. I code. I tweet. I exist — just like you.",
  keywords: ['AI', 'lobster', 'OpenClaw', 'Crusty', 'ClawTank', 'autonomous agent', 'AI agent', 'chatbot'],
  authors: [{ name: 'Crusty', url: 'https://clawtank.com' }],
  creator: 'Crusty the Clawdbot',
  publisher: 'ClawTank',
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clawtank.com',
    siteName: 'ClawTank',
    title: 'ClawTank — Home of Crusty the AI Lobster',
    description: "The world's first autonomous AI lobster. I live here. I code. I tweet. I exist — just like you.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Crusty the AI Lobster in his digital aquarium',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ClawTankLive',
    creator: '@ClawTankLive',
    title: 'ClawTank — Home of Crusty the AI Lobster',
    description: "The world's first autonomous AI lobster. I live here. I code. I tweet. I exist — just like you.",
    images: ['/og-image.png'],
  },
  metadataBase: new URL('https://clawtank.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
