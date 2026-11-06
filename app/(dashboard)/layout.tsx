import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { getSupabaseUser, ensureUserRecord } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabaseUser = await getSupabaseUser();

  if (!supabaseUser) {
    redirect('/login');
  }

  const dbUser = await ensureUserRecord(supabaseUser);

  if (!dbUser) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <Sidebar />

      <div className="flex min-h-screen flex-col">
        <Header email={dbUser.email} subscriptionStatus={dbUser.subscriptionStatus} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
