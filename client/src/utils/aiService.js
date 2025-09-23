// src/utils/aiService.js

/**
 * Strips common Markdown elements for cleaner plain-text output.
 */
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

/**
 * Sends a chat prompt to Hugging Face's OpenAI-compatible router THROUGH our serverless proxy.
 * @param {string} prompt - Latest user message.
 * @param {{sender: string, message: string}[]} logs - Full chat history.
 * @returns {Promise<string>} AI response text, cleaned of Markdown.
 */
export async function sendToAI(prompt, logs = []) {
  // System instruction to ensure brevity
  const messages = [{
    role: 'system',
    content:
      'You are an expert Texas Holdem poker coach. Keep every response under 60 words and in 1–3 sentences. Focus only on actionable strategy for the current poker scenario.'
  }];

  // Append conversation history
  for (const log of logs) {
    messages.push({
      role: log.sender === 'ai' ? 'assistant' : 'user',
      content: log.message
    });
  }

  // Add the new user prompt
  messages.push({ role: 'user', content: prompt });

  // Body for the HF OpenAI-compatible router
  const body = {
    model: 'openai/gpt-oss-20b:fireworks-ai',
    messages,
    temperature: 0.7
  };

  // ⬇️ Call our serverless proxy; it injects the token server-side
  const res = await fetch('/api/hf-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // IMPORTANT: we send the router path as the endpoint
    body: JSON.stringify({
      endpoint: 'v1/chat/completions',
      payload: body
    })
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`HF proxy error ${res.status}: ${err || res.statusText}`);
  }

  // Router returns OpenAI-style JSON
  const data = await res.json().catch(() => ({}));
  const raw = data?.choices?.[0]?.message?.content?.trim?.() || '';
  return cleanMarkdown(raw);
}
