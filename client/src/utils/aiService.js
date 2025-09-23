// src/utils/aiService.js

// --- helpers ---
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

// Very simple chat -> text prompt for the Inference API
function renderPrompt(messages) {
  const sys = messages.find(m => m.role === 'system')?.content || '';
  const rest = messages.filter(m => m.role !== 'system');
  let out = sys ? `System: ${sys}\n\n` : '';
  for (const m of rest) out += `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}\n`;
  out += 'Assistant:';
  return out;
}

/**
 * Send to Hugging Face **Inference API** via our serverless proxy.
 * (No Router; avoids the “Inference Providers” permission issue.)
 *
 * @param {string} prompt
 * @param {{sender: string, message: string}[]} logs
 * @returns {Promise<string>}
 */
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

  // Choose a widely-available instruct model. If this is gated for your account,
  // swap to another public instruct model you can access.
  const model = 'mistralai/Mistral-7B-Instruct-v0.3'; // or 'HuggingFaceH4/zephyr-7b-beta'
  const promptText = renderPrompt(messages);

  const res = await fetch('/api/hf-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'inference',
      endpoint: `models/${model}`,
      payload: {
        inputs: promptText,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.7
        }
      }
    })
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`HF proxy error ${res.status}: ${err || res.statusText}`);
  }

  // Inference API usually returns an array of { generated_text }
  const txt = await res.text();
  try {
    const data = JSON.parse(txt);
    const out = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    return cleanMarkdown(String(out || '').trim());
  } catch {
    return cleanMarkdown(txt.trim());
  }
}
