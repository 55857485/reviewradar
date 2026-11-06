'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SubscriptionStatus } from '@prisma/client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const statusLabels: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Активна',
  INACTIVE: 'Не активна',
  CANCELED: 'Отменена',
  PAST_DUE: 'Ожидает оплаты',
};

type ActivateResponse = {
  success?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  error?: string;
};

export function SubscriptionCard({ status }: { status: SubscriptionStatus }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isActive = status === 'ACTIVE';

  async function handleActivate() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/activate', { method: 'POST' });
      const payload = (await response.json().catch(() => null)) as ActivateResponse | null;

      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? 'Не удалось активировать подписку');
        return;
      }

      router.refresh();
    } catch {
      setError('Сеть недоступна. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>ReviewRadar Subscription</CardTitle>
        <CardDescription>
          Подписка на генерацию AI-отчётов по отзывам конкурентов.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
          <span className="text-sm text-neutral-400">Статус подписки</span>
          <span
            className={
              isActive
                ? 'text-sm font-medium text-emerald-300'
                : 'text-sm font-medium text-amber-300'
            }
          >
            {statusLabels[status]}
          </span>
        </div>

        <p className="text-sm text-neutral-300">
          {isActive
            ? 'Ваша подписка активна — можно загружать отзывы и генерировать отчёты.'
            : 'У вас нет активной подписки. Активируйте её, чтобы использовать генерацию отчётов.'}
        </p>

        {error ? <Alert variant="error">{error}</Alert> : null}
      </CardContent>

      {!isActive ? (
        <CardFooter>
          <Button onClick={handleActivate} disabled={isLoading}>
            {isLoading ? 'Активируем…' : 'Активировать подписку'}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
