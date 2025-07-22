import { getConvexClient } from '@/lib/convex';
import { MessageRequest, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, StreamMessageType } from '@/lib/types';
import { useAuth } from '@clerk/clerk-react';
import { NextResponse } from 'next/server';
import { StreamMessage } from '@/lib/types';
import { api } from '../../../../convex/_generated/api';
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { submitQuestion } from '@/lib/langgraph';

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
    const langChainMessages = [
          ...messages.map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
          new HumanMessage(newMessage),
    ];
   try {
          const eventStream = await submitQuestion(langChainMessages, chatId);

          for await (const event of eventStream) {

            if (event.event === "on_chat_model_stream") {
              const token = event.data.chunk;
              if (token) {
                const text = token.content.at(0)?.["text"];
                if (text) {
                  await sendSEEMessage(writer, {
                    type: StreamMessageType.Token,
                    token: text,
                  });
                }
              }
            } else if (event.event === "on_tool_start") {
              await sendSEEMessage(writer, {
                type: StreamMessageType.ToolStart,
                tool: event.name || "unknown",
                input: event.data.input,
              });
            } else if (event.event === "on_tool_end") {
              const toolMessage = new ToolMessage(event.data.output);

              await sendSEEMessage(writer, {
                type: StreamMessageType.ToolEnd,
                tool: toolMessage.lc_kwargs.name || "unknown",
                output: event.data.output,
              });
            }
          }


          await sendSEEMessage(writer, { type: StreamMessageType.Done });
        } catch (streamError) {
          console.error("Error in event stream:", streamError);
          await sendSEEMessage(writer, {
            type: StreamMessageType.Error,
            error:
              streamError instanceof Error
                ? streamError.message
                : "Stream processing failed",
          });
        }
   } catch(error){
    console.log("error appear in the startStream : ", error)
    await sendSEEMessage(writer, {
     type: StreamMessageType.Error,
     error : error instanceof Error ? error.message : "unknown message"
    }) 
   } finally {
        try {
          await writer.close();
        } catch (closeError) {
          console.error("Error closing writer:", closeError);
        }
      }
  };
  return       ;
 } catch (error) {
  console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" } as const,
      { status: 500 }
    );
 }
}
