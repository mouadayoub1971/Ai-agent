import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
 args: { chatId: v.id("chats") },
 handler: async (ctx, args) => {
  const messages = await ctx.db
   .query("messages")
   .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
   .order("asc")
   .collect()
  return messages;
 }
})