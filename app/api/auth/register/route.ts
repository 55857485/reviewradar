import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type RegisterPayload = {
  id?: unknown;
  email?: unknown;
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

    const payload = (await request.json().catch(() => null)) as RegisterPayload | null;

    if (!payload || typeof payload.id !== 'string' || typeof payload.email !== 'string') {
      return NextResponse.json({ error: 'Некорректное тело запроса' }, { status: 400 });
    }

    const matchesId = payload.id === user.id;
    const matchesEmail = payload.email.trim().toLowerCase() === user.email.toLowerCase();

    if (!matchesId || !matchesEmail) {
      return NextResponse.json(
        { error: 'Данные не совпадают с авторизованным пользователем' },
        { status: 403 },
      );
    }

    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email },
      create: {
        id: user.id,
        email: user.email,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to register user', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
