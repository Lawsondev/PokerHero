// client/api/groq-proxy.js

const ALLOWED_ORIGINS = new Set([
  process.env.CORS_ALLOW_ORIGIN,      // optional: set to your dev domain in Vercel if you want
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.has(origin) || ALLOWED_ORIGINS.has(undefined))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  try {
    applyCors(req, res);

    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'POST') {
      res.setHeader('x-groq-proxy', 'v1-cors');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      res.setHeader('x-groq-proxy', 'v1-cors');
      return res.status(500).json({ error: 'GROQ_API_KEY not set in env' });
    }

    // Safe parse for Vercel functions that may not pre-parse JSON
    const body = await new Promise((resolve, reject) => {
      if (req.body && typeof req.body === 'object') return resolve(req.body);
      let data = '';
      req.on('data', c => (data += c));
      req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
      req.on('error', reject);
    });

    const { model, messages, temperature = 0.7, max_tokens = 256 } = body || {};
    if (!model || !Array.isArray(messages)) {
      res.setHeader('x-groq-proxy', 'v1-cors');
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
    res.setHeader('x-groq-proxy', 'v1-cors');
    return res.status(r.status).send(text);
  } catch (e) {
    res.setHeader('x-groq-proxy', 'v1-cors');
    return res.status(500).json({ error: String(e) });
  }
}
