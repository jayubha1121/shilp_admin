import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shilp Admin',
  description: 'Manage the Shilp project portfolio.',
  icons: {
    icon: '/favicon-shilp.png',
    shortcut: '/favicon-shilp.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}