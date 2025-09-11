import { GoogleGenAI, createPartFromBase64, Modality } from "@google/genai";

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
    // Official Google GenAI SDK (Gemini) image generation, supports image-to-image
    let envModel = (process.env.GOOGLE_IMAGE_MODEL || "gemini-2.5-flash-image-preview").trim();
    // Map deprecated/non-preview alias to preview model name
    if (envModel === "gemini-2.5-flash-image" || envModel === "models/gemini-2.5-flash-image") {
      envModel = "gemini-2.5-flash-image-preview";
    }
    const model = envModel.startsWith("models/") ? envModel : envModel;

    const ai = new GoogleGenAI({ apiKey: token, apiVersion: "v1alpha" });

    // Build contents: array of parts (auto-wrapped as user content)
    const contents = [];
    if (typeof input_image === "string" && input_image.startsWith("data:")) {
      const m = input_image.match(/^data:([^;]+);base64,(.*)$/);
      if (m) {
        contents.push(createPartFromBase64(m[2], m[1]));
      }
    }
    contents.push({ text: prompt });

    const genConfig = { responseModalities: [Modality.IMAGE] };
    if (n) genConfig.candidateCount = Math.max(1, Math.min(4, Number(n) || 1));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: genConfig,
    });

    // Find the first inlineData image part
    const candidate = (response.candidates || [])[0];
    const imagePart = candidate?.content?.parts?.find?.(
      (p) => p?.inlineData && /^image\//.test(p.inlineData.mimeType || "") && typeof p.inlineData.data === "string"
    );
    if (!imagePart) {
      const dbg = response.text || "No image returned by Gemini";
      throw new Error(typeof dbg === "string" ? dbg : "No image returned by Gemini");
    }

    const mime = imagePart.inlineData.mimeType || "image/png";
    const dataUrl = `data:${mime};base64,${imagePart.inlineData.data}`;
    res.status(200).json({ image: dataUrl });
    return;
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
