'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history', label: 'История' },
  { href: '/billing', label: 'Подписка' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-neutral-800 bg-neutral-950/80 px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-bold text-indigo-300">
          RR
        </span>
        ReviewRadar
      </Link>

      <nav className="mt-5 flex gap-1 overflow-x-auto lg:mt-8 lg:flex-col lg:overflow-visible">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200',
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 hidden rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 text-xs leading-relaxed text-neutral-500 lg:block">
        AI-анализ отзывов для продавцов Wildberries и Ozon
      </div>
    </aside>
  );
}
