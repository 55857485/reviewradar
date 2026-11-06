import { createServerClient } from '@supabase/ssr';
import { PrismaClient } from '@prisma/client';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log('supabase_env_missing');
  process.exit(1);
}

const jar = new Map();

const supabase = createServerClient(url, key, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (cookies) => {
      cookies.forEach(({ name, value }) => jar.set(name, value));
    },
  },
});

const email = `reviewradar.test.${Date.now()}@gmail.com`;
const password = `ReviewRadar!${Date.now()}`;

const { data, error } = await supabase.auth.signUp({ email, password });

console.log('signup_error:', error ? `${error.status} ${error.message}` : 'none');
console.log('user_created:', Boolean(data.user));
console.log('session_created:', Boolean(data.session));

if (error || !data.user) {
  process.exit(2);
}

if (!data.session) {
  console.log('confirmation_required: true');
  process.exit(3);
}

const cookieHeader = [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
console.log('cookies_captured:', jar.size);

const response = await fetch('http://127.0.0.1:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: cookieHeader,
  },
  body: JSON.stringify({ id: data.user.id, email: data.user.email }),
});

console.log('api_status:', response.status);
console.log('api_body:', (await response.text()).slice(0, 200));

const dashboard = await fetch('http://127.0.0.1:3000/dashboard', {
  headers: { Cookie: cookieHeader },
  redirect: 'manual',
});

console.log('dashboard_status:', dashboard.status);

const prisma = new PrismaClient();
const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });

console.log('db_user:', dbUser ? `created (${dbUser.email}, ${dbUser.subscriptionStatus})` : 'missing');

await prisma.$disconnect();
