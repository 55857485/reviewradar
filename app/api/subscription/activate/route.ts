import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'У пользователя отсутствует email' }, { status: 400 });
    }

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { subscriptionStatus: 'ACTIVE' },
      create: {
        id: user.id,
        email: user.email,
        subscriptionStatus: 'ACTIVE',
      },
      select: {
        id: true,
        subscriptionStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionStatus: dbUser.subscriptionStatus,
    });
  } catch (error) {
    console.error('Failed to activate subscription', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
