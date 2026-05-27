import OpenAI, { toFile } from "openai";
import { BUNDLE_PROMPT, IMAGE_MODEL } from "@/lib/constants";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to your .env.local file.",
    );
  }
  return new OpenAI({ apiKey });
}

export async function generateBundleImage(
  productA: File,
  productB: File,
): Promise<string> {
  const client = getClient();

  const imageA = await toFile(productA, productA.name, { type: productA.type });
  const imageB = await toFile(productB, productB.name, { type: productB.type });

  const response = await client.images.edit({
    model: IMAGE_MODEL,
    image: [imageA, imageB],
    prompt: BUNDLE_PROMPT,
    size: "1024x1024",
    quality: "high",
    input_fidelity: "high",
    output_format: "png",
    n: 1,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI did not return an image. Please try again.");
  }

  return b64;
}

export function getOpenAIErrorMessage(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      return "Invalid OpenAI API key. Check your OPENAI_API_KEY in .env.local.";
    }
    if (error.status === 429) {
      return "OpenAI rate limit reached. Please wait a moment and try again.";
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while generating the bundle image.";
}
