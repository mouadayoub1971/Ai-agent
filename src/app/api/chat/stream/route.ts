import { getConvexClient } from '@/lib/convex';
import { MessageRequest, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, StreamMessageType } from '@/lib/types';
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import { StreamMessage } from '@/lib/types';
import { api } from '../../../../../convex/_generated/api';
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { submitQuestion } from '@/lib/langgraph';

function sendSEEMessage(writer: WritableStreamDefaultWriter<Uint8Array>, data: StreamMessage) {
 const encoder = new TextEncoder();
 console.log('📤 Sending SSE message:', data.type, data);
 return writer.write(encoder.encode(`${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`));
}

export async function POST(req: Request) {
 console.log('🚀 POST request received');
 
 try {
  const { userId } = await auth();
  console.log('👤 User ID:', userId);
  
  if (!userId) {
   console.log('❌ Unauthorized - no user ID');
   return new Response('unauthorized', { status: 401 });
  }
  
  const body = (await req.json()) as MessageRequest;
  console.log('📝 Request body:', {
   messagesCount: body.messages?.length,
   newMessage: body.newMessage,
   chatId: body.chatId
  });
  
  const { messages, newMessage, chatId } = body;
  const context = getConvexClient();
  console.log('🔗 Convex client initialized');

  const stream = new TransformStream({}, { highWaterMark: 1024 });
  const writer = stream.writable.getWriter();
  console.log('🌊 Stream created');

  const response = new Response(stream.readable, {
   headers: {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
   },
  });
  console.log('📡 Response headers set');

  (async () => {
     try {
    console.log('🔄 Starting async stream processing');
    
    await sendSEEMessage(writer, { type: StreamMessageType.Connected });
    console.log('✅ Connected message sent');
    
    console.log('💾 Saving message to Convex...');
    await context.mutation(api.messages.send, {
     chatId,
     content: newMessage
    });
    console.log('✅ Message saved to Convex');
    
    const langChainMessages = [
          ...messages.map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
          new HumanMessage(newMessage),
    ];
    console.log('🔗 LangChain messages prepared:', langChainMessages.length, 'messages');
    
   try {
          console.log('🤖 Submitting question to LangGraph...');
          const eventStream = await submitQuestion(langChainMessages, chatId);
          console.log('📥 Event stream received from LangGraph');

          let eventCount = 0;
          for await (const event of eventStream) {
            eventCount++;
            console.log(`📨 Event ${eventCount}:`, event.event, {
              name: event.name,
              dataKeys: Object.keys(event.data || {})
            });

            if (event.event === "on_chat_model_stream") {
              const token = event.data.chunk;
              console.log('🔤 Processing chat model stream token:', !!token);
              
              if (token) {
    console.log("🔎 Full token object:", JSON.stringify(token, null, 2));
    
    // Let's debug all possible ways to access the content
    console.log('🔍 Debugging token structure:');
    console.log('  - token.kwargs:', token.kwargs);
    console.log('  - token.kwargs?.content:', token.kwargs?.content);
    console.log('  - token.content:', token.content);
    console.log('  - event.data:', JSON.stringify(event.data, null, 2));
    
    // Try different access patterns
    let text = null;
    
    if (token.kwargs && token.kwargs.content !== undefined) {
      text = token.kwargs.content;
      console.log('✅ Found content via token.kwargs.content:', text);
    } else if (token.content !== undefined) {
      text = token.content;
      console.log('✅ Found content via token.content:', text);
    } else if (typeof token === 'string') {
      text = token;
      console.log('✅ Token is string:', text);
    } else {
      console.log('❌ Could not find content in token');
      console.log('  - Available token keys:', Object.keys(token));
      if (token.kwargs) {
        console.log('  - Available kwargs keys:', Object.keys(token.kwargs));
      }
    }
    
    console.log('📝 Final extracted text:', text);
    console.log('📝 Text type:', typeof text);
    console.log('📝 Text truthy:', !!text);
                if (text) {
                  await sendSEEMessage(writer, {
                    type: StreamMessageType.Token,
                    token: text,
                  });
                }
              }
            } else if (event.event === "on_tool_start") {
              console.log('🔧 Tool start:', event.name, 'with input:', event.data.input);
              
              await sendSEEMessage(writer, {
                type: StreamMessageType.ToolStart,
                tool: event.name || "unknown",
                input: event.data.input,
              });
            } else if (event.event === "on_tool_end") {
              console.log('✅ Tool end:', event.name, 'with output keys:', Object.keys(event.data.output || {}));
              
              const toolMessage = new ToolMessage(event.data.output);

              await sendSEEMessage(writer, {
                type: StreamMessageType.ToolEnd,
                tool: toolMessage.lc_kwargs.name || "unknown",
                output: event.data.output,
              });
            }
          }

          console.log(`🏁 Stream processing complete. Total events: ${eventCount}`);
          await sendSEEMessage(writer, { type: StreamMessageType.Done });
          console.log('✅ Done message sent');
          
        } catch (streamError) {
          console.error("❌ Error in event stream:", streamError);
          console.error("Stack trace:", streamError instanceof Error ? streamError.stack : 'No stack trace');
          
          await sendSEEMessage(writer, {
            type: StreamMessageType.Error,
            error:
              streamError instanceof Error
                ? streamError.message
                : "Stream processing failed",
          });
        }
   } catch(error){
    console.error("❌ Error in startStream:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    
    await sendSEEMessage(writer, {
     type: StreamMessageType.Error,
     error : error instanceof Error ? error.message : "unknown message"
    }) 
   } finally {
        try {
          console.log('🔒 Closing writer...');
          await writer.close();
          console.log('✅ Writer closed successfully');
        } catch (closeError) {
          console.error("❌ Error closing writer:", closeError);
        }
      }
  })()
  
  console.log('📤 Returning response');
  return response;
  
 } catch (error) {
  console.error("❌ Error in chat API:", error);
  console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
  
    return NextResponse.json(
      { error: "Failed to process chat request" } as const,
      { status: 500 }
    );
 }
}