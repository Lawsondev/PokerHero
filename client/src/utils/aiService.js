// src/utils/aiService.js

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

// Render chat messages to a single prompt for Inference API text-generation
function renderPrompt(messages) {
  // Simple chat-style prompt; adjust to your preferred template
  const sys = messages.find(m => m.role === 'system')?.content || '';
  const rest = messages.filter(m => m.role !== 'system');
  let out = sys ? `System: ${sys}\n\n` : '';
  for (const m of rest) {
    out += `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}\n`;
  }
  out += 'Assistant:';
  return out;
}

/**
 * Sends a chat prompt through our proxy. Tries Router first; on 403 falls back to the free Inference API.
 * @param {string} prompt
 * @param {{sender: string, message: string}[]} logs
 */
export async function sendToAI(prompt, logs = []) {
  const messages = [{
    role: 'system',
    content:
      'You are an expert Texas Holdem poker coach. Keep every response under 60 words and in 1–3 sentences. Focus only on actionable strategy for the current poker scenario.'
  }];

  for (const log of logs) {
    messages.push({
      role: log.sender === 'ai' ? 'assistant' : 'user',
      content: log.message
    });
  }
  messages.push({ role: 'user', content: prompt });

  // 1) Try HF Router (OpenAI-compatible)
  const routerBody = {
    model: 'openai/gpt-oss-20b:fireworks-ai',
    messages,
    temperature: 0.7
  };

  let res = await fetch('/api/hf-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'router',
      endpoint: 'v1/chat/completions',
      payload: routerBody
    })
  });

  // 403 => no permission for Inference Providers; fallback to Inference API
  if (res.status === 403) {
    // 2) Classic Inference API (choose a strong, commonly available chat/instruct model)
    // If this model is gated for you, pick another public instruct model you have access to.
    const model = 'HuggingFaceH4/zephyr-7b-beta'; // good default; change if needed
    const promptText = renderPrompt(messages);

    res = await fetch('/api/hf-proxy', {
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
  }

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`HF proxy error ${res.status}: ${err || res.statusText}`);
  }

  // Try to parse router JSON first; otherwise parse inference output
  const txt = await res.text();
  let reply = '';

  try {
    const data = JSON.parse(txt);
    // Router (OpenAI-style)
    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content.trim();
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      // Inference API returns an array of { generated_text }
      reply = String(data[0].generated_text || '').trim();
    } else if (data?.generated_text) {
      reply = String(data.generated_text).trim();
    } else {
      reply = txt.trim();
    }
  } catch {
    reply = txt.trim();
  }

  return cleanMarkdown(reply);
}
