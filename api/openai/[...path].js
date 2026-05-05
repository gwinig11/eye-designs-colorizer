export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  },
  maxDuration: 60
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, OpenAI-Beta');
    return res.status(204).end();
  }

  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY server environment variable.' });
  }

  try {
    const upstreamResponse = await fetch(`https://api.openai.com/v1/${path}`, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': req.headers['content-type'] || 'application/json'
      },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body)
    });

    const contentType = upstreamResponse.headers.get('content-type') || 'application/json';
    const body = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      console.error(`OpenAI upstream ${upstreamResponse.status} for /v1/${path}:`, body);
    }

    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', contentType);
    res.send(body);
  } catch (err) {
    console.error('OpenAI proxy request failed:', err);
    res.status(500).json({ error: 'OpenAI proxy request failed.' });
  }
}
