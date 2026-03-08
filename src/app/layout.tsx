import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  variable: '--font-heebo',
  subsets: ['latin', 'hebrew'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Modelo - הדפסת תלת מימד בהזמנה אישית',
  description:
    'מצאו מבין אלפי מודלים תלת מימדיים, התאימו אישית והזמינו הדפסה. פלטפורמת הדפסת 3D המובילה בישראל.',
  keywords: ['הדפסת תלת מימד', '3D printing', 'מודלים', 'הדפסה בהזמנה'],
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icons/favicon.png', type: 'image/png' }],
    shortcut: ['/icons/favicon.png'],
    apple: [{ url: '/icons/favicon.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'Modelo - הדפסת תלת מימד בהזמנה אישית',
    description: 'מצאו, התאימו והזמינו הדפסת 3D בקלות',
    locale: 'he_IL',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
