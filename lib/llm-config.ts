export type LlmProvider = 'deepseek' | 'gigachat';

export function getLlmProvider(): LlmProvider {
  return process.env.LLM_PROVIDER === 'gigachat' ? 'gigachat' : 'deepseek';
}

export function isLlmConfigured(): boolean {
  if (getLlmProvider() === 'gigachat') {
    return Boolean(process.env.GIGACHAT_AUTH_KEY);
  }

  return Boolean(process.env.DEEPSEEK_API_KEY);
}
