import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
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
  data.append("cfg_scale", "1.8");
  data.append("motion_bucket_id", "127");

  // generate video from image
  // add convex action to schedule polling for video generation completion
  // and store the video on convex, and add to videos table linked to user
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
  console.log("Generation ID:", responseJson);

  // schedule an action

  return new NextResponse(JSON.stringify({ videoId: responseJson.id }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
