// client/api/hf-proxy.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('x-proxy-version', 'v4');        // <-- bump when redeploying
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Accept common names during migration; long term keep only HF_TOKEN
    const HF_TOKEN =
      process.env.HF_TOKEN ||
      process.env.VITE_HF_API_TOKEN ||
      process.env.REACT_APP_HF_API_TOKEN;

    if (!HF_TOKEN) {
      const keys = Object.keys(process?.env || {});
      const seen = keys.filter(k =>
        ['HF_TOKEN', 'VITE_HF_API_TOKEN', 'REACT_APP_HF_API_TOKEN'].includes(k)
      );
      res.setHeader('x-proxy-version', 'v4');
      res.setHeader('x-proxy-target', 'none');
      return res.status(500).json({ error: 'HF_TOKEN not set in environment', seen });
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
      res.setHeader('x-proxy-version', 'v4');
      res.setHeader('x-proxy-target', 'none');
      return res.status(400).json({ error: 'Missing "endpoint"' });
    }

    // --- ALWAYS use the Inference API ---
    // Map router-style chat payloads -> inference request
    let url, outPayload;

    if (endpoint.startsWith('v1/chat/completions')) {
      const model = 'mistralai/Mistral-7B-Instruct-v0.3'; // swap if gated for your account
      url = `https://api-inference.huggingface.co/models/${model}`;

      const messages = (payload && payload.messages) || [];
      const sys = messages.find(m => m.role === 'system')?.content || '';
      const chat = messages.filter(m => m.role !== 'system');
      let prompt = sys ? `System: ${sys}\n\n` : '';
      for (const m of chat) prompt += `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}\n`;
      prompt += 'Assistant:';

      outPayload = {
        inputs: prompt,
        parameters: {
          max_new_tokens: (payload && payload.max_tokens) || 256,
          temperature: (payload && payload.temperature) ?? 0.7
        }
      };
    } else if (endpoint.startsWith('models/')) {
      url = `https://api-inference.huggingface.co/${endpoint}`;
      outPayload = payload || {};
    } else {
      // Fallback: treat endpoint as a model id
      url = `https://api-inference.huggingface.co/models/${endpoint.replace(/^\/+/, '')}`;
      outPayload = payload || {};
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
    res.setHeader('x-proxy-version', 'v4');
    res.setHeader('x-proxy-target', 'inference');
    return res.status(r.status).send(text);
  } catch (e) {
    res.setHeader('x-proxy-version', 'v4');
    res.setHeader('x-proxy-target', 'error');
    return res.status(500).json({ error: String(e) });
  }
}
