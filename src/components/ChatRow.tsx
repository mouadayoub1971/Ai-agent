import { useRouter } from 'next/navigation';
import { Doc, Id } from '../../convex/_generated/dataModel';
import { use } from 'react';
import { NavigationContext } from '@/lib/NavigationProvider';
import { Button } from './ui/button';
import { TrashIcon } from '@radix-ui/react-icons';
import { api } from '../../convex/_generated/api';
import { useQuery } from 'convex/react';
import TimeAgo from 'react-timeago';
export default function ChatRow({ chat, onDelete }: { chat: Doc<'chats'>; onDelete: (id: Id<'chats'>) => void }) {
 const router = useRouter();
 const { closeMobileNav } = use(NavigationContext);
 const lastMessage = useQuery(api.messages.getLastMessage, {
  chatId: chat._id,
 });
 const handleClick = () => {
  router.push(`/dashboard/chat/${chat._id}`);
  closeMobileNav();
 };
 return (
  <div
   className="group rounded-xl border border-[#1f1e1d]/30 bg-[#0f0f0e] backdrop-blur-sm hover:bg-[#0f0f0e]/90 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md "
   onClick={handleClick}
  >
   <div className="p-4  ">
    <div className="flex justify-between items-center">
     <p className="text-sm text-[#c2c0b6] truncate flex-1 font-medium">
      {lastMessage ? (
       <>
        {lastMessage.role === 'user' ? 'You: ' : 'AI: '}
        {lastMessage.content.replace(/\n/g, '\n')}
       </>
      ) : (
       <span className="text-[#bfbda8]">New conversation</span>
      )}
     </p>
     <Button
      variant="ghost"
      size="icon"
      className="opacity-0 group-hover:opacity-100 -mr-2 -mt-0 ml-2 transition-opacity duration-200 hover:bg-neutral-900"
      onClick={(e) => {
       e.stopPropagation();
       onDelete(chat._id);
      }}
     >
      <TrashIcon className="h-4 w-4 text-[#bfbda8]  hover:text-[#d97757] transition-colors"></TrashIcon>
     </Button>
    </div>

    {lastMessage && (
     <p className="text-xs text-[#bfbda8] mt-1.5 font-medium">
      <TimeAgo date={lastMessage.createAt} />
     </p>
    )}
   </div>
  </div>
 );
}
