import { getConvexClient } from '@/lib/convex';
import { MessageRequest, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, StreamMessageType } from '@/lib/types';
import { useAuth } from '@clerk/clerk-react';
import { NextResponse } from 'next/server';
import { StreamMessage } from '@/lib/types';
import { api } from '../../../../convex/_generated/api';

function sendSEEMessage(writer: WritableStreamDefaultWriter<Uint8Array>, data: StreamMessage) {
 const encoder = new TextEncoder();
 return writer.write(encoder.encode(`${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`));
}

export async function POST(req: Request) {
 try {
  const { userId } = useAuth();
  if (!userId) {
   return new Response('unauthorized', { status: 401 });
  }
  const body = (await req.json()) as MessageRequest;
  const { messages, newMessage, chatId } = body;
  const context = getConvexClient();

  const stream = new TransformStream({}, { highWaterMark: 1024 });
  const writer = stream.writable.getWriter();

  const response = new Response(stream.readable, {
   headers: {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
   },
  });

  const startSteam = async () => {
   try {
    await sendSEEMessage(writer, { type: StreamMessageType.Connected });
    await context.mutation(api.messages.send, {
     chatId,
     content: newMessage
    })
   } catch(error){
    console.log("error appear in the startStream : ", error)
    await sendSEEMessage(writer, {
     type: StreamMessageType.Error,
     error : error instanceof Error ? error.message : "unknown message"
    })
   }
  };
 } catch (error) {
  console.log('an error appear when we post a chat', error);
  return NextResponse.json({ error: 'An error Appear ' } as const, { status: 500 });
 }
}
