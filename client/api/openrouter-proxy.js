// client/api/openrouter-proxy.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const OR_KEY = process.env.OPENROUTER_API_KEY;
    if (!OR_KEY) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not set in env' });
    }

    // Parse JSON body safely
    const body = await new Promise((resolve, reject) => {
      if (req.body && typeof req.body === 'object') return resolve(req.body);
      let data = '';
      req.on('data', c => (data += c));
      req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
      req.on('error', reject);
    });

    const { model, messages, temperature = 0.7, max_tokens = 256 } = body || {};
    if (!model || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'model and messages required' });
    }

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OR_KEY}`,
        'Content-Type': 'application/json',
        // Optional but recommended so your app shows in OpenRouter logs
        'HTTP-Referer': process.env.OPENROUTER_REFERRER || '',
        'X-Title': 'Poker Hero AI Coaching'
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens })
    });

    const text = await r.text();
    res.status(r.status).send(text);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
