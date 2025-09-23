// client/api/hf-proxy.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      res.status(500).json({ error: 'HF_TOKEN not set in environment' });
      return;
    }

    // Parse body safely
    const body = await new Promise((resolve, reject) => {
      if (req.body && typeof req.body === 'object') return resolve(req.body);
      let data = '';
      req.on('data', c => (data += c));
      req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
      });
      req.on('error', reject);
    });

    const { endpoint, payload } = body;
    if (!endpoint) {
      res.status(400).json({ error: 'Missing "endpoint"' });
      return;
    }

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
