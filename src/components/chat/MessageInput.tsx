import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent, imageFile?: File) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MessageInput({ input, setInput, isLoading, onSubmit, onFileUpload }: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<{ file: File; url: string } | null>(null);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const url = URL.createObjectURL(file);
          setPreviewImage({ file, url });
        }
        break;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewImage) {
      onSubmit(e, previewImage.file);
      setPreviewImage(null);
    } else {
      onSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage({ file, url });
    }
    onFileUpload(e);
  };

  const removePreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage.url);
      setPreviewImage(null);
    }
  };

  return (
    <div className="space-y-4">
      {previewImage && (
        <div className="relative inline-block">
          <img 
            src={previewImage.url} 
            alt="Preview" 
            className="w-[92px] h-[92px] object-cover rounded-lg"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 bg-gray-800/50 hover:bg-gray-800/70"
            onClick={removePreview}
          >
            <X className="h-4 w-4 text-white" />
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          placeholder={previewImage ? "Adicione uma descrição para a imagem..." : "Digite sua mensagem..."}
          disabled={isLoading}
          className="min-h-[72px] resize-none font-inter"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter"
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}