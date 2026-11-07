# ReviewRadar

Micro-SaaS для продавцов Wildberries и Ozon: пользователь загружает TXT-файл с отзывами конкурентов, DeepSeek анализирует их и возвращает Markdown-отчёт с тремя главными проблемами товара и рекомендациями по карточке.

## Стек

- Next.js 15 (App Router) + TypeScript
- React 19
- Tailwind CSS 3.4 (чистый, без UI-библиотек)
- Prisma ORM 6 + PostgreSQL (Supabase)
- Supabase Auth через `@supabase/ssr`
- `openai` (официальный SDK) с `baseURL: https://api.deepseek.com`
- `react-markdown` + `remark-gfm` для отображения отчётов

## Требования

- Node.js 20+ (проверено на 22.14)
- Проект в Supabase (Postgres + Auth)

## Быстрый старт

```bash
npm install
cp .env.example .env
# заполните .env (см. ниже)
npm run db:migrate     # применит prisma/migrations/20260101000000_init
npm run dev
```

Приложение: http://localhost:3000

### Переменные окружения

| Переменная | Где взять | Назначение |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Клиент и сервер Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public | Клиент и сервер Supabase |
| `DATABASE_URL` | Supabase → Connect → pooled connection (порт 6543) | Prisma в рантайме |
| `DIRECT_URL` | Supabase → Connect → direct connection (порт 5432) | Миграции Prisma |
| `DEEPSEEK_API_KEY` | platform.deepseek.com | Ключ DeepSeek (если `LLM_PROVIDER=deepseek`) |
| `LLM_PROVIDER` | — | `deepseek` (по умолчанию) или `gigachat` |
| `GIGACHAT_AUTH_KEY` | developers.sber.ru → Studio → GigaChat API | Ключ авторизации Base64 (если `LLM_PROVIDER=gigachat`) |
| `GIGACHAT_SCOPE` | — | `GIGACHAT_API_PERS` для физлиц, `GIGACHAT_API_B2B` для юрлиц |
| `GIGACHAT_MODEL` | — | `GigaChat-2`, `GigaChat-2-Pro`, `GigaChat-2-Max`, `GigaChat-3-Lightning` |

Ключ DeepSeek используется исключительно в `lib/deepseek.ts` на сервере. Ни одна переменная без префикса `NEXT_PUBLIC_` не попадает в браузерный бандл.

### Провайдер LLM

По умолчанию используется DeepSeek. Переключение — переменной `LLM_PROVIDER`:

```env
LLM_PROVIDER=gigachat
GIGACHAT_AUTH_KEY=<ключ авторизации из SberStudio>
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat
```

GigaChat работает через OpenAI-совместимый эндпоинт `https://api.giga.chat/v1`: токен доступа получается по OAuth (`lib/gigachat.ts`, живёт 30 минут и кэшируется), а сам запрос к модели идёт через `openai` SDK. `fetch` используется только для OAuth-запроса, потому что этот эндпоинт не входит в OpenAI-совместимый API.

**Сертификат Минцифры обязателен.** Без него Node не доверяет цепочке GigaChat и падает с `self-signed certificate in certificate chain`:

