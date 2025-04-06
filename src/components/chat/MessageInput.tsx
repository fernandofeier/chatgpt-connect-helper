
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Image } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImagePreview } from "./ImagePreview";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent, imageData?: string) => void;
  onPasteImage?: (imageData: string) => void;
}

export function MessageInput({ 
  input, 
  setInput, 
  isLoading, 
  onSubmit,
  onPasteImage
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pastedImage, setPastedImage] = useState<string | null>(null);

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

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              const imageData = event.target.result as string;
              setPastedImage(imageData);
              if (onPasteImage) {
                onPasteImage(imageData);
              }
            }
          };
          reader.readAsDataURL(blob);
          
          // Evitar que a imagem seja inserida como texto no textarea
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || pastedImage) {
      onSubmit(e, pastedImage || undefined);
      setPastedImage(null);
    }
  };

  const removeImage = () => {
    setPastedImage(null);
  };

  return (
    <div className="flex flex-col">
      {pastedImage && (
        <div className="mb-2">
          <ImagePreview imageData={pastedImage} onRemove={removeImage} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Digite sua mensagem ou cole uma imagem..."
          disabled={isLoading}
          className="min-h-[48px] max-h-[200px] resize-none rounded-xl font-inter p-3"
          style={{ overflow: 'hidden' }}
        />
        <Button
          type="submit"
          disabled={isLoading || (!input.trim() && !pastedImage)}
          className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter rounded-xl h-12 w-12 p-0 flex items-center justify-center"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
