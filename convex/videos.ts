import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  query,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

export const storeVideo = action({
  args: {
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("you must be logged in to upload videos");
    }
    const user = await ctx.runQuery(internal.users.getUserById, {
      userId: identity.subject,
    });

    if (!user) {
      throw new Error("user not found");
    }

    const { videoId } = args;

    console.log("check video status in 60 seconds");
    await ctx.scheduler.runAfter(60000, internal.videos.fetchVideoData, {
      videoId: videoId,
      userId: user._id,
    });
  },
});

export const fetchVideoData = internalAction({
  args: {
    videoId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { videoId, userId } = args;
    const url = `https://api.stability.ai/v2alpha/generation/image-to-video/result/${videoId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "video/*",
        Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
      },
    });

    if (response.status === 202) {
      console.log("Generation is still running, try again in 15 second.");
      await ctx.scheduler.runAfter(15000, internal.videos.fetchVideoData, {
        videoId,
        userId,
      });
    } else if (response.status === 200) {
      console.log("Generation is complete!");
      const data = await response.arrayBuffer();
      const blob = new Blob([data], { type: "video/mp4" });

      // Store the video in convex storage
      const storageId: Id<"_storage"> = await ctx.storage.store(blob as Blob);
      console.log("StorageId", storageId);

      // Store the storageId, linking it to the user
      await ctx.runMutation(internal.videos.storeResult, {
        storageId: storageId,
        user: userId,
      });
    } else {
      throw new Error(`Response ${response.status}: ${await response.text()}`);
    }
  },
});

export const storeResult = internalMutation({
  args: {
    storageId: v.id("_storage"),
    user: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { storageId, user } = args;
    const videoUrl = await ctx.storage.getUrl(storageId);
    await ctx.db.insert("videos", { storageId, user, videoUrl: videoUrl! });
  },
});

export const getVideos = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const paginationResult = await ctx.db
      .query("videos")
      .order("desc") // newest first
      .paginate(args.paginationOpts);

    console.log(paginationResult);

    return paginationResult;
  },
});
