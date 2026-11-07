import type { SubscriptionPlan } from '@prisma/client';

export type PlanDefinition = {
  id: SubscriptionPlan;
  name: string;
  price: number;
  reports: number | null;
  tagline: string;
  badge?: string;
};

export const PLANS: PlanDefinition[] = [
  {
    id: 'BASIC',
    name: 'Базовый',
    price: 99,
    reports: 10,
    tagline: 'Попробовать на одном товаре',
  },
  {
    id: 'ADVANCED',
    name: 'Продвинутый',
    price: 239,
    reports: 150,
    tagline: 'Для активного магазина',
    badge: 'Популярный',
  },
  {
    id: 'MAX',
    name: 'Максимальный',
    price: 500,
    reports: 1000,
    tagline: 'Для агентств и оптовиков',
    badge: 'Выгодно',
  },
  {
    id: 'LIFETIME',
    name: 'Бессрочный',
    price: 1999,
    reports: null,
    tagline: 'Без ограничений навсегда',
    badge: 'Навсегда',
  },
];

export function getPlan(id: string): PlanDefinition | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function getPlanById(id: SubscriptionPlan | null | undefined): PlanDefinition | undefined {
  if (!id) {
    return undefined;
  }

  return PLANS.find((plan) => plan.id === id);
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export function pricePerReport(plan: PlanDefinition): string | null {
  if (!plan.reports) {
    return null;
  }

  const value = plan.price / plan.reports;
  const rounded = value >= 1 ? value.toFixed(1) : value.toFixed(2);

  return `${rounded.replace('.', ',')} ₽ за отчёт`;
}
