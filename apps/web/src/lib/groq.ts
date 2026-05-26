import Groq from 'groq-sdk';

let _client: Groq | null = null;

function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY belum di-set di .env (https://console.groq.com/keys)');
  }
  if (!_client) {
    _client = new Groq({ apiKey: key });
  }
  return _client;
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chat(opts: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const client = getClient();
  const res = await client.chat.completions.create({
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 500,
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
}
