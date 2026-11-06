import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { isSupabaseConfigured } from '@/lib/env';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(99,102,241,0.18),transparent_70%)]" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-sm font-semibold text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-bold text-indigo-300">
            RR
          </span>
          ReviewRadar
        </Link>

        {!configured ? (
          <Alert variant="warning" className="mb-4">
            Supabase не настроен: заполните <code>NEXT_PUBLIC_SUPABASE_URL</code> и{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> в файле <code>.env</code> и перезапустите
            сервер.
          </Alert>
        ) : null}

        {children}
      </div>
    </div>
  );
}
