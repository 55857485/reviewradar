import OpenAI from 'openai';
import { generateWithGigaChat } from '@/lib/gigachat';
import { getLlmProvider } from '@/lib/llm-config';

export const DEEPSEEK_MODEL = 'deepseek-chat';

export function createDeepSeekClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  });
}

async function generateWithDeepSeek(prompt: string): Promise<string> {
  const client = createDeepSeekClient();

  const completion = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
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

export async function generateReviewAnalysis(prompt: string): Promise<string> {
  const output =
    getLlmProvider() === 'gigachat'
      ? await generateWithGigaChat(prompt)
      : await generateWithDeepSeek(prompt);

  if (!output) {
    throw new Error('LLM returned an empty response');
  }

  return output;
}
