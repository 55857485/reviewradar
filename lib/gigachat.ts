import OpenAI from 'openai';

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_BASE_URL = 'https://api.giga.chat/v1';

type CachedToken = {
  value: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function getAuthKey(): string {
  const authKey = process.env.GIGACHAT_AUTH_KEY;

  if (authKey) {
    return authKey;
  }

  const clientId = process.env.GIGACHAT_CLIENT_ID;
  const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;

  if (clientId && clientSecret) {
    return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  }

  throw new Error('GIGACHAT_AUTH_KEY is not configured');
}

async function requestAccessToken(): Promise<CachedToken> {
  const response = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${getAuthKey()}`,
      RqUID: crypto.randomUUID(),
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
    throw new Error(
      `GigaChat auth failed with status ${response.status}: ${details.slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_at?: number;
  };

  if (!payload.access_token) {
    throw new Error('GigaChat auth response has no access_token');
  }

  return {
    value: payload.access_token,
    expiresAt: payload.expires_at ?? Date.now() + 25 * 60_000,
  };
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) {
    return cachedToken.value;
  }

  cachedToken = await requestAccessToken();

  return cachedToken.value;
}

export async function generateWithGigaChat(prompt: string): Promise<string> {
  const token = await getAccessToken();

  const client = new OpenAI({
    apiKey: token,
    baseURL: API_BASE_URL,
  });

  const completion = await client.chat.completions.create({
    model: process.env.GIGACHAT_MODEL ?? 'GigaChat-2',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content ?? '';
}
