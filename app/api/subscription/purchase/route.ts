import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getPlan } from '@/lib/plans';

type PurchasePayload = {
  plan?: unknown;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const payload = (await request.json().catch(() => null)) as PurchasePayload | null;
    const planId = typeof payload?.plan === 'string' ? payload.plan : '';
    const plan = getPlan(planId);

    if (!plan) {
      return NextResponse.json({ error: 'Неизвестный тариф' }, { status: 400 });
    }

    const email = user.email;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { id: user.id } });

      if (!existing) {
        return tx.user.create({
          data: {
            id: user.id,
            email,
            subscriptionStatus: 'ACTIVE',
            plan: plan.id,
            reportsLeft: plan.reports,
            planPurchasedAt: new Date(),
          },
          select: {
            plan: true,
            reportsLeft: true,
            subscriptionStatus: true,
          },
        });
      }

      const lifetime = plan.id === 'LIFETIME' || existing.plan === 'LIFETIME';
      const nextPlan = lifetime ? 'LIFETIME' : plan.id;
      const nextLeft = lifetime ? null : (existing.reportsLeft ?? 0) + (plan.reports ?? 0);

      return tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'ACTIVE',
          plan: nextPlan,
          reportsLeft: nextLeft,
          planPurchasedAt: new Date(),
        },
        select: {
          plan: true,
          reportsLeft: true,
          subscriptionStatus: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      plan: result.plan,
      reportsLeft: result.reportsLeft,
      subscriptionStatus: result.subscriptionStatus,
    });
  } catch (error) {
    console.error('Failed to purchase plan', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
