import { Doc , Id} from "../../convex/_generated/dataModel"
export default function ChatRow({
 chat,
 onDelete,
}: {
  chat: Doc<"chats">;
 onDelete: (id: Id<"chats">) => void
}) {
 
}