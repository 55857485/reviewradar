'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { describeAuthError } from '@/lib/auth-errors';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (signUpError) {
        setError(describeAuthError(signUpError.message));
        return;
      }

      if (!data.user) {
        setError('Не удалось создать аккаунт. Попробуйте ещё раз.');
        return;
      }

      if (data.user.identities && data.user.identities.length === 0) {
        setError('Пользователь с таким email уже зарегистрирован');
        return;
      }

      if (data.session) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: data.user.id, email: data.user.email }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? 'Не удалось завершить регистрацию');
          return;
        }

        router.replace('/dashboard');
        router.refresh();
        return;
      }

      setNotice('Аккаунт создан. Подтвердите email по ссылке из письма, затем войдите в систему.');
    } catch (error) {
      setError(describeAuthError(error instanceof Error ? error.message : null));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Регистрация в ReviewRadar</CardTitle>
        <CardDescription>Создайте аккаунт, чтобы запускать анализ отзывов.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm text-neutral-300">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm text-neutral-300">
              Пароль
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Минимум 6 символов"
              disabled={isLoading}
            />
          </div>

          {error ? <Alert variant="error">{error}</Alert> : null}
          {notice ? <Alert variant="success">{notice}</Alert> : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-indigo-300 hover:text-indigo-200">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
