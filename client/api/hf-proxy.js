// client/api/hf-proxy.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Accept common env names during migration; long term, keep only HF_TOKEN
    const HF_TOKEN =
      process.env.HF_TOKEN ||
      process.env.VITE_HF_API_TOKEN ||
      process.env.REACT_APP_HF_API_TOKEN;

    if (!HF_TOKEN) {
      const keys = Object.keys(process?.env || {});
      const seen = keys.filter(k =>
        ['HF_TOKEN', 'VITE_HF_API_TOKEN', 'REACT_APP_HF_API_TOKEN'].includes(k)
      );
      res.status(500).json({ error: 'HF_TOKEN not set in environment', seen });
      return;
    }

    // Parse JSON body safely
    const body = await new Promise((resolve, reject) => {
      if (req.body && typeof req.body === 'object') return resolve(req.body);
      let data = '';
      req.on('data', c => (data += c));
      req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
      req.on('error', reject);
    });

    let { endpoint, payload } = body || {};
    if (!endpoint) {
      res.status(400).json({ error: 'Missing "endpoint"' });
      return;
    }

    // Always target the Inference API
    let url = '';
    let outPayload = payload || {};
    let model = null;

    // If client sent router-style chat, map it to a prompt + model
    if (endpoint.startsWith('v1/chat/completions')) {
      // Default public instruct model (change if gated for your account)
      model = 'HuggingFaceH4/zephyr-7b-beta'; // alternatives: 'HuggingFaceH4/zephyr-7b-beta', 'tiiuae/falcon-7b-instruct'
      url = `https://api-inference.huggingface.co/models/${model}`;

      const messages = (payload && payload.messages) || [];
      const sys = messages.find(m => m.role === 'system')?.content || '';
      const chat = messages.filter(m => m.role !== 'system');
      let prompt = sys ? `System: ${sys}\n\n` : '';
      for (const m of chat) {
        prompt += `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}\n`;
      }
      prompt += 'Assistant:';

      outPayload = {
        inputs: prompt,
        parameters: {
          max_new_tokens: (payload && payload.max_tokens) || 256,
          temperature: (payload && payload.temperature) ?? 0.7
        }
      };
    } else if (endpoint.startsWith('models/')) {
      // Already an inference endpoint; just forward
      url = `https://api-inference.huggingface.co/${endpoint}`;
    } else {
      // Fallback: treat as inference models/<endpoint>
      model = endpoint.replace(/^\/+/, '');
      url = `https://api-inference.huggingface.co/models/${model}`;
    }

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(outPayload)
    });

    const text = await r.text();
    // Helpful response header so you can confirm the path used
    res.setHeader('x-proxy-target', 'inference');
    res.status(r.status).send(text);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
