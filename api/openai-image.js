// Vercel Serverless Function – Replicate FLUX.2 Pro image generation proxy
const REPLICATE_ENDPOINT = 'https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions';

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

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    res.status(500).json({ error: 'Server misconfiguration: missing REPLICATE_API_TOKEN' });
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

  const { prompt, image_input = [] } = body;

  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt in request payload' });
    return;
  }

  const payload = {
    input: {
      prompt,
      resolution: '1 MP',
      aspect_ratio: '1:1',
      input_images: image_input,
      output_format: 'webp',
      output_quality: 80,
      safety_tolerance: 2
    }
  };

  try {
    const replicateResponse = await fetch(REPLICATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        'Prefer': 'wait'
      },
      body: JSON.stringify(payload)
    });

    const data = await replicateResponse.json();

    if (!replicateResponse.ok) {
      res.status(replicateResponse.status).json({
        error: 'Replicate API error',
        details: data
      });
      return;
    }

    // FLUX.2 Pro returns output as a string URL or an array
    const imageUrl = typeof data.output === 'string' ? data.output : (Array.isArray(data.output) ? data.output[0] : null);

    if (!imageUrl) {
      res.status(502).json({
        error: 'No image returned from FLUX.2 Pro',
        status: data.status,
        details: data
      });
      return;
    }

    // Return in a consistent format
    res.status(200).json({
      url: imageUrl,
      status: data.status,
      id: data.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to contact Replicate API', details: error.message });
  }
};
