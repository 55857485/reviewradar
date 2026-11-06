import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.report.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        outputReport: true,
        createdAt: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Отчёт не найден' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Failed to load report', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
