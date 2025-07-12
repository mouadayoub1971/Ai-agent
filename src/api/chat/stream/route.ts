import { getConvexClient } from "@/lib/convex";
import { MessageRequest } from "@/lib/types";
import { useAuth } from "@clerk/clerk-react";
import { NextResponse } from "next/server";



export async function POST(req: Request) {
 try {
  const { userId } = useAuth();
 if (!userId) {
  return new Response("unauthorized" , {status : 401})  
  }
 const body =  (await req.json() ) as MessageRequest 
 const { messages, newMessage, chatId } = body
 const context =  getConvexClient()

  const stream = new TransformStream({}, { highWaterMark: 1024 })
  const writer = stream.writable.getWriter()

  const response = new Response(stream.readable, {
   headers: {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "X-Accel-Buffering" : "no"
   }
  })
 } catch(error) {
  console.log("an error appear when we post a chat", error)
  return NextResponse.json(
   { error: "An error Appear " } as const,
   { status: 500 }
  )
 }
}