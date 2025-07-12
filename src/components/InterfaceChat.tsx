"use client"

import { ReactEventHandler, useEffect, useRef, useState } from "react"
import { Doc, Id } from "../../convex/_generated/dataModel"
import { Button } from "./ui/button"
import { ArrowRight } from "lucide-react"
import { MessageRequest } from "@/lib/types"

type ChatInterfaceProps = {
 chatId: Id<"chats">,
 messageList : Doc<"messages">[]
}


export default function InterfaceChat({chatId, messageList} : ChatInterfaceProps) {
 const [messages, setMessages] = useState<Doc<"messages">[]>(messageList);
 const [isLoading, setLoading] = useState(false);
 const [input, setInput] = useState("");
 const [streamResponse, setStreamResponse] = useState("");
 const [currentTool, setCurrentTool] = useState<{ name: string; input: unknown } | null>(null);
 const messageEndRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  messageEndRef.current?.scrollIntoView({behavior : "smooth"})
 }, [messages, messageEndRef])

 const handleSubmit = async (e : React.FormEvent) => {
  e.preventDefault()
  const trim = input.trim();
  if (isLoading || !trim) return 
  
  setInput("");
  setStreamResponse("");
  setCurrentTool(null);
  setLoading(true)
  const optimisticUserMessage: Doc<"messages"> = {
   _id: `temp_${Date.now()}`,
   chatId,
   content: trim,
   role: "user",
   createAt: Date.now(),
  } as Doc<"messages">;

  setMessages((prev) => [...prev, optimisticUserMessage])
  let fullResponse = "";
  try {
   const messageRequest: MessageRequest = {
    messages: messages.map((msg) =>( {
     role: msg.role,
     content : msg.content,
    })) ,
    newMessage: trim,
    chatId : chatId
   }

   const response = await fetch("api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body : JSON.stringify(messageRequest)
   })

   if(!response.ok) throw new  Error( await response.text())
   if(!response.body) throw new  Error("No body exist ")
  } catch (error) {
   console.log("an error appear ", error)
   setMessages((prev) => prev.filter((msg) => msg._id !== optimisticUserMessage._id))
   setStreamResponse("error")
  }

 }
 return <main className="flex flex-col h-[calc(100vh-theme(spacing.14))]">
  <section className="flex-1 overflow-y-auto bg-gray-50 p-2 md:p-0">
   <div>
    {messages.map((message) => (
     <div key={message._id} >{message.content}</div>
    ))}
    <div ref={messageEndRef}></div>
   </div>
  </section>
  <footer className="border-t bg-white p-4">
   <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
    <div className="relative flex items-center">
     <input type="text" onChange={(e) => setInput(e.target.value)} value={input} placeholder="Ai agent tap what ever u want " className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 bg-gray-50 placeholder:text-gray-500" disabled={isLoading} />
    <Button disabled={isLoading || !input.trim() } type="submit" className={`absolute right-1.5 rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-all ${ input.trim()
 ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-gray-100 text-gray-400"}`}><ArrowRight/></Button>
    </div>
   </form>
  </footer>
 </main>
}