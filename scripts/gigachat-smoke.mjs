import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import OpenAI from 'openai';

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_BASE_URL = 'https://api.giga.chat/v1';

const reviews = `Куртка пришла быстро, но ткань тонкая, просвечивает на солнце.
Размер маломерит, брала L, а сидит как M. Пришлось возвращать.
Швы начали расходиться после первой стирки, обидно.
Цвет не соответствует фото, на картинке насыщенный синий, по факту серый.
Молния заедает, приходится тянуть двумя руками.
В целом за свои деньги нормально, но утеплитель сбивается в комок.
Заказала второй раз, размер уже взяла больше, всё отлично.
Капюшон большой, но не держит форму, постоянно падает на глаза.`;

async function getAccessToken() {
  const authKey = process.env.GIGACHAT_AUTH_KEY;

  if (!authKey) {
    throw new Error('GIGACHAT_AUTH_KEY is not configured');
  }

  const response = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authKey}`,
      RqUID: randomUUID(),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      scope: process.env.GIGACHAT_SCOPE ?? 'GIGACHAT_API_PERS',
    }).toString(),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`GigaChat auth failed with status ${response.status}: ${details.slice(0, 200)}`);
  }

  const payload = await response.json();

  if (!payload.access_token) {
    throw new Error('GigaChat auth response has no access_token');
  }

  return payload.access_token;
}

async function main() {
  const source = await readFile(new URL('../lib/prompts/review-analysis.ts', import.meta.url), 'utf8');
  const match = source.match(/`([\s\S]*)`/);

  if (!match) {
    throw new Error('Prompt template not found');
  }

  const prompt = match[1].replace('{{reviews}}', reviews.slice(0, 10_000));

  const client = new OpenAI({
    apiKey: await getAccessToken(),
    baseURL: API_BASE_URL,
  });

  const startedAt = Date.now();

  const completion = await client.chat.completions.create({
    model: process.env.GIGACHAT_MODEL ?? 'GigaChat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const output = completion.choices[0]?.message?.content ?? '';

  console.log('elapsed_ms:', Date.now() - startedAt);
  console.log('chars:', output.length);
  console.log('has_chart:', output.includes('📊'));
  console.log('has_problem_1:', output.includes('Проблема №1'));
  console.log('has_problem_3:', output.includes('Проблема №3'));
  console.log('--- preview ---');
  console.log(output.slice(0, 700));
}

main().catch((error) => {
  console.log('error:', error.name, '|', error.message);
  console.log('status:', error.status ?? 'n/a');
  process.exitCode = 1;
});
