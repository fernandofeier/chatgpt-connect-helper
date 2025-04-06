
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  imageData: string;
  onRemove: () => void;
}

export function ImagePreview({ imageData, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative w-24 h-24 mb-2">
      <img 
        src={imageData} 
        alt="Imagem anexada" 
        className="w-full h-full object-cover rounded-md" 
      />
      <Button 
        variant="destructive" 
        size="icon" 
        className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-1"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
