import { v } from "convex/values";
import {
  ActionCtx,
  MutationCtx,
  action,
  internalMutation,
  query,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const storeImage = action({
  args: {
    base64Image: v.string(),
  },
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

    const { base64Image } = args;

    const blob = base64ToBlob(base64Image);
    const storageId: Id<"_storage"> = await ctx.storage.store(blob as Blob);
    await ctx.runMutation(internal.images.storeResult, {
      storageId: storageId,
      user: user._id,
    });
  },
});

export const storeResult = internalMutation({
  args: {
    storageId: v.id("_storage"),
    user: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { storageId, user } = args;
    await ctx.db.insert("images", { storageId, user });
  },
});

export const getImages = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("you must be logged in to upload images");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("user not found");
    }

    const images = await ctx.db
      .query("images")
      .withIndex("by_user", (q) => q.eq("user", user._id))
      .collect();

    return Promise.all(
      images.map(async (image) => ({
        url: await ctx.storage.getUrl(image.storageId),
        createdAt: image._creationTime,
      })),
    );
  },
});

export function base64ToBlob(base64: string) {
  // Decode Base64 string
  const binary = atob(base64.split(",")[1]);

  // Create an array of bytes
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }

  // Create a Blob from the byte array
  return new Blob([new Uint8Array(array)], { type: "image/jpeg" });
}
