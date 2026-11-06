import { existsSync, readFileSync } from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import OpenAI from 'openai';

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_BASE_URL = 'https://api.giga.chat/v1';

type CachedToken = {
  value: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function readCa(): string | undefined {
  const candidates = [
    process.env.GIGACHAT_CA_PATH,
    path.join(process.cwd(), 'certs', 'russian_trusted_root_ca_pem.crt'),
  ];

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return readFileSync(candidate, 'utf8');
    }
  }

  return undefined;
}

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

function postForm(
  url: string,
  headers: Record<string, string>,
  body: string,
  ca?: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method: 'POST', headers, ca }, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve({ status: response.statusCode ?? 0, body: data });
      });
    });

    request.on('error', reject);
    request.setTimeout(20_000, () => {
      request.destroy(new Error('GigaChat auth request timed out'));
    });

    request.write(body);
    request.end();
  });
}

async function requestAccessToken(): Promise<CachedToken> {
  const response = await postForm(
    OAUTH_URL,
    {
      Authorization: `Basic ${getAuthKey()}`,
      RqUID: crypto.randomUUID(),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    new URLSearchParams({
      scope: process.env.GIGACHAT_SCOPE ?? 'GIGACHAT_API_PERS',
    }).toString(),
    readCa(),
  );

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `GigaChat auth failed with status ${response.status}: ${response.body.slice(0, 200)}`,
    );
  }

  const payload = JSON.parse(response.body) as {
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
  const ca = readCa();

  const client = new OpenAI({
    apiKey: token,
    baseURL: API_BASE_URL,
    httpAgent: ca ? new https.Agent({ ca }) : undefined,
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
