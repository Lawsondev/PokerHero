// client/src/utils/aiService.js

function cleanMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/[-*_]{3,}/g, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export async function sendToAI(prompt, logs = []) {
  const messages = [{
    role: 'system',
    content:
      'You are an expert Texas Holdem poker coach. Keep every response under 60 words and in 1–3 sentences. Focus only on actionable strategy for the current poker scenario.'
  }];

  for (const log of logs) {
    messages.push({ role: log.sender === 'ai' ? 'assistant' : 'user', content: log.message });
  }
  messages.push({ role: 'user', content: prompt });

  // Free/cheap default on OpenRouter
  // Alternatives: "anthropic/claude-3-haiku", "openai/gpt-4o-mini", "mistralai/mistral-nemo"
  const model = 'google/gemini-flash-1.5';

  const res = await fetch('/api/openrouter-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 256 })
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OpenRouter proxy error ${res.status}: ${err || res.statusText}`);
  }

  const data = await res.json().catch(() => ({}));
  const raw = data?.choices?.[0]?.message?.content?.trim?.() || '';
  return cleanMarkdown(raw);
}
