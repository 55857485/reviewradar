import type { SubscriptionStatus } from '@prisma/client';
import { SignOutButton } from '@/components/layout/sign-out-button';

const statusLabels: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Подписка активна',
  INACTIVE: 'Подписка не активна',
  CANCELED: 'Подписка отменена',
  PAST_DUE: 'Ожидает оплаты',
};

type HeaderProps = {
  email: string;
  subscriptionStatus: SubscriptionStatus;
};

export function Header({ email, subscriptionStatus }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-200">{email}</p>
        <p className="text-xs text-neutral-500">{statusLabels[subscriptionStatus]}</p>
      </div>
      <SignOutButton />
    </header>
  );
}
