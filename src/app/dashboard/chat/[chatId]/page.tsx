import { Id } from "../../../../../convex/_generated/dataModel";


interface chatPageProps {
 params: {
  chatId : Id<"chats">
 }
} 


export default async function ChatPage({ params }: chatPageProps) {
 const { chatId } = await params;
  return (
    <div className="">
      {chatId}
    </div>
  );
}

