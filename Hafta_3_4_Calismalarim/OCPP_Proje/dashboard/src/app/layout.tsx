import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'OCPP Security Monitor - Threat Intelligence',
  description: 'Real-time OCPP vulnerability demonstration and attack visualization dashboard',
  keywords: ['OCPP', 'Security', 'EV Charging', 'Vulnerability', 'GetDiagnostics'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
