const knownErrors: Array<[RegExp, string]> = [
  [
    /environment variables are not configured/i,
    'Сервис авторизации не настроен: заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в файле .env',
  ],
  [
    /failed to fetch|fetch failed|networkerror|econnrefused|load failed/i,
    'Сервис авторизации недоступен. Проверьте NEXT_PUBLIC_SUPABASE_URL в .env',
  ],
  [/invalid login credentials/i, 'Неверный email или пароль'],
  [
    /email not confirmed/i,
    'Email не подтверждён — проверьте почту или отключите подтверждение в Supabase',
  ],
  [/user already registered/i, 'Пользователь с таким email уже зарегистрирован'],
  [/password should be at least/i, 'Пароль слишком короткий'],
  [/rate limit|too many requests|over_email_send_rate_limit/i, 'Слишком много попыток. Подождите минуту'],
  [
    /signups not allowed|signup is disabled|email signups are disabled/i,
    'Регистрация отключена в настройках Supabase',
  ],
];

export function describeAuthError(message: string | null | undefined): string {
  if (!message) {
    return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
  }

  for (const [pattern, text] of knownErrors) {
    if (pattern.test(message)) {
      return text;
    }
  }

  return message;
}
