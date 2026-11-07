import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { getPlanById } from '@/lib/plans';

type PlanState = {
  subscriptionStatus: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  reportsLeft: number | null;
};

export function hasReportsAvailable(user: PlanState): boolean {
  if (user.subscriptionStatus !== 'ACTIVE' || !user.plan) {
    return false;
  }

  if (user.plan === 'LIFETIME') {
    return true;
  }

  return (user.reportsLeft ?? 0) > 0;
}

export function reportsLeftLabel(user: PlanState): string {
  const plan = getPlanById(user.plan);

  if (!plan) {
    return 'Тариф не выбран';
  }

  if (user.plan === 'LIFETIME') {
    return `Тариф «${plan.name}» · без ограничений`;
  }

  const left = user.reportsLeft ?? 0;

  if (left <= 0) {
    return `Тариф «${plan.name}» · отчёты закончились`;
  }

  return `Тариф «${plan.name}» · осталось отчётов: ${left}`;
}
