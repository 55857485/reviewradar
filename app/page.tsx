import { redirect } from 'next/navigation';
import { getSupabaseUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getSupabaseUser();

  redirect(user ? '/dashboard' : '/login');
}
