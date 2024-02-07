"use node";
import { v } from "convex/values";
import { ActionCtx, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

interface GenerationResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

export const generateImage = action({
  args: { base64Image: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("you must be logged in to upload images");
    }
    const user = await ctx.runQuery(internal.users.getUserById, {
      userId: identity.subject,
    });

    if (!user) {
      throw new Error("user not found");
    }

    const sourceImage = args.base64Image;
    const imageBlob = base64ToBlob(sourceImage);

    const formData = new FormData();
    formData.append("init_image", imageBlob);
    formData.append("init_image_mode", "IMAGE_STRENGTH");
    formData.append("image_strength", "0.25");
    formData.append("steps", "40");
    formData.append("seed", "0");
    formData.append("cfg_scale", "20");
    formData.append("samples", "1");
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
      },
    );

    const responseJSON = (await response.json()) as GenerationResponse;

    const images = responseJSON.artifacts.map(
      (artifact) => `data:image/jpeg;base64,${artifact.base64}`,
    );

    const storeImagePromises = images.map((image) => {
      console.log("storing", image);
      return store(ctx, image, user._id);
    });

    await Promise.all(storeImagePromises);

    return images;
  },
});

async function store(ctx: ActionCtx, base64Image: string, userId: Id<"users">) {
  const blob = base64ToBlob(base64Image);
  const storageId: Id<"_storage"> = await ctx.storage.store(blob as Blob);
  await ctx.runMutation(internal.images.storeResult, {
    storageId: storageId,
    user: userId,
  });
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
