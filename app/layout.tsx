import type { Metadata } from 'next';
import './globals.css';
import { DEFAULT_LOCALE, translations } from '@/lib/i18n';
export const metadata: Metadata = {
  title: translations[DEFAULT_LOCALE].title,
  description: translations[DEFAULT_LOCALE].description,
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body>{children}</body>
    </html>
  );
}
