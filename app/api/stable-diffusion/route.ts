import { NextRequest, NextResponse } from "next/server";

interface GenerationResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

export async function POST(req: NextRequest) {
  const requestFormData = await req.formData();
  const { file } = Object.fromEntries(requestFormData.entries());

  const formData = new FormData();
  formData.append("init_image", file);
  formData.append("init_image_mode", "IMAGE_STRENGTH");
  formData.append("image_strength", "0.25");
  formData.append("steps", "40");
  // formData.append("width", "1024");
  // formData.append("height", "1024");
  formData.append("seed", "0");
  formData.append("cfg_scale", "20");
  formData.append("samples", "10");
  // formData.append("style_preset", "anime");
  formData.append(
    "text_prompts[0][text]",
    "maplestory hero, chibi, golden ratio",
  );
  formData.append("text_prompts[0][weight]", "1");
  formData.append("text_prompts[1][text]", "blurry, bad");
  formData.append("text_prompts[1][weight]", "-1");

  const response = await fetch(
    "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
    {
      headers: {
        Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
      },
      body: formData,
      method: "POST",
      // signal,
    },
  );

  const responseJSON = (await response.json()) as GenerationResponse;

  const images = responseJSON.artifacts.map(
    (artifact) => `data:image/jpeg;base64,${artifact.base64}`,
  );

  return new NextResponse(JSON.stringify({ imageData: images }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
