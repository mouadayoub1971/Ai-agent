'use client';
import { Button } from '@/components/ui/button';
import { NavigationContext } from '@/lib/NavigationProvider';
import { UserButton } from '@clerk/nextjs';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { use } from 'react';

export default function Header() {
 const { setIsMobileNavOpen, isMobileNavOpen } = use(NavigationContext);

 return (
  <header className=" border-b border-black bg-[#262624] backdrop-blur-xl sticky top-0 z-50">
   {/** */}
   <div className="flex items-center justify-between px-4 py-3">
    <div className=" flex items-center gap-3">
     <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsMobileNavOpen(true)}
      className="md:hidden text-[#faf9f5] hover:text-[#ffffff] hover:bg-[#2b2a29]/50"
     >
      <HamburgerMenuIcon className="h-5 w-5" />
     </Button>
     <div className="font-semibold text-[#faf9f5]">Chat with an AI Agent</div>
    </div>
    <div className="flex items-center">
     <UserButton
      afterSignOutUrl="/"
      appearance={{
       elements: {
        avatarBox:
         'h-8 w-8 rounded-full bg-black text-black ring-2 ring-[#262624] ring-offset-0 overflow-hidden transition-shadow hover:ring-[#262624]',
        avatarImage: 'h-8 w-8 rounded-full bg-black object-cover',
        avatarFallback: 'h-8 w-8 rounded-full bg-black text-black flex items-center justify-center',
       },
      }}
     />
    </div>
   </div>
  </header>
 );
}
