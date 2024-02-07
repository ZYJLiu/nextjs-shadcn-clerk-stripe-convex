import { v } from "convex/values";
import {
  ActionCtx,
  MutationCtx,
  action,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const storeStorageId = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
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

    const { storageId } = args;
    const imageUrl = await ctx.storage.getUrl(storageId);

    await ctx.db.insert("images", {
      storageId,
      user: user._id,
      imageUrl: imageUrl!,
    });
  },
});

export const patchImage = mutation({
  handler: async (ctx) => {
    const imageDocs = await ctx.db.query("images").collect();

    for (const imageDoc of imageDocs) {
      const imageUrl = await ctx.storage.getUrl(imageDoc.storageId);
      await ctx.db.patch(imageDoc._id, { imageUrl: imageUrl! });
    }
  },
});

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
    const imageUrl = await ctx.storage.getUrl(storageId);
    await ctx.db.insert("images", { storageId, user, imageUrl: imageUrl! });
  },
});

export const getImages = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
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

    const paginationResult = await ctx.db
      .query("images")
      .withIndex("by_user", (q) => q.eq("user", user._id))
      .order("desc") // newest first
      .paginate(args.paginationOpts);
    //   .collect()

    return paginationResult;

    // const images = (paginationResult as any).items as Array<{
    //   _id: Id<"images">;
    //   _creationTime: number;
    //   user: Id<"users">;
    //   storageId: Id<"_storage">;
    // }>;

    // return Promise.all(
    //   images.map(async (image) => ({
    //     url: await ctx.storage.getUrl(image.storageId),
    //     createdAt: image._creationTime,
    //   })),
    // );
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
