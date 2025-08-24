'use client';

import { ReactEventHandler, useEffect, useRef, useState } from 'react';

import { Doc, Id } from '../../convex/_generated/dataModel';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { MessageRequest, StreamMessageType } from '@/lib/types';
import { createSSEParser } from '@/lib/SSEParser';
import { getConvexClient } from '@/lib/convex';
import { api } from '../../convex/_generated/api';
import { MessageBubble } from './MessageBubble';

type ChatInterfaceProps = {
 chatId: Id<'chats'>;
 messageList: Doc<'messages'>[];
};

export default function InterfaceChat({ chatId, messageList }: ChatInterfaceProps) {
 const [messages, setMessages] = useState<Doc<'messages'>[]>(messageList);
 const [isLoading, setLoading] = useState(false);
 const [input, setInput] = useState('');
 const [streamResponse, setStreamResponse] = useState('');
 const [currentTool, setCurrentTool] = useState<{ name: string; input: unknown } | null>(null);
 const messageEndRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages, messageEndRef]);

 const formatToolOutput = (output: unknown): string => {
  if (typeof output === 'string') return output;
  return JSON.stringify(output, null, 2);
 };

 const formatTerminalOutput = (tool: string, input: unknown, output: unknown) => {
  const terminalHtml = `<div class="bg-[#1e1e1e] text-[#c2c0b6] font-mono p-2 rounded-md my-2 overflow-x-auto whitespace-normal max-w-[600px]">
      <div class="flex items-center gap-1.5 border-b border-[#2b2a29] pb-1">
        <span class="text-red-500">●</span>
        <span class="text-yellow-400">●</span>
        <span class="text-green-400">●</span>
        <span class="text-[#bfbda8] ml-1 text-sm">~/${tool}</span>
      </div>
      <div class="text-[#bfbda8] mt-1">$ Input</div>
      <pre class="text-yellow-300 mt-0.5 whitespace-pre-wrap overflow-x-auto">${formatToolOutput(input)}</pre>
      <div class="text-[#bfbda8] mt-2">$ Output</div>
      <pre class="text-green-300 mt-0.5 whitespace-pre-wrap overflow-x-auto">${formatToolOutput(output)}</pre>
    </div>`;

  return `---START---\n${terminalHtml}\n---END---`;
 };

 const processStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (chunk: string) => Promise<void>
 ) => {
  try {
   while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await onChunk(new TextDecoder().decode(value));
   }
  } finally {
   reader.releaseLock();
  }
 };
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const trim = input.trim();
  if (isLoading || !trim) return;

  setInput('');
  setStreamResponse('');
  setCurrentTool(null);
  setLoading(true);
  const optimisticUserMessage: Doc<'messages'> = {
   _id: `temp_${Date.now()}`,
   chatId,
   content: trim,
   role: 'user',
   createAt: Date.now(),
  } as Doc<'messages'>;

  setMessages((prev) => [...prev, optimisticUserMessage]);
  let fullResponse = '';
  try {
   const messageRequest: MessageRequest = {
    messages: messages.map((msg) => ({
     role: msg.role,
     content: msg.content,
    })),
    newMessage: trim,
    chatId: chatId,
   };

   const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageRequest),
   });

   if (!response.ok) throw new Error(await response.text());
   if (!response.body) throw new Error('No body exist ');

   const parser = createSSEParser();
   const reader = response.body.getReader();

   await processStream(reader, async (chunk) => {
    // Parse SSE messages from the chunk
    const messages = parser.parse(chunk);

    // Handle each message based on its type
    for (const message of messages) {
     switch (message.type) {
      case StreamMessageType.Token:
       // Handle streaming tokens (normal text response)
       if ('token' in message) {
        fullResponse += message.token;
        setStreamResponse(fullResponse);
       }
       break;

      case StreamMessageType.ToolStart:
       // Handle start of tool execution (e.g. API calls, file operations)
       if ('tool' in message) {
        setCurrentTool({
         name: message.tool,
         input: message.input,
        });
        fullResponse += formatTerminalOutput(message.tool, message.input, 'Processing...');
        setStreamResponse(fullResponse);
       }
       break;

      case StreamMessageType.ToolEnd:
       // Handle completion of tool execution
       if ('tool' in message && currentTool) {
        // Replace the "Processing..." message with actual output
        const lastTerminalIndex = fullResponse.lastIndexOf('<div class="bg-[#1e1e1e]');
        if (lastTerminalIndex !== -1) {
         fullResponse =
          fullResponse.substring(0, lastTerminalIndex) +
          formatTerminalOutput(message.tool, currentTool.input, message.output);
         setStreamResponse(fullResponse);
        }
        setCurrentTool(null);
       }
       break;

      case StreamMessageType.Error:
       // Handle error messages from the stream
       if ('error' in message) {
        throw new Error(message.error);
       }
       break;

      case StreamMessageType.Done:
       // Handle completion of the entire response
       const assistantMessage: Doc<'messages'> = {
        _id: `temp_assistant_${Date.now()}`,
        chatId,
        content: fullResponse,
        role: 'assistant',
        createAt: Date.now(),
       } as Doc<'messages'>;

       // Save the complete message to the database
       const convex = getConvexClient();
       await convex.mutation(api.messages.store, {
        chatId,
        content: fullResponse,
        role: 'assistant',
       });
       console.log('this is the full response ', fullResponse);
       setMessages((prev) => [...prev, assistantMessage]);
       setStreamResponse('');
       return;
     }
    }
   });
  } catch (error) {
   // Handle any errors during streaming
   console.error('Error sending message:', error);
   // Remove the optimistic user message if there was an error
   setMessages((prev) => prev.filter((msg) => msg._id !== optimisticUserMessage._id));
   setStreamResponse(
    formatTerminalOutput('error', 'Failed to process message', error instanceof Error ? error.message : 'Unknown error')
   );
  } finally {
   setLoading(false);
  }
 };
  return (
    <>
      <style jsx>{`
    .dark-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .dark-scrollbar::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
    .dark-scrollbar::-webkit-scrollbar-thumb {
      background: #333333;
      border-radius: 4px;
    }
    .dark-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #404040;
    }
    .dark-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #333333 #1a1a1a;
    }
  `}</style>
  <main className="flex flex-col h-[calc(100vh-theme(spacing.14))]">
   <section className="flex-1 overflow-y-auto bg-[#262624] p-2 md:p-0 dark-scrollbar">
    <div className="max-w-4xl mx-auto p-4 space-y-3 text-[#c2c0b6]">
     {messages?.map((message: Doc<'messages'>) => (
      <MessageBubble key={message._id} content={message.content} isUser={message.role === 'user'} />
     ))}

     {streamResponse && <MessageBubble content={streamResponse} />}

     {/* Loading indicator */}
     {isLoading && !streamResponse && (
      <div className="flex justify-start animate-in fade-in-0">
       <div className="rounded-2xl px-4 py-3 bg-[#2b2a29]/80 text-[#c2c0b6] rounded-bl-none shadow-sm ring-1 ring-inset ring-[#2b2a29]/40">
        <div className="flex items-center gap-1.5">
         {[0.3, 0.15, 0].map((delay, i) => (
          <div
           key={i}
           className="h-1.5 w-1.5 rounded-full bg-[#bfbda8] animate-bounce"
           style={{ animationDelay: `-${delay}s` }}
          />
         ))}
        </div>
       </div>
      </div>
     )}
     <div ref={messageEndRef} />
    </div>
   </section>
   <footer className="border-t border-[#2b2a29]/40 bg-[#262624] p-4">
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
     <div className="relative flex items-center">
      <input
       type="text"
       onChange={(e) => setInput(e.target.value)}
       value={input}
       placeholder="Ai agent tap what ever u want "
       className="flex-1 py-3 px-4 rounded-2xl border border-[#2b2a29]/40 focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 focus:border-transparent pr-12 bg-[#2b2a29] text-[#c2c0b6] placeholder:text-[#bfbda8]"
       disabled={isLoading}
      />
      <Button
       disabled={isLoading || !input.trim()}
       type="submit"
       className={`absolute right-1.5 rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-all ${
        input.trim() ? 'bg-[#d97757] hover:bg-[#bf6b4b] text-[#262624] shadow-sm' : 'bg-[#2b2a29] text-[#6b665e]'
       }`}
      >
       <ArrowRight />
      </Button>
     </div>
    </form>
   </footer>
  </main>
  </>
 );
}
