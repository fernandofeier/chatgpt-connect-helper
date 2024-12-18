import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { useRef } from "react";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MessageInput({ input, setInput, isLoading, onSubmit, onFileUpload }: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={onFileUpload}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Digite sua mensagem..."
        disabled={isLoading}
        className="font-inter"
      />
      <Button
        type="submit"
        disabled={isLoading}
        className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter"
      >
        Enviar
      </Button>
    </form>
  );
}