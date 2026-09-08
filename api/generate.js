import OpenAI from 'openai';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    },
    responseLimit: false
  },
  maxDuration: 300
};

const IMAGE_MODEL = "gpt-image-2.5-sunburst";
const IMAGE_QUALITY = "auto";
const IMAGE_BACKGROUND = "opaque";
const TEXT_MODEL = "gpt-4o";

const loadStyleReferences = async (styleId) => {
  if (styleId !== 'aspen-quick-ship') return [];

  return Promise.all(['showroom.png', 'display-detail.png'].map(async (filename) => {
    const image = await readFile(path.join(process.cwd(), 'public/style-references/aspen', filename));
    return `data:image/png;base64,${image.toString('base64')}`;
  }));
};

const nowMs = () => Date.now();

const timestamp = () => new Date().toISOString();

const estimateBase64Bytes = (dataUrl = "") => {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",").pop() : dataUrl;
  return Math.round((base64.length * 3) / 4);
};

const createImageGenerationParams = (prompt, image, stream = false, referenceImages = []) => ({
  model: TEXT_MODEL,
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: `${prompt}\n\nCRITICAL REQUIREMENT: You MUST use the image_generation tool to output the requested image. Do not return text.` },
        ...(referenceImages.length ? [{
          type: "input_text",
          text: "IMAGE ROLES: Image 1 is the source floorplan/render and the only image to edit. Preserve its geometry, viewpoint, composition, and protected logo/title block under the rules above. Images 2 and 3 are Aspen style references only: use their white wood-grain cabinetry, black hardware, weathered wood finishes, and restrained upholstery colors as visual material guidance. Follow the written Aspen style and special instructions wherever the references differ, including the gray wood main walls, neutral floor, limited accent colors, and light exposed wall tops. Do not copy the references' room layouts, camera views, furniture, people, signage, decor, rugs, wallpaper patterns, or additional objects. Return only the colorized Image 1.\n\nIMAGE 1 — SOURCE TO COLORIZE:"
        }] : []),
        { type: "input_image", image_url: image },
        ...referenceImages.flatMap((referenceImage, index) => [
          { type: "input_text", text: `IMAGE ${index + 2} — ASPEN STYLE REFERENCE ONLY (not the image to edit):` },
          { type: "input_image", image_url: referenceImage }
        ])
      ]
    }
  ],
  stream,
  tools: [
    {
      type: "image_generation",
      action: "edit",
      model: IMAGE_MODEL,
      quality: IMAGE_QUALITY,
      background: IMAGE_BACKGROUND,
      size: "auto",
      ...(stream ? { partial_images: 2 } : {})
    }
  ],
  tool_choice: { type: "image_generation" }
});

const getFirstGeneratedImage = (response) => (
  (response.output || [])
    .filter((output) => output.type === "image_generation_call")
    .map((output) => output.result)
    .find(Boolean)
);

const writeStreamEvent = (res, event) => {
  res.write(`${JSON.stringify(event)}\n`);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY server environment variable.' });
  }

  const { prompt, image, styleId, requestId, stream: shouldStream = false } = req.body || {};
  const generationRequestId = requestId || `gen_${nowMs()}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = nowMs();
  let streamStarted = false;

  if (!prompt || !image) {
    return res.status(400).json({ error: 'Missing prompt or image.' });
  }

  try {
    const referenceImages = await loadStyleReferences(styleId);

    console.log('[generate] start', {
      requestId: generationRequestId,
      timestamp: timestamp(),
      textModel: TEXT_MODEL,
      imageModel: IMAGE_MODEL,
      imageQuality: IMAGE_QUALITY,
      imageBackground: IMAGE_BACKGROUND,
      styleId,
      referenceImageCount: referenceImages.length,
      stream: Boolean(shouldStream),
      promptChars: prompt.length,
      inputImageApproxBytes: estimateBase64Bytes(image)
    });

    const openai = new OpenAI({ apiKey, maxRetries: 0 });

    if (shouldStream) {
      res.status(200);
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      streamStarted = true;

      writeStreamEvent(res, {
        type: 'started',
        requestId: generationRequestId,
        startedAt: timestamp()
      });

      let completedResponse = null;
      const openaiStream = await openai.responses.create(createImageGenerationParams(prompt, image, true, referenceImages));

      for await (const event of openaiStream) {
        if (event.type === "response.image_generation_call.partial_image") {
          writeStreamEvent(res, {
            type: 'partial',
            requestId: generationRequestId,
            partialImageIndex: event.partial_image_index,
            image: event.partial_image_b64,
            receivedAt: timestamp()
          });
        } else if (event.type === "response.completed") {
          completedResponse = event.response;
        }
      }

      const openaiDurationMs = nowMs() - startedAt;
      const imageData = getFirstGeneratedImage(completedResponse || {});

      if (!imageData) {
        console.error('[generate] no streamed image data', {
          requestId: generationRequestId,
          responseId: completedResponse?.id,
          timestamp: timestamp(),
          durationMs: openaiDurationMs,
          outputTypes: (completedResponse?.output || []).map((output) => output.type)
        });
        writeStreamEvent(res, {
          type: 'error',
          error: 'OpenAI returned no generated image.',
          requestId: generationRequestId,
          responseId: completedResponse?.id,
          durationMs: openaiDurationMs
        });
        return res.end();
      }

      console.log('[generate] stream complete', {
        requestId: generationRequestId,
        responseId: completedResponse.id,
        timestamp: timestamp(),
        durationMs: openaiDurationMs,
        outputTypes: (completedResponse.output || []).map((output) => output.type),
        outputImageApproxBytes: estimateBase64Bytes(imageData)
      });

      writeStreamEvent(res, {
        type: 'completed',
        image: imageData,
        requestId: generationRequestId,
        responseId: completedResponse.id,
        completedAt: timestamp(),
        durationMs: openaiDurationMs
      });
      return res.end();
    }

    const response = await openai.responses.create(createImageGenerationParams(prompt, image, false, referenceImages));

    const openaiDurationMs = nowMs() - startedAt;

    const imageData = getFirstGeneratedImage(response);

    if (!imageData) {
      console.error('[generate] no image data', {
        requestId: generationRequestId,
        responseId: response.id,
        timestamp: timestamp(),
        durationMs: openaiDurationMs,
        outputTypes: (response.output || []).map((output) => output.type)
      });
      return res.status(502).json({ error: 'OpenAI returned no generated image.', requestId: generationRequestId, responseId: response.id });
    }

    console.log('[generate] complete', {
      requestId: generationRequestId,
      responseId: response.id,
      timestamp: timestamp(),
      durationMs: openaiDurationMs,
      outputTypes: (response.output || []).map((output) => output.type),
      outputImageApproxBytes: estimateBase64Bytes(imageData)
    });

    return res.status(200).json({
      image: imageData,
      requestId: generationRequestId,
      responseId: response.id,
      completedAt: timestamp(),
      durationMs: openaiDurationMs
    });
  } catch (err) {
    const status = err.status || 500;
    const message = err.error?.message || err.message || 'OpenAI generation failed.';
    const durationMs = nowMs() - startedAt;

    console.error('[generate] failed', {
      requestId: generationRequestId,
      timestamp: timestamp(),
      status,
      message,
      type: err.error?.type,
      code: err.error?.code,
      durationMs
    });

    if (streamStarted) {
      writeStreamEvent(res, {
        type: 'error',
        error: message,
        status,
        requestId: generationRequestId,
        durationMs
      });
      return res.end();
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message, requestId: generationRequestId, durationMs });
  }
}
