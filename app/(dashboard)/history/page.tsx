import { redirect } from 'next/navigation';
import { HistoryList } from '@/components/history/history-list';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentDbUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function HistoryPage() {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect('/login');
  }

  const reports = await prisma.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      outputReport: true,
      createdAt: true,
    },
  });

  const historyItems = reports.map((report) => ({
    id: report.id,
    preview: report.outputReport.replace(/\s+/g, ' ').slice(0, 150),
    createdAt: report.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">История отчётов</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Все анализы, созданные в вашем аккаунте. Откройте нужный, чтобы посмотреть полный
          Markdown-отчёт.
        </p>
      </div>

      {historyItems.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-neutral-400">История пока пуста</p>
          </CardContent>
        </Card>
      ) : (
        <HistoryList reports={historyItems} />
      )}
    </div>
  );
}
