
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function MessageInput({ input, setInput, isLoading, onSubmit }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          
          // Get the image file from clipboard
          const file = items[i].getAsFile();
          
          if (file) {
            // Dispatch a custom event with the file data
            const pasteEvent = new CustomEvent('image-pasted', { 
              detail: { file },
              bubbles: true 
            });
            e.currentTarget.dispatchEvent(pasteEvent);
            
            toast({
              title: "Imagem colada",
              description: "Imagem da área de transferência adicionada",
            });
          }
          break;
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="Digite sua mensagem..."
        disabled={isLoading}
        className="min-h-[48px] max-h-[200px] resize-none rounded-xl font-inter p-3"
        style={{ overflow: 'hidden' }}
      />
      <Button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter rounded-xl h-12 w-12 p-0 flex items-center justify-center"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
