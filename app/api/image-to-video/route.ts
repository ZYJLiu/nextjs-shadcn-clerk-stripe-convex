import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchAction } from "convex/nextjs";
import { auth } from "@clerk/nextjs";

// Clerk auth token for server-side requests
export async function getAuthToken() {
  return (await auth().getToken({ template: "convex" })) ?? undefined;
}

interface GenerationResponse {
  id: string;
}

export async function POST(req: NextRequest) {
  const token = await getAuthToken();

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const requestFormData = await req.formData();
  const { file } = Object.fromEntries(requestFormData.entries());

  const data = new FormData();
  data.append("image", file);
  data.append("seed", "0");
  data.append("cfg_scale", "2");
  data.append("motion_bucket_id", "255");

  // generate video from image using stable diffusion api
  const response = await fetch(
    "https://api.stability.ai/v2alpha/generation/image-to-video",
    {
      headers: {
        Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
      },
      body: data,
      method: "POST",
    },
  );

  const responseJson = (await response.json()) as GenerationResponse;
  console.log("Generation ID:", responseJson.id);
  const videoId = responseJson.id;

  // pass videoId to convex to poll for completion, then store video
  await fetchAction(
    api.videos.storeVideo,
    {
      videoId,
    },
    { token },
  );

  return new NextResponse(JSON.stringify({ videoId: videoId }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
