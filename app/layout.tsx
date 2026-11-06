import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReviewRadar — AI-анализ отзывов конкурентов',
  description:
    'Загрузите отзывы конкурентов с Wildberries и Ozon и получите разбор трёх главных проблем товара с рекомендациями по карточке.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#07070b] text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
