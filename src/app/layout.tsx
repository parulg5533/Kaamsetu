import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KaamSetu — Connecting Local Work with Local Workers',
  description: 'Hyperlocal two-sided marketplace for informal and short-term daily wage labor.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="app-viewport">{children}</main>
      </body>
    </html>
  );
}
