import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const { toast } = useToast();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Sucesso",
      description: "Código copiado para a área de transferência",
    });
  };

  const renderMessage = (message: Message, index: number) => {
    const isCodeBlock = message.content.includes("```");
    
    return (
      <div
        key={index}
        className={`mb-4 p-3 rounded-lg ${
          message.role === "user"
            ? "bg-[#146EF5] text-white ml-auto max-w-[80%]"
            : "bg-gray-100 dark:bg-gray-800 text-[#3B3B3B] dark:text-gray-200 max-w-[80%]"
        } font-inter text-[14px]`}
      >
        {isCodeBlock ? (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => handleCopyCode(message.content)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <ReactMarkdown
              className="mt-6 p-4 bg-gray-200 dark:bg-gray-700 rounded-md font-mono"
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="h-[500px] mb-4 p-4 rounded-lg">
      {messages.map((message, index) => renderMessage(message, index))}
    </ScrollArea>
  );
}