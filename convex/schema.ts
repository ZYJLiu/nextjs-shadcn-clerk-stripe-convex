import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    email: v.string(),
    subscriptionId: v.optional(v.string()),
    endsOn: v.optional(v.number()),
    credits: v.number(),
    name: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    profileImage: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_subscriptionId", ["subscriptionId"]),

  images: defineTable({
    user: v.optional(v.id("users")),
    storageId: v.id("_storage"),
    imageUrl: v.optional(v.string()),
  }).index("by_user", ["user"]),
});
