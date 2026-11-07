import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ReportCard } from '@/components/dashboard/report-card';
import { UploadForm } from '@/components/dashboard/upload-form';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentDbUser } from '@/lib/auth';
import { hasReportsAvailable } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect('/login');
  }

  const lastReport = await prisma.report.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      outputReport: true,
      createdAt: true,
    },
  });

  const canGenerate = hasReportsAvailable(user);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">ReviewRadar</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
          Загрузите отзывы конкурентов с Wildberries или Ozon — сервис покажет три главные
          претензии покупателей и подскажет, что исправить в карточке товара.
        </p>
      </div>

      {!canGenerate ? (
        <Alert variant="warning">
          Отчёты не подключены или закончились. Перейдите в{' '}
          <Link href="/billing" className="font-medium underline underline-offset-2">
            «Тарифы»
          </Link>{' '}
          и оформите подходящий пакет.
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Новый анализ</CardTitle>
          <CardDescription>
            TXT-файл, один отзыв на строку. Первые 10 000 символов попадут в анализ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadForm canGenerate={canGenerate} />
        </CardContent>
      </Card>

      {lastReport ? (
        <ReportCard
          report={{
            id: lastReport.id,
            outputReport: lastReport.outputReport,
            createdAt: lastReport.createdAt,
          }}
        />
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-neutral-400">
              Вы ещё не создали ни одного отчёта. Загрузите отзывы конкурентов, чтобы получить
              первый анализ.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
