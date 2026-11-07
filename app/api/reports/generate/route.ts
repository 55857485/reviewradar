import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { REVIEW_ANALYSIS_PROMPT } from '@/lib/prompts/review-analysis';
import { generateReviewAnalysis } from '@/lib/deepseek';
import { isLlmConfigured } from '@/lib/llm-config';
import { hasReportsAvailable } from '@/lib/subscription';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_FILE_SIZE = 1024 * 1024;
const MAX_INPUT_LENGTH = 10000;

type LockRow = { locked: boolean };

type GenerationResult =
  | { status: 'ok'; report: { id: string; outputReport: string; createdAt: Date } }
  | { status: 'busy' }
  | { status: 'invalid_llm_response' };

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    if (!dbUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (!hasReportsAvailable(dbUser)) {
      return NextResponse.json(
        { error: 'Нет доступных отчётов. Оформите тариф в разделе «Подписка»' },
        { status: 403 },
      );
    }

    const formData = await request.formData().catch(() => null);

    if (!formData) {
      return NextResponse.json(
        { error: 'Ожидается multipart/form-data с файлом' },
        { status: 400 },
      );
    }

    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.txt')) {
      return NextResponse.json({ error: 'Файл должен быть в формате TXT' }, { status: 400 });
    }

    if (file.type && file.type !== 'text/plain') {
      return NextResponse.json({ error: 'Некорректный тип файла' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Файл пуст' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Размер файла не должен превышать 1 МБ' }, { status: 400 });
    }

    const inputText = await file.text();

    const cleanedText = inputText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');

    if (cleanedText.length === 0) {
      return NextResponse.json({ error: 'В файле не найдено отзывов' }, { status: 400 });
    }

    const truncated = inputText.slice(0, MAX_INPUT_LENGTH);
    const prompt = REVIEW_ANALYSIS_PROMPT.replace('{{reviews}}', truncated);

    if (!isLlmConfigured()) {
      console.error('LLM provider is not configured');
      return NextResponse.json({ error: 'Сервис анализа недоступен' }, { status: 500 });
    }

    const result = await prisma.$transaction(
      async (tx): Promise<GenerationResult> => {
        const lockRows = await tx.$queryRaw<LockRow[]>`
          SELECT pg_try_advisory_xact_lock(hashtext(${`reviewradar:report:${user.id}`})) AS locked
        `;

        if (!lockRows[0]?.locked) {
          return { status: 'busy' };
        }

        let output: string | null = null;

        try {
          output = await generateReviewAnalysis(prompt);
        } catch (error) {
          console.error('DeepSeek request failed', error);
          return { status: 'invalid_llm_response' };
        }

        if (!output || !output.includes('📊') || !output.includes('Проблема №1')) {
          console.error('DeepSeek returned an unexpected response');
          return { status: 'invalid_llm_response' };
        }

        const report = await tx.report.create({
          data: {
            userId: user.id,
            inputText: truncated,
            outputReport: output,
          },
          select: {
            id: true,
            outputReport: true,
            createdAt: true,
          },
        });

        if (dbUser.plan === 'LIFETIME') {
          await tx.user.update({
            where: { id: user.id },
            data: { reportsUsed: { increment: 1 } },
          });
        } else {
          await tx.user.update({
            where: { id: user.id },
            data: {
              reportsLeft: { decrement: 1 },
              reportsUsed: { increment: 1 },
            },
          });
        }

        return { status: 'ok', report };
      },
      {
        maxWait: 15_000,
        timeout: 180_000,
      },
    );

    if (result.status === 'busy') {
      return NextResponse.json(
        { error: 'Отчёт уже генерируется. Дождитесь завершения текущего запроса' },
        { status: 409 },
      );
    }

    if (result.status === 'invalid_llm_response') {
      return NextResponse.json(
        { error: 'Не удалось получить корректный ответ модели' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      report: {
        id: result.report.id,
        outputReport: result.report.outputReport,
        createdAt: result.report.createdAt,
      },
    });
  } catch (error) {
    console.error('Report generation failed', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
