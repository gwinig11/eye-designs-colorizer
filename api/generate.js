import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    },
    responseLimit: false
  },
  maxDuration: 300
};

const IMAGE_MODEL = "gpt-image-2";
const IMAGE_QUALITY = "auto";
const TEXT_MODEL = "gpt-4o";

const nowMs = () => Date.now();

const timestamp = () => new Date().toISOString();

const estimateBase64Bytes = (dataUrl = "") => {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",").pop() : dataUrl;
  return Math.round((base64.length * 3) / 4);
};

const createImageGenerationParams = (prompt, image, stream = false) => ({
  model: TEXT_MODEL,
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: `${prompt}\n\nCRITICAL REQUIREMENT: You MUST use the image_generation tool to output the requested image. Do not return text.` },
        { type: "input_image", image_url: image }
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

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY server environment variable.' });
  }

  const { prompt, image, requestId, stream: shouldStream = false } = req.body || {};
  const generationRequestId = requestId || `gen_${nowMs()}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = nowMs();
  let streamStarted = false;

  if (!prompt || !image) {
    return res.status(400).json({ error: 'Missing prompt or image.' });
  }

  try {
    console.log('[generate] start', {
      requestId: generationRequestId,
      timestamp: timestamp(),
      textModel: TEXT_MODEL,
      imageModel: IMAGE_MODEL,
      imageQuality: IMAGE_QUALITY,
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
      const openaiStream = await openai.responses.create(createImageGenerationParams(prompt, image, true));

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

    const response = await openai.responses.create(createImageGenerationParams(prompt, image));

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
        requestId: generationRequestId,
        durationMs
      });
      return res.end();
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message, requestId: generationRequestId, durationMs });
  }
}
