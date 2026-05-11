import OpenAI from 'openai';
const API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: API_KEY });

async function run() {
  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [{ role: "user", content: "Draw a small red square." }],
    tools: [{ type: "image_generation", model: "gpt-image-2", quality: "auto", background: "opaque" }]
  });
  console.log(JSON.stringify(response.output, null, 2));
}
run();
