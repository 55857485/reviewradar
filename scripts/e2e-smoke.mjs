import { createServerClient } from '@supabase/ssr';
import { PrismaClient } from '@prisma/client';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const baseUrl = 'http://127.0.0.1:3000';

const jar = new Map();

const supabase = createServerClient(url, key, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (cookies) => {
      cookies.forEach(({ name, value }) => jar.set(name, value));
    },
  },
});

const email = `reviewradar.e2e.${Date.now()}@gmail.com`;
const password = `ReviewRadar!${Date.now()}`;

const reviews = [
  'Куртка пришла быстро, но ткань тонкая, просвечивает на солнце.',
  'Размер маломерит, брала L, а сидит как M. Пришлось возвращать.',
  'Швы начали расходиться после первой стирки, обидно.',
  'Цвет не соответствует фото, на картинке насыщенный синий, по факту серый.',
  'Молния заедает, приходится тянуть двумя руками.',
  'В целом за свои деньги нормально, но утеплитель сбивается в комок.',
  'Заказала второй раз, размер уже взяла больше, всё отлично.',
  'Капюшон большой, но не держит форму, постоянно падает на глаза.',
].join('\n');

const { data, error } = await supabase.auth.signUp({ email, password });

console.log('signup:', error ? error.message : 'ok', '| session:', Boolean(data.session));

if (error || !data.session || !data.user) {
  process.exit(1);
}

const cookieHeader = [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');

const register = await fetch(`${baseUrl}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
  body: JSON.stringify({ id: data.user.id, email: data.user.email }),
});
console.log('register_api:', register.status);

const activate = await fetch(`${baseUrl}/api/subscription/activate`, {
  method: 'POST',
  headers: { Cookie: cookieHeader },
});
const activateJson = await activate.json().catch(() => null);
console.log('activate:', activate.status, '|', activateJson?.subscriptionStatus ?? 'n/a');

function buildFormData() {
  const formData = new FormData();
  formData.append('file', new Blob([reviews], { type: 'text/plain' }), 'reviews.txt');
  return formData;
}

const startedAt = Date.now();
const generate = await fetch(`${baseUrl}/api/reports/generate`, {
  method: 'POST',
  headers: { Cookie: cookieHeader },
  body: buildFormData(),
});
const generateJson = await generate.json().catch(() => null);

console.log('generate:', generate.status, '| elapsed_ms:', Date.now() - startedAt);

if (generateJson?.report) {
  const output = generateJson.report.outputReport ?? '';
  console.log('report_chars:', output.length);
  console.log('report_has_chart:', output.includes('📊'));
  console.log('report_has_problem_1:', output.includes('Проблема №1'));

  const single = await fetch(`${baseUrl}/api/reports/${generateJson.report.id}`, {
    headers: { Cookie: cookieHeader },
  });
  console.log('report_by_id:', single.status);
} else {
  console.log('generate_error:', generateJson?.error ?? 'unknown');
}

const parallel = await Promise.all([
  fetch(`${baseUrl}/api/reports/generate`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: buildFormData(),
  }),
  fetch(`${baseUrl}/api/reports/generate`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: buildFormData(),
  }),
]);

console.log('parallel_statuses:', parallel.map((response) => response.status).join(', '));
console.log(
  'parallel_bodies:',
  (await Promise.all(parallel.map((response) => response.text().catch(() => ''))))
    .map((body) => body.slice(0, 80))
    .join(' | '),
);

const prisma = new PrismaClient();

const dbUser = await prisma.user.findUnique({
  where: { id: data.user.id },
  include: { _count: { select: { reports: true } } },
});

console.log('db_user:', dbUser ? `${dbUser.subscriptionStatus}, reports: ${dbUser._count.reports}` : 'missing');

await prisma.$disconnect();
