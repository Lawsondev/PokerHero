// src/utils/aiService.js

// Hugging Face OpenAI-compatible router endpoint for chat completions
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

// Load API token from Vite (.env) or CRA env
const HF_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_HF_API_TOKEN) || process.env.REACT_APP_HF_API_TOKEN;
console.log('🔑 Loaded HF token:', HF_TOKEN);

if (!HF_TOKEN) {
  console.warn('Hugging Face API token not found. Set VITE_HF_API_TOKEN or REACT_APP_HF_API_TOKEN');
}

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
 * Sends a chat prompt to Hugging Face's OpenAI-compatible router and returns the reply.
 * @param {string} prompt - Latest user message.
 * @param {{sender: string, message: string}[]} logs - Full chat history.
 * @returns {Promise<string>} AI response text, cleaned of Markdown.
 */
export async function sendToAI(prompt, logs) {
  // System instruction to ensure brevity
  const messages = [{
    role: 'system',
    content: 'You are an expert Texas Holdem poker coach. Keep every response under 60 words and in 1–3 sentences. Focus only on actionable strategy for the current poker scenario.'
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

  // Build request body (no token limits as HF router doesn't accept them)
  const body = {
    model: 'openai/gpt-oss-20b:fireworks-ai',
    messages,
    temperature: 0.7
  };

  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF Router error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || '';
  return cleanMarkdown(raw);
}
