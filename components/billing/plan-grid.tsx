'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SubscriptionPlan } from '@prisma/client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PLANS, formatPrice, pricePerReport } from '@/lib/plans';
import { cn } from '@/lib/utils';

type PurchaseResponse = {
  success?: boolean;
  plan?: SubscriptionPlan;
  reportsLeft?: number | null;
  error?: string;
};

export function PlanGrid({ currentPlan }: { currentPlan: SubscriptionPlan | null }) {
  const router = useRouter();
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function purchase(planId: SubscriptionPlan, planName: string) {
    setPendingPlan(planId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/subscription/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });

      const payload = (await response.json().catch(() => null)) as PurchaseResponse | null;

      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? 'Не удалось оформить тариф');
        return;
      }

      setSuccess(`Тариф «${planName}» оформлен. Баланс обновлён.`);
      router.refresh();
    } catch {
      setError('Сеть недоступна. Попробуйте ещё раз.');
    } finally {
      setPendingPlan(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => {
          const isHighlighted = plan.badge === 'Популярный';
          const isCurrent = currentPlan === plan.id;
          const isPending = pendingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                'flex flex-col rounded-xl border p-5',
                isHighlighted
                  ? 'border-indigo-500/40 bg-indigo-500/5'
                  : 'border-neutral-800 bg-neutral-900/40',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
                {plan.badge ? (
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-300">
                    {plan.badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-2xl font-semibold text-white">{formatPrice(plan.price)}</p>

              <p className="mt-2 text-sm text-neutral-300">
                {plan.reports === null ? 'Без ограничений' : `${plan.reports} отчётов`}
              </p>

              <p className="mt-1 text-xs text-neutral-500">{plan.tagline}</p>

              {pricePerReport(plan) ? (
                <p className="mt-1 text-xs text-neutral-500">{pricePerReport(plan)}</p>
              ) : (
                <p className="mt-1 text-xs text-neutral-500">платите один раз</p>
              )}

              <Button
                className="mt-5 w-full"
                variant={isHighlighted ? 'primary' : 'secondary'}
                onClick={() => purchase(plan.id, plan.name)}
                disabled={pendingPlan !== null}
              >
                {isPending ? 'Оформляем…' : isCurrent ? 'Продлить' : 'Оформить'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
