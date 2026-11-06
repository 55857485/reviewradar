import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ReportMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-xl prose-h2:text-base prose-h2:text-indigo-300 prose-li:my-1 prose-strong:text-neutral-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
