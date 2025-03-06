import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
 chats: defineTable({
  title: v.string(),
  userId: v.string(),
  createAt: v.number() 
 }).index("by_user", ["userId"]),
 messages: defineTable({
  chatId: v.id("chats"),
  content: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),
  createAt: v.number()
 }).index("by_chat", ["chatId"])
})