# Change Log and Decisions

This document tracks notable changes and key decisions made while updating the project.

## 2025-09-09

- Decision: Switch to Google Imagen for image generation using AI SDK’s Google provider.
  - Model: `imagen-3.0-generate-002` (AI Studio / Generative Language API).
  - Rationale: AI SDK’s `@ai-sdk/google` supports Google image generation via Imagen 3; it exposes `.image()` and integrates with `experimental_generateImage`.
  - Note: Current AI SDK Google ImageModel supports text-to-image prompts and parameters like `aspectRatio` and `personGeneration`. Image-to-image editing (providing a base image) is not exposed through the AI SDK Google ImageModel yet, so the input image is currently ignored.

- Change: Installed `@ai-sdk/google`.
- Change: Updated `pages/api/generate.js` to use AI SDK’s Google provider (`gemini-2.5-flash-image`).
- Change: Updated token flow to use Google API key via header `x-google-api-key` and UI storage key `googleApiKey`.
- Change: Updated prompt label sender to `gemini` in `components/prompt-form.js`.
- Change: Read Google image model from env var `GOOGLE_IMAGE_MODEL` (default `imagen-3.0-generate-002`). Added to `.env.example`.

- Open Question: If image-to-image editing must be supported via Gemini, we will either wait for AI SDK to expose editing inputs for Google Images, or add a direct Google Images API call (outside AI SDK) that accepts a base image/mask.
