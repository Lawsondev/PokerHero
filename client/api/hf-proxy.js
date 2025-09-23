// client/api/hf-proxy.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Accept common env names; long-term keep only HF_TOKEN in Vercel
    const HF_TOKEN =
      process.env.HF_TOKEN ||
      process.env.VITE_HF_API_TOKEN ||
      process.env.REACT_APP_HF_API_TOKEN;

    if (!HF_TOKEN) {
      // Debug which keys exist at runtime (no secrets exposed)
      const keys = Object.keys(process?.env || {});
      const seen = keys.filter(k =>
        ['HF_TOKEN', 'VITE_HF_API_TOKEN', 'REACT_APP_HF_API_TOKEN'].includes(k)
      );
      res.status(500).json({ error: 'HF_TOKEN not set in environment', seen });
      return;
    }

    // Parse JSON body (Node/Vercel functions may not pre-parse)
    const body = await new Promise((resolve, reject) => {
      if (req.body && typeof req.body === 'object') return resolve(req.body);
      let data = '';
      req.on('data', c => (data += c));
      req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}); }
        catch { resolve({}); }
      });
      req.on('error', reject);
    });

    const { endpoint, payload } = body || {};
    if (!endpoint) {
      res.status(400).json({ error: 'Missing "endpoint"' });
      return;
    }

    // Use HF router (OpenAI-compatible paths like v1/chat/completions)
    const r = await fetch(`https://router.huggingface.co/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload || {})
    });

    const text = await r.text();
    res.status(r.status).send(text);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
