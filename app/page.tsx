"use client";

import { Star } from "@/assets";
import { ModeToggle } from "@/components/theme";
import Chatbot from "@/components/chat/chat";
import LinkInput from "@/components/link-input";

import Image from "next/image";

export default function Dashboard() {
  return (
    <div className='flex flex-col'>
      <header className='sticky z-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500  top-0 flex h-[57px] items-center justify-between gap-1 bg-background px-4'>
        <h1 className='text-xl font-semibold flex items-center gap-4 px-2 py-2'>
          Rate my professor
          <Image
            src={Star}
            alt='star-logo'
            loading='lazy'
            width={300}
            height={300}
            className='w-[50px] h-[50px]'
          />
        </h1>
        <ModeToggle />
      </header>
      <div className=' flex flex-col items-center justify-center  md:gap-4 h-[calc(100vh-8rem)]'>
        <div className=' md:col-span-3'>
          <LinkInput />
          <Chatbot />
        </div>
      </div>
    </div>
  );
}
