'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportMarkdown } from '@/components/dashboard/report-markdown';
import { formatDateTime } from '@/lib/format';

type HistoryItem = {
  id: string;
  preview: string;
  createdAt: string;
};

type ReportResponse = {
  report?: {
    id: string;
    outputReport: string;
    createdAt: string;
  };
  error?: string;
};

export function HistoryList({ reports }: { reports: HistoryItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [reports_content, setReportsContent] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleReport(reportId: string) {
    setError(null);

    if (openId === reportId) {
      setOpenId(null);
      return;
    }

    setOpenId(reportId);

    if (reports_content[reportId]) {
      return;
    }

    setPendingId(reportId);

    try {
      const response = await fetch(`/api/reports/${reportId}`);
      const payload = (await response.json().catch(() => null)) as ReportResponse | null;
      const report = payload?.report;

      if (!response.ok || !report) {
        setError(payload?.error ?? 'Не удалось открыть отчёт');
        setOpenId(null);
        return;
      }

      setReportsContent((previous) => ({ ...previous, [reportId]: report.outputReport }));
    } catch {
      setError('Сеть недоступна. Попробуйте ещё раз.');
      setOpenId(null);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}

      {reports.map((report) => {
        const isOpen = openId === report.id;
        const isPending = pendingId === report.id;
        const fullReport = reports_content[report.id];

        return (
          <Card key={report.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <CardTitle>{formatDateTime(report.createdAt)}</CardTitle>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{report.preview}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => toggleReport(report.id)}
                disabled={isPending}
              >
                {isPending ? 'Загружаем…' : isOpen ? 'Свернуть' : 'Открыть отчёт'}
              </Button>
            </CardHeader>

            {isOpen && fullReport ? (
              <CardContent className="animate-fade-in">
                <ReportMarkdown content={fullReport} />
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
