// client/api/groq-proxy.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('x-groq-proxy', 'v1');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      res.setHeader('x-groq-proxy', 'v1');
      return res.status(500).json({ error: 'GROQ_API_KEY not set in env' });
    }

    // Safe parse
    const body = await new Promise((resolve, reject) => {
      if (req.body && typeof req.body === 'object') return resolve(req.body);
      let data = '';
      req.on('data', c => (data += c));
      req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
      req.on('error', reject);
    });

    const { model, messages, temperature = 0.7, max_tokens = 256 } = body || {};
    if (!model || !Array.isArray(messages)) {
      res.setHeader('x-groq-proxy', 'v1');
      return res.status(400).json({ error: 'model and messages required' });
    }

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens })
    });

    const text = await r.text();
    res.setHeader('x-groq-proxy', 'v1');
    return res.status(r.status).send(text);
  } catch (e) {
    res.setHeader('x-groq-proxy', 'v1');
    return res.status(500).json({ error: String(e) });
  }
}
