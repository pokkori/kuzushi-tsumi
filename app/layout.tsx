import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '崩し積み Stack Collapse',
  description: '6列x12行のグリッドでブロックを操作し、同色の横1行を揃えて消すパズルゲーム。',
  openGraph: {
    title: '崩し積み Stack Collapse',
    description: 'ブロックの抜き取り・挿入によるストック機能が戦略性の核。',
    images: ['/api/og'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0D1117" />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
