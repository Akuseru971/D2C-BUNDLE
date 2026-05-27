import { NextRequest, NextResponse } from "next/server";
import { generateBundleImage, getOpenAIErrorMessage } from "@/lib/openai";
import { validateImageFile } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const productA = formData.get("productA");
    const productB = formData.get("productB");
    const productC = formData.get("productC");

    if (!(productA instanceof File) || !(productB instanceof File)) {
      return NextResponse.json(
        { error: "Product A and Product B are required." },
        { status: 400 },
      );
    }

    const validationA = validateImageFile(productA);
    if (!validationA.valid) {
      return NextResponse.json(
        { error: `Product A: ${validationA.error}` },
        { status: 400 },
      );
    }

    const validationB = validateImageFile(productB);
    if (!validationB.valid) {
      return NextResponse.json(
        { error: `Product B: ${validationB.error}` },
        { status: 400 },
      );
    }

    let productCFile: File | null = null;
    if (productC instanceof File && productC.size > 0) {
      const validationC = validateImageFile(productC);
      if (!validationC.valid) {
        return NextResponse.json(
          { error: `Product C: ${validationC.error}` },
          { status: 400 },
        );
      }
      productCFile = productC;
    }

    const b64 = await generateBundleImage(productA, productB, productCFile);

    return NextResponse.json({
      image: `data:image/png;base64,${b64}`,
    });
  } catch (error) {
    console.error("[generate-bundle]", error);
    const message = getOpenAIErrorMessage(error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
