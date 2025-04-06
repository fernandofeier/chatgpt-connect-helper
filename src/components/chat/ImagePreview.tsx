
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  imageURL: string;
  onRemove: () => void;
}

export function ImagePreview({ imageURL, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative w-24 h-24 mb-2">
      <img 
        src={imageURL} 
        alt="Pasted image" 
        className="w-full h-full object-cover rounded-md border border-gray-300"
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
