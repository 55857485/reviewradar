import { redirect } from 'next/navigation';
import { PlanGrid } from '@/components/billing/plan-grid';
import { getCurrentDbUser } from '@/lib/auth';
import { getPlanById } from '@/lib/plans';
import { reportsLeftLabel } from '@/lib/subscription';

export default async function BillingPage() {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect('/login');
  }

  const plan = getPlanById(user.plan);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Тарифы</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Один отчёт — один разбор отзывов конкурентов. Отчёты списываются только при успешной
          генерации.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-200">{reportsLeftLabel(user)}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {plan ? `Оформлен: ${plan.name}` : 'Тариф ещё не оформлен'}
            {user.reportsUsed > 0 ? ` · использовано отчётов: ${user.reportsUsed}` : ''}
          </p>
        </div>
      </div>

      <PlanGrid currentPlan={user.plan} />

      <p className="text-xs leading-relaxed text-neutral-600">
        Демо-режим: оплата имитируется, деньги не списываются. Для приёма реальных платежей
        подключим платёжный провайдер (ЮKassa, Robokassa или Т-Банк).
      </p>
    </div>
  );
}
