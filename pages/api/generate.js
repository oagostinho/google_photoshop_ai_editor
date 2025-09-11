import { experimental_generateImage as generateImage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ detail: "Method not allowed" });
    return;
  }

  const token =
    req.headers["x-google-api-key"] ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!token) {
    res.status(401).json({ detail: "Missing Google API key. Please provide your key in the x-google-api-key header." });
    return;
  }

  // Remove null/undefined values
  const body = Object.entries(req.body || {}).reduce(
    (a, [k, v]) => (v == null ? a : ((a[k] = v), a)),
    {}
  );

  const { prompt, input_image, aspect_ratio, person_generation, n } = body;
  if (!prompt) {
    res.status(400).json({ detail: "Missing required field: prompt" });
    return;
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey: token });

    // Prefer Imagen 3 for image generation via Google AI Studio (v1beta predict)
    const envModel = process.env.GOOGLE_IMAGE_MODEL;
    const fallbackModel = "imagen-3.0-generate-002";
    const modelId = !envModel || envModel.toLowerCase().startsWith("gemini")
      ? fallbackModel
      : envModel;

    const result = await generateImage({
      model: google.image(modelId),
      prompt,
      n: n || 1,
      aspectRatio: aspect_ratio || "1:1",
      providerOptions: {
        google: {
          personGeneration: person_generation, // 'dont_allow' | 'allow_adult' | 'allow_all'
        },
      },
    });

    const { image } = result;

    // Convert image bytes to a data URL for client-side display
    const base64 = Buffer.from(image.uint8Array).toString("base64");
    const mime = image.mimeType || "image/png";
    const dataUrl = `data:${mime};base64,${base64}`;

    res.status(200).json({ image: dataUrl });
  } catch (err) {
    console.error("AI SDK (Google) image generation failed:", err);
    const detail =
      err?.data?.error?.message ||
      err?.message ||
      "Image generation failed";
    res.status(500).json({ detail, error: String(detail) });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
