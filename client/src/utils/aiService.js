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

// very simple chat -> text prompt for Inference API
function renderPrompt(messages) {
  const sys = messages.find(m => m.role === 'system')?.content || '';
  const rest = messages.filter(m => m.role !== 'system');
  let out = sys ? `System: ${sys}\n\n` : '';
  for (const m of rest) out += `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}\n`;
  out += 'Assistant:';
  return out;
}

/**
 * Send to Router first; if 403/404 or any non-2xx, hard-fallback to Inference API.
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

  // ---- 1) Try Router (OpenAI-compatible)
  const routerReq = {
    mode: 'router',
    endpoint: 'v1/chat/completions',
    payload: {
      model: 'openai/gpt-oss-20b:fireworks-ai',
      messages,
      temperature: 0.7
    }
  };

  let res = await fetch('/api/hf-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routerReq)
  });

  // If router disallows your token (403), or the endpoint/model is unavailable (404),
  // or any other non-2xx, fall back.
  const shouldFallback = !res.ok && (res.status === 403 || res.status === 404 || res.status === 401);

  if (shouldFallback) {
    // ---- 2) Fallback to classic Inference API
    // If you hit a gated model, switch to one you have access to.
    const fallbackModel = 'mistralai/Mistral-7B-Instruct-v0.3'; // or 'HuggingFaceH4/zephyr-7b-beta'
    const promptText = renderPrompt(messages);

    res = await fetch('/api/hf-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'inference',
        endpoint: `models/${fallbackModel}`,
        payload: {
          inputs: promptText,
          parameters: { max_new_tokens: 256, temperature: 0.7 }
        }
      })
    });
  }

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`HF proxy error ${res.status}: ${err || res.statusText}`);
  }

  const bodyText = await res.text();
  let reply = '';

  // Try Router JSON first; else parse Inference formats; else return raw text
  try {
    const data = JSON.parse(bodyText);
    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content.trim();             // Router
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      reply = String(data[0].generated_text || '').trim();        // Inference (array)
    } else if (data?.generated_text) {
      reply = String(data.generated_text).trim();                 // Inference (object)
    } else {
      reply = bodyText.trim();
    }
  } catch {
    reply = bodyText.trim();
  }

  return cleanMarkdown(reply);
}