1. Скачайте корневой сертификат с [gosuslugi.ru/crt](https://www.gosuslugi.ru/crt) или напрямую `https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt`.
2. Положите файл, например, в `certs/russian_trusted_root_ca_pem.crt`.
3. Запускайте dev-сервер с переменной окружения:

```powershell
$env:NODE_EXTRA_CA_CERTS="$PWD\certs\russian_trusted_root_ca_pem.crt"
npm run dev
```

`npm run dev` использует обёртку `scripts/next-dev.mjs`: если файл `certs/russian_trusted_root_ca_pem.crt` существует, переменная подставляется автоматически и вручную её задавать не нужно.

На сервере (Vercel, Docker) переменная `NODE_EXTRA_CA_CERTS` указывает на путь к этому же файлу внутри контейнера.

### Миграции и RLS

```bash
npm run db:migrate        # prisma migrate deploy
npm run db:migrate:dev    # prisma migrate dev (локальная разработка)
```

Политики Row Level Security лежат в `supabase/rls.sql`:

```sql
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own reports"
ON "Report"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");
```

Файл также включает аналогичную политику для `User`. Выполните его в Supabase SQL Editor после миграции.

Важно: Prisma подключается к PostgreSQL напрямую под привилегированной ролью и обходит RLS. Поэтому RLS — дополнительный слой, а не замена серверной авторизации: все запросы к `Report` фильтруются по `userId`, полученному из `supabase.auth.getUser()`.

## Проверка работоспособности

1. Зарегистрируйтесь на `/register` (если в Supabase включено подтверждение email — подтвердите адрес и войдите).
2. Откройте `/billing` и оформите тариф (в MVP оплата имитируется).
3. На `/dashboard` загрузите TXT (один отзыв на строку, до 1 МБ).
4. Нажмите «Сгенерировать отчёт» — отчёт появится на странице и сохранится в `/history`.

## API

| Метод | Маршрут | Назначение |
| --- | --- | --- |
| POST | `/api/auth/register` | Upsert пользователя после регистрации |
| POST | `/api/subscription/purchase` | Оформление тарифа и начисление отчётов |
| POST | `/api/reports/generate` | Загрузка TXT и генерация отчёта |
| GET | `/api/reports/[id]` | Получение отчёта владельцем |

### Коды ошибок `/api/reports/generate`

| Код | Причина |
| --- | --- |
| 400 | Нет файла, не TXT, пустой файл, больше 1 МБ, нет отзывов |
| 401 | Пользователь не авторизован |
| 403 | Нет доступных отчётов: тариф не оформлен или лимит исчерпан |
| 404 | Запись пользователя не найдена в Prisma |
| 409 | У пользователя уже идёт генерация отчёта |
| 502 | Ошибка DeepSeek или невалидный ответ модели |
| 500 | Внутренняя ошибка (в т.ч. отсутствует `DEEPSEEK_API_KEY`) |

Ответы не содержат stack trace и внутренних деталей — они пишутся только в серверный лог.

## Защита от параллельных генераций

Генерация выполняется внутри интерактивной транзакции Prisma, которая удерживает соединение с PostgreSQL:

```ts
const lockRows = await tx.$queryRaw<LockRow[]>`
  SELECT pg_try_advisory_xact_lock(hashtext(${`reviewradar:report:${user.id}`})) AS locked
`;
```

- `pg_try_advisory_xact_lock` — атомарный механизм PostgreSQL, блокировка снимается автоматически при завершении транзакции.
- Ключ строится из `user.id`, поэтому один пользователь не может запустить вторую генерацию.
- Второй параллельный запрос сразу получает `409`, не дожидаясь первой генерации.
- Транзакция открыта на время вызова DeepSeek: `timeout: 180_000`, `maxWait: 15_000`.
- React-состояние и отключение кнопки используются только для UX и не считаются защитой.

## Безопасность

- Проверка пользователя только через `supabase.auth.getUser()`; `getSession()` на сервере не используется.
- `userId` никогда не принимается из тела запроса или FormData — только из проверенной сессии.
- `/api/auth/register` сверяет `id` и `email` из тела с данными авторизованного пользователя.
- `/api/reports/[id]` ищет отчёт по паре `{ id, userId }`, чужие отчёты недоступны.
- Подписка проверяется на сервере перед каждой генерацией; скрытие кнопок в UI защитой не является.
- Middleware только обновляет сессию Supabase и не выполняет редиректов, проверок подписки и запросов к Prisma.

## Структура

```
app/
  (auth)/login, (auth)/register
  (dashboard)/layout.tsx, dashboard, history, billing
  api/auth/register, api/subscription/purchase
  api/reports/generate, api/reports/[id]
  auth/callback/route.ts
  layout.tsx, page.tsx, globals.css
components/
  layout/{sidebar,header,sign-out-button}.tsx
  dashboard/{upload-form,report-card,report-markdown}.tsx
  history/history-list.tsx
  billing/plan-grid.tsx
  ui/{button,input,card,alert}.tsx
lib/
  supabase/{client,server,middleware}.ts
  prisma.ts, auth.ts, deepseek.ts, format.ts, utils.ts
  plans.ts, subscription.ts
  prompts/review-analysis.ts
prisma/
  schema.prisma, migrations/
supabase/rls.sql
middleware.ts
```

## Тарифы

| Тариф | Цена | Отчётов |
| --- | --- | --- |
| Базовый | 99 ₽ | 10 |
| Продвинутый | 239 ₽ | 150 |
| Максимальный | 500 ₽ | 1000 |
| Бессрочный | 1999 ₽ | без ограничений |

Оформление идёт через `POST /api/subscription/purchase` с телом `{ "plan": "BASIC" }`. Сервер сам определяет цену и объём по каталогу `lib/plans.ts`, клиентские суммы не принимаются. Покупка начисляет отчёты к текущему балансу; «Бессрочный» выставляет `reportsLeft = null` и больше не ограничивает генерацию. Отчёт списывается только после успешного ответа модели и записи в базу — внутри той же транзакции, что и создание отчёта.

Платёжный провайдер не подключён: в MVP оформление имитируется. Для реальных платежей нужен ЮKassa / Robokassa / Т-Банк и вебхук, который вызывает то же начисление.

## Деплой

**Netlify** (рабочий вариант, доступен из РФ):

```bash
npm i -g netlify-cli
netlify login
netlify link --project reviewradar
netlify env:import .env
netlify env:set NODE_EXTRA_CA_CERTS /var/task/certs/russian_trusted_root_ca_pem.crt
netlify deploy --build --prod
```

- `netlify.toml` подключает `@netlify/plugin-nextjs` и включает `certs/**` в бандл функций.
- Prisma собирается с `binaryTargets = ["native", "rhel-openssl-3.0.x"]` — без этого движок не находится на Linux.
- Сертификат Минцифры читается кодом из `certs/` (`lib/gigachat.ts`), поэтому `NODE_EXTRA_CA_CERTS` нужен только как страховка.
- Лимит синхронной функции на бесплатном плане — 10 секунд; генерация занимает 5–12 секунд, поэтому запрос может не успеть. Для стабильной работы нужен план Pro либо хостинг без таймаута (Railway, VPS).

**Vercel**: сборка и деплой работают, но домены `*.vercel.app` блокируются в РФ — для российской аудитории не подходит.

## Ограничения MVP

- Платежи не подключены: оформление тарифа начисляет отчёты без списания денег.
- Анализируются первые 10 000 символов файла.
- Один отчёт — один запрос к модели без потоковой выдачи.
