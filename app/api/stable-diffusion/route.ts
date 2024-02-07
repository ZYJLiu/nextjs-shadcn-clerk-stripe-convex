import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { auth } from "@clerk/nextjs";

// Clerk auth token for server-side requests
export async function getAuthToken() {
  return (await auth().getToken({ template: "convex" })) ?? undefined;
}

interface GenerationResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

export async function POST(req: NextRequest) {
  const token = await getAuthToken();

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

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
  formData.append("samples", "1");
  // formData.append("style_preset", "anime");
  formData.append(
    "text_prompts[0][text]",
    "golden ratio, maplestory hero, chibi",
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

  const uploadPromises = images.map((base64Image) =>
    uploadImage(base64Image, token!),
  );
  Promise.all(uploadPromises);

  return new NextResponse(JSON.stringify({ imageData: images }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function uploadImage(base64Image: string, token: string) {
  // Convert the base64 image to a blob
  const blobImage = base64ToBlob(base64Image);

  // Generate convex upload URL
  const postUrl = await fetchMutation(api.images.generateUploadUrl);

  // Upload the image using the generated URL
  const result = await fetch(postUrl, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg" },
    body: blobImage,
  });

  // Extract the convex storageId from the response
  const { storageId } = await result.json();

  console.log(storageId);

  // Store the storageId, linking it to the logged in user
  await fetchMutation(api.images.storeStorageId, { storageId }, { token });
}

function base64ToBlob(base64: string) {
  const byteCharacters = atob(base64.split(",")[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: "image/png" });
}
