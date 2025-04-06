
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Image as ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImagePreview } from "./ImagePreview";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  pastedImage?: File | null;
  setPastedImage?: (image: File | null) => void;
  previewImage?: string | null;
}

export function MessageInput({ 
  input, 
  setInput, 
  isLoading, 
  onSubmit,
  pastedImage,
  setPastedImage,
  previewImage
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (input.trim() || pastedImage) {
      onSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (setPastedImage && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        setPastedImage(file);
        e.preventDefault(); // Prevent pasting the image as text
      }
    }
  };

  const handleRemoveImage = () => {
    if (setPastedImage) {
      setPastedImage(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {previewImage && setPastedImage && (
        <ImagePreview imageURL={previewImage} onRemove={handleRemoveImage} />
      )}
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Digite sua mensagem... Você também pode colar imagens diretamente"
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
      </div>
    </form>
  );
}
