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

const REFERENCE_STYLE_INSTRUCTIONS = `Perform a surface colorization of Image 1 only. Image 1 is the original black-and-white drawing and the sole authority for all scene content. Images 2 and 3 are material/color samples only, never scene or object templates.
SOURCE PRESERVATION TAKES PRIORITY OVER STYLE MATCHING AND ANY CONFLICTING PROMPT DETAIL:
- Keep every original object, architectural element, line, opening, and physical sign in precisely its original position, shape, size, count, orientation, and perspective. Preserve the camera, crop, margins, wall thickness, room layout, furniture, displays, shelving, hardware, and empty spaces.
- Do not add, delete, move, replace, redesign, complete, or embellish anything in Image 1. Do not turn an existing chair, cabinet, or display into a similar object from a reference. A blank surface stays blank; a sparse display stays sparse; an opening stays open. Do not infer missing detail from the references.
- SIGNAGE IS PROTECTED: Preserve all physical signs, branding, logos, posters, artwork, and labels on objects exactly as they appear in Image 1, including their wording, spelling, numbers, font, letterforms, spacing, size, border, placement, and perspective. Do not regenerate, correct, restyle, recolor, blur, replace, or reword them. Apply wall finishes around the existing signage, without repainting the lettering or graphics. Never introduce a sign, logo, word, poster, or graphic from a reference, even on an existing display or sign surface. Preserve the entire source logo/title block and every character inside it.
- The only permitted content removal is overlaid architectural plan annotations, such as room labels, dimensions, material notes, and construction notes. This cleanup exception NEVER applies to physical signage, branding, object labels, posters, artwork, or the logo/title block. If unsure whether text is a plan annotation or a physical sign, preserve it.
REFERENCE USE IS LIMITED TO palette, material color, subtle surface grain, and finish on surfaces that already exist in Image 1, within their exact original outlines and following the written Aspen material rules. Never copy reference objects, product arrangements, eyewear, posters, people, shelving, cabinet fronts, handles, plants, rugs, lights, wallpaper motifs, scenery, or their placement. Material transfer must not introduce their silhouettes, edges, seams, or structural details. The only permitted new seams are the explicitly requested flat wood-board finish inside existing feature-wall faces.
When a reference detail would change an original object or line, omit that detail and use a simple color fill. Preserve the original drawing even if the style match is less exact.
Pass these restrictions explicitly to the image_generation tool. Return only Image 1 with the permitted surface colors/finishes; never recreate a reference scene or combine scenes.`;

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
  ...(referenceImages.length ? { instructions: REFERENCE_STYLE_INSTRUCTIONS } : {}),
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: `${prompt}\n\nCRITICAL REQUIREMENT: You MUST use the image_generation tool to output the requested image. Do not return text.` },
        ...(referenceImages.length ? [{
          type: "input_text",
          text: "IMAGE 1 — ORIGINAL BLACK-AND-WHITE SOURCE TO COLORIZE. This image alone determines every object, line, physical sign, and spatial arrangement. Lock its scene contents and geometry; only the specified surface colors/finishes and removal of overlaid plan annotations are allowed. Physical signs, branding, artwork, and the logo/title block must remain exactly as supplied."
        }] : []),
        { type: "input_image", image_url: image },
        ...referenceImages.flatMap((referenceImage, index) => [
          { type: "input_text", text: `IMAGE ${index + 2} — ASPEN COLOR/MATERIAL SAMPLE ONLY. Ignore its objects, layout, text, and decorative details. Do not copy or substitute anything from this scene into Image 1:` },
          { type: "input_image", image_url: referenceImage }
        ]),
        ...(referenceImages.length ? [{
          type: "input_text",
          text: "FINAL SOURCE CHECK: Compare the output against Image 1, never against the references. Every original object, architectural line, opening, physical sign, logo, and graphic must remain in its original location and form. Check signs character by character: their wording, spelling, letterforms, and placement must match Image 1, with no substituted or invented text. Only overlaid plan annotations may be removed; physical signage and the entire title block are exempt from cleanup. Remove any imported reference content and restore any altered original detail before returning. If a finish cannot be applied without changing source detail, simplify or omit the finish. Output only the colorized original Image 1 with its original composition, white page, and intact title block."
        }] : [])
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
