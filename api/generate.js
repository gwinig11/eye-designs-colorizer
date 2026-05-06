import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    },
    responseLimit: false
  },
  maxDuration: 120
};

const IMAGE_MODEL = "gpt-image-2";
const IMAGE_QUALITY = "auto";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY server environment variable.' });
  }

  const { prompt, image } = req.body || {};

  if (!prompt || !image) {
    return res.status(400).json({ error: 'Missing prompt or image.' });
  }

  try {
    const openai = new OpenAI({ apiKey, maxRetries: 0 });
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: `${prompt}\n\nCRITICAL REQUIREMENT: You MUST use the image_generation tool to output the requested image. Do not return text.` },
            { type: "input_image", image_url: image }
          ]
        }
      ],
      tools: [
        {
          type: "image_generation",
          action: "edit",
          model: IMAGE_MODEL,
          quality: IMAGE_QUALITY,
          size: "auto"
        }
      ],
      tool_choice: { type: "image_generation" }
    });

    const imageData = (response.output || [])
      .filter((output) => output.type === "image_generation_call")
      .map((output) => output.result);

    if (!imageData?.[0]) {
      console.error('OpenAI generation returned no image data:', JSON.stringify(response.output || []));
      return res.status(502).json({ error: 'OpenAI returned no generated image.' });
    }

    return res.status(200).json({ image: imageData[0] });
  } catch (err) {
    const status = err.status || 500;
    const message = err.error?.message || err.message || 'OpenAI generation failed.';

    console.error('OpenAI generation failed:', {
      status,
      message,
      type: err.error?.type,
      code: err.error?.code
    });

    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
}
