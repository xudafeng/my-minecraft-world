import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '我的世界 · 林间小屋',
  description: '走进你的方块小世界。探索树林和小屋，挖掘方块，自由建造。',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
