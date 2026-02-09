// Vercel Serverless Function – Replicate Flux 2 Fast image generation proxy
const REPLICATE_ENDPOINT = 'https://api.replicate.com/v1/predictions';
const FLUX_VERSION = '7fbd6197df31149fd65a673011a4d9f70f67e0a96149ab522b2040b0b31cd154';

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
    version: FLUX_VERSION,
    input: {
      prompt,
      width: 1024,
      height: 1024,
      num_outputs: 1,
      aspect_ratio: '1:1',
      input_images: image_input,
      output_format: 'jpg',
      output_quality: 80
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

    // Flux returns output as an array of image URLs
    const imageUrl = Array.isArray(data.output) ? data.output[0] : null;

    if (!imageUrl) {
      res.status(502).json({
        error: 'No image returned from Flux',
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
