const OPENAI_IMAGE_ENDPOINT = 'https://api.openai.com/v1/images/generations';

async function readRequestBody(req) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('Request body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfiguration: missing OPENAI_API_KEY' });
    return;
  }

  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      const raw = await readRequestBody(req);
      body = raw ? JSON.parse(raw) : {};
    } catch (error) {
      res.status(400).json({ error: 'Invalid JSON body', details: error.message });
      return;
    }
  }

  const { prompt, size = '1024x1024', quality = 'standard', n = 1 } = body;

  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt in request payload' });
    return;
  }

  const payload = {
    model: 'dall-e-3',
    prompt,
    size,
    quality,
    n
  };

  try {
    const openaiResponse = await fetch(OPENAI_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const text = await openaiResponse.text();
    res.status(openaiResponse.status);
    res.setHeader('Content-Type', 'application/json');

    try {
      const json = JSON.parse(text);
      res.json(json);
    } catch (parseError) {
      res.send(text);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to contact OpenAI Images API', details: error.message });
  }
};
