import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, ArrowBigDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Sucesso",
      description: "Código copiado para a área de transferência",
    });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const isAtBottom = Math.abs(element.scrollHeight - scrollPosition) < 50;
    
    setShowScrollButton(!isAtBottom);
    
    if (!isAtBottom) {
      setUserScrolled(true);
    }
  };

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end'
      });
      setUserScrolled(false);
      setShowScrollButton(false);
    }
  };

  useEffect(() => {
    if (!userScrolled && lastMessageRef.current) {
      scrollToBottom();
    }
  }, [messages, userScrolled]);

  useEffect(() => {
    if (lastMessageRef.current) {
      const observer = new MutationObserver(() => {
        if (!userScrolled) {
          scrollToBottom();
        }
      });
      
      observer.observe(lastMessageRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });

      return () => observer.disconnect();
    }
  }, [messages.length, userScrolled]);

  const renderMessage = (message: Message, index: number) => {
    const processMessageContent = (content: string) => {
      const parts = content.split(/(```[\s\S]*?```)/g);
      return parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).replace(/^[a-z]+\n/, '');
          return (
            <div key={i} className="relative mt-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 z-10 bg-background"
                onClick={() => handleCopyCode(code)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <div className="mt-2 p-4 bg-gray-200 dark:bg-gray-700 rounded-md font-mono overflow-x-auto">
                <ReactMarkdown>{code}</ReactMarkdown>
              </div>
            </div>
          );
        }
        return <ReactMarkdown key={i}>{part}</ReactMarkdown>;
      });
    };

    const hasCodeBlock = message.content.includes("```");
    const isLastMessage = index === messages.length - 1;

    return (
      <div
        key={index}
        ref={isLastMessage ? lastMessageRef : null}
        className={`mb-4 p-3 rounded-lg ${
          message.role === "user"
            ? "bg-[#146EF5] text-white ml-auto max-w-[85%] md:max-w-[40%]"
            : `bg-gray-100 dark:bg-gray-800 text-foreground ${hasCodeBlock ? 'min-w-[60%] max-w-[85%] md:max-w-[80%]' : 'max-w-[85%] md:max-w-[40%]'}`
        } font-inter text-[14px] break-words`}
      >
        {processMessageContent(message.content)}
      </div>
    );
  };

  return (
    <div className="relative">
      <ScrollArea 
        className="h-[calc(100vh-200px)] mb-4 p-4 rounded-lg overflow-y-auto" 
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {messages.map((message, index) => renderMessage(message, index))}
        {isLoading && (
          <div className="flex items-center space-x-2 mb-4 max-w-[40%]">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg w-24 h-8 relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-24 right-8 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
          onClick={scrollToBottom}
        >
          <ArrowBigDown className="h-4 w-4 text-primary-foreground" />
        </Button>
      )}
    </div>
  );
}