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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(describeAuthError(signInError.message));
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      setError(describeAuthError(error instanceof Error ? error.message : null));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вход в ReviewRadar</CardTitle>
        <CardDescription>Введите email и пароль, указанные при регистрации.</CardDescription>
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {error ? <Alert variant="error">{error}</Alert> : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Входим…' : 'Войти'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-indigo-300 hover:text-indigo-200">
            Зарегистрироваться
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
