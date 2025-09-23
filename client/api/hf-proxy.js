// client/api/hf-proxy.js
export default async function handler(req, res) {
  res.setHeader('x-proxy-version', 'hf-deprecated');
  res.status(410).json({
    error: 'HF proxy is deprecated. Client must call /api/openrouter-proxy.',
  });
}