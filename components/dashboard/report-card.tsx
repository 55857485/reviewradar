import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportMarkdown } from '@/components/dashboard/report-markdown';
import { formatDateTime } from '@/lib/format';

type ReportCardProps = {
  report: {
    id: string;
    outputReport: string;
    createdAt: string | Date;
  };
  title?: string;
  description?: string;
};

export function ReportCard({ report, title = 'Последний отчёт', description }: ReportCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description ?? formatDateTime(report.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ReportMarkdown content={report.outputReport} />
      </CardContent>
    </Card>
  );
}
