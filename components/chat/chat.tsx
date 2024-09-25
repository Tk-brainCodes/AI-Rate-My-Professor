"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleMessage,
} from "@/components/chat-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { AnimatePresence, motion } from "framer-motion";
import {
  CopyIcon,
  CornerDownLeft,
  Mic,
  Paperclip,
  RefreshCcw,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

const ChatAiIcons = [
  {
    icon: CopyIcon,
    label: "Copy",
  },
  {
    icon: RefreshCcw,
    label: "Refresh",
  },
  {
    icon: Volume2,
    label: "Volume",
  },
];

export default function Chatbot() {
  const [isLoading, setisLoading] = useState(false);
  const [input, setInput] = useState<string>("");

  const [messages, setMessages] = useState<
    { role: string; content: string; avatar?: string; isLoading?: boolean }[]
  >([
    {
      role: "assistant",
      content:
        "Hi I'm the rate my professor support assistant, how can I help you today?",
    },
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const getMessageVariant = (role: string) =>
    role === "assistant" ? "received" : "sent";
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSendMessage(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = input.trim();

    if (message) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "user", content: message },
        {
          role: "assistant",
          content: "Loading...",
        },
      ]);
      setInput("");

      try {
        setisLoading(true);
        const response = await axios.post(
          "/api/chat",
          {
            data: [...messages, { role: "user", content: message }],
            urls: ["https://www.ratemyprofessors.com/school/2003"],
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            responseType: "text",
          }
        );

        // Update the assistant's message with the actual response
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, prevMessages.length - 1),
          {
            role: "assistant",
            content: response.data,
          },
        ]);
        setisLoading(false);
      } catch (error) {
        console.error("Error in fetching response:", error);
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, prevMessages.length - 1),
          {
            role: "assistant",
            content:
              "An error occurred while fetching the response. Please try again.",
          },
        ]);
      }
    }
  };

  return (
    <div className='h-full w-full'>
      <div className=' w-[70vw] bg-slate-100 dark:bg-[#27272a] h-[50vh] rounded-xl'>
        <ChatMessageList ref={chatContainerRef}>
          <AnimatePresence>
            {messages.map((message, index) => {
              const variant = getMessageVariant(message.role!);
              return (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
                  transition={{
                    opacity: { duration: 0.1 },
                    layout: {
                      type: "spring",
                      bounce: 0.3,
                      duration: index * 0.05 + 0.2,
                    },
                  }}
                  style={{ originX: 0.5, originY: 0.5 }}
                  className='flex flex-col gap-2 p-4'
                >
                  <ChatBubble key={index} variant={variant}>
                    <Avatar>
                      <AvatarImage
                        src={message.avatar || ""}
                        alt='Avatar'
                        className={
                          message.role === "assistant" ? "dark:invert" : ""
                        }
                      />
                      <AvatarFallback>
                        {message.role === "assistant" ? "🤖" : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChatBubbleMessage isLoading={message.isLoading}>
                      {message.content}
                      {message.role === "assistant" && !message.isLoading && (
                        <div className='flex items-center mt-1.5 gap-1'>
                          {ChatAiIcons.map((icon, index) => {
                            const Icon = icon.icon;
                            return (
                              <ChatBubbleAction
                                variant='outline'
                                className='size-6'
                                key={index}
                                icon={<Icon className='size-3' />}
                                onClick={() =>
                                  console.log(
                                    "Action " +
                                      icon.label +
                                      " clicked for message " +
                                      index
                                  )
                                }
                              />
                            );
                          })}
                        </div>
                      )}
                    </ChatBubbleMessage>
                  </ChatBubble>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ChatMessageList>
        <div className='flex-1 mb-[5em]' />
        <form
          ref={formRef}
          onSubmit={handleSendMessage}
          className='fixed bottom-0 z-4  w-[70vw] bg-white dark:bg-[#171717] rounded-lg mb-[20px] border bg-background focus-within:ring-1 focus-within:ring-ring'
        >
          <ChatInput
            ref={inputRef}
            value={input}
            onKeyDown={handleKeyDown}
            onChange={handleInputChange}
            placeholder='Type your message here...'
            className='min-h-12 resize-none rounded-lg bg-white dark:bg-[#171717] border-0 p-3 shadow-none focus-visible:ring-0'
          />
          <div className='flex items-center p-3 pt-0'>
            <Button variant='ghost' size='icon'>
              <Paperclip className='size-4' />
              <span className='sr-only'>Attach file</span>
            </Button>

            <Button variant='ghost' size='icon'>
              <Mic className='size-4' />
              <span className='sr-only'>Use Microphone</span>
            </Button>

            <Button
              disabled={!input || isLoading}
              type='submit'
              size='sm'
              className='ml-auto gap-1.5'
            >
              Send Message
              <CornerDownLeft className='size-3.5' />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
