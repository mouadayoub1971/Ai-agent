import { auth } from "@clerk/nextjs/server";
import { Id } from "../../../../../convex/_generated/dataModel";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "../../../../../convex/_generated/api"; 
import ChatInterface from "@/components/InterfaceChat";

interface chatPageProps {
 params: {
  chatId : Id<"chats">
 }
} 


export default async function ChatPage({ params }: chatPageProps) {
  const { chatId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }


  const convex = getConvexClient()
  try {
  const messagesList = await convex.query(api.messages.list, { chatId });
  
  return (
    <div>
      <ChatInterface chatId={chatId} messageList={messagesList}></ChatInterface>
  </div>
  );
  } catch (error) {
    console.log("an error in chat id ", error);
    redirect("/dashboard")
  }
}

