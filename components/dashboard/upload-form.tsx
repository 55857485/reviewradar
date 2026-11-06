'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const MAX_FILE_SIZE = 1024 * 1024;

type GenerateResponse = {
  success?: boolean;
  report?: {
    id: string;
    outputReport: string;
    createdAt: string;
  };
  error?: string;
};

export function UploadForm({ subscriptionActive }: { subscriptionActive: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    setError(null);
    setSuccess(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!nextFile.name.toLowerCase().endsWith('.txt')) {
      setFile(null);
      setError('Нужен файл в формате TXT');
      event.target.value = '';
      return;
    }

    if (nextFile.size === 0) {
      setFile(null);
      setError('Файл пуст — добавьте отзывы и загрузите снова');
      event.target.value = '';
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError('Размер файла не должен превышать 1 МБ');
      event.target.value = '';
      return;
    }

    setFile(nextFile);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || isLoading || !subscriptionActive) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as GenerateResponse | null;

      if (!response.ok || !payload?.report) {
        setError(payload?.error ?? 'Не удалось сгенерировать отчёт');
        return;
      }

      setSuccess('Отчёт готов: он показан ниже и сохранён в истории.');
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      router.refresh();
    } catch {
      setError('Сеть недоступна. Проверьте подключение и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  }

  const isDisabled = isLoading || !subscriptionActive;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 px-6 py-8 text-center transition-colors hover:border-neutral-700">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={handleFileChange}
          disabled={isDisabled}
        />

        <p className="text-sm text-neutral-200">
          {file ? file.name : 'TXT-файл с отзывами конкурентов'}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {file
            ? `${(file.size / 1024).toFixed(1)} КБ`
            : 'Один отзыв на строку, размер файла до 1 МБ'}
        </p>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={isDisabled}
        >
          Выбрать файл
        </Button>
      </div>

      {!subscriptionActive ? (
        <Alert variant="warning">
          Подписка не активна.{' '}
          <Link href="/billing" className="font-medium underline underline-offset-2">
            Активируйте подписку
          </Link>
          , чтобы генерировать отчёты.
        </Alert>
      ) : null}

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={!file || isDisabled} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Генерируем отчёт…
            </>
          ) : (
            'Сгенерировать отчёт'
          )}
        </Button>
        <p className="text-xs text-neutral-500">
          Отзывы отправляются в DeepSeek, отчёт сохраняется в вашем аккаунте.
        </p>
      </div>
    </form>
  );
}
