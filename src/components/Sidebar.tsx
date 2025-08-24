'use client';
import { NavigationContext, useNavigation } from '@/lib/NavigationProvider';
import { cn } from '@/lib/utils';
import { use } from 'react';
import { Button } from './ui/button';
import { PlusIcon } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'next/navigation';
import { Id } from '../../convex/_generated/dataModel';
import ChatRow from './ChatRow';

export default function Sidebar() {
 const router = useRouter();
 const { isMobileNavOpen, closeMobileNav } = use(NavigationContext);

 const createChat = useMutation(api.chats.createChat);
 const deleteChat = useMutation(api.chats.deleteChat);
 const chats = useQuery(api.chats.listChats);

 const handleDeleteChat = async (id: Id<'chats'>) => {
  await deleteChat({ id });
 };
 const handleNewChat = async () => {
  const chatId = await createChat({ title: 'New chat' });
  router.push(`/dashboard/chat/${chatId}`);
  closeMobileNav();
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
   {isMobileNavOpen && <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={closeMobileNav} />}
   <div
    className={cn(
     'fixed md:inset-y-0 top-14 bottom-0 left-0 z-50 w-72 bg-[#1f1e1d] backdrop-blur-xl border-r border-[#2b2a29]/40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:top-0 flex flex-col',
     isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
    )}
   >
    <div className="p-4 border-b border-[#2b2a29]/40">
     <Button
      onClick={handleNewChat}
      className="w-full bg-[#d97757] hover:bg-[#bf6b4b] text-[#262624] border border-[#d97757]/20 shadow-sm hover:shadow transition-all duration-200"
     >
      <PlusIcon className="mr-2 h-4 w-4" /> New Chat
     </Button>
    </div>

    <div className="flex-1 overflow-y-auto space-y-2.5 p-4 scrollbar-thin scrollbar-thumb-[#2b2a29] scrollbar-track-transparent dark-scrollbar">
     {chats?.map((chat) => <ChatRow key={chat._id} chat={chat} onDelete={handleDeleteChat} />)}
    </div>
   </div>
  </>
 );
}
