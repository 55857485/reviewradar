import { redirect } from 'next/navigation';
import { SubscriptionCard } from '@/components/billing/subscription-card';
import { getCurrentDbUser } from '@/lib/auth';

export default async function BillingPage() {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Billing</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Управление подпиской ReviewRadar. В MVP активация происходит без реальной оплаты.
        </p>
      </div>

      <SubscriptionCard status={user.subscriptionStatus} />
    </div>
  );
}
