import { BotIcon } from 'lucide-react';

export default function WelcomeMessage() {
 return (
  <div className="flex flex-col items-center justify-center h-full mt-10">
   <div className="bg-[#2b2a29] rounded-2xl shadow-lg ring-1 ring-inset ring-[#2b2a29]/40 px-8 py-8 max-w-2xl w-full mx-6">
    <div className="flex flex-col items-center gap-4">
     <div className="inline-flex items-center justify-center rounded-full bg-[#262624] p-3 shadow-sm">
      <BotIcon className="h-6 w-6 text-[#c2c0b6]" />
     </div>
     <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#c2c0b6]">Welcome to the AI Agent Chat</h2>
     <p className="text-center text-sm sm:text-base text-[#bfbda8] max-w-lg">
      Start a new conversation or select an existing chat from the sidebar. Your AI assistant is ready to help with any
      task.
     </p>

     <div className="mt-3 flex items-center gap-6 text-sm text-[#bfbda8]">
      <div className="flex items-center gap-2">
       <span className="h-2 w-2 rounded-full bg-[#d97757] inline-block" />
       <span className="text-[#c2b8b6]">Real-time responses</span>
      </div>
      <div className="flex items-center gap-2">
       <span className="h-2 w-2 rounded-full bg-[#bfbda8] inline-block opacity-60" />
       <span className="text-[#c2c0b6]">Smart assistance</span>
      </div>
      <div className="flex items-center gap-2">
       <span className="h-2 w-2 rounded-full bg-[#bfbda8] inline-block opacity-60" />
       <span className="text-[#c2c0b6]">Powerful tools</span>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}
