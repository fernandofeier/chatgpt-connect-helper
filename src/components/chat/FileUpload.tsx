
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Image, X, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  selectedFile: File | null;
  onFileSelected: (file: File | null) => void;
}

export function FileUpload({ selectedFile, onFileSelected }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Clean up the object URL when component unmounts or file changes
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const handlePastedImage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.file) {
        handleFileChange(customEvent.detail.file);
      }
    };

    // Listen for the custom paste event from MessageInput
    document.addEventListener('image-pasted', handlePastedImage);
    
    return () => {
      document.removeEventListener('image-pasted', handlePastedImage);
    };
  }, []);

  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleFileChange = (file: File) => {
    const maxSizeMB = 8;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      toast({
        title: "Arquivo muito grande",
        description: `O tamanho máximo permitido é ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if file is an image
    if (file.type.startsWith('image/')) {
      onFileSelected(file);
    } else {
      toast({
        title: "Formato não suportado",
        description: "Por favor, selecione um arquivo de imagem",
        variant: "destructive",
      });
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleClearFile = () => {
    onFileSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleInputChange}
        accept="image/*"
        className="hidden"
      />
      
      {!selectedFile && (
        <Button 
          type="button" 
          variant="outline" 
          className="text-gray-500 border-dashed flex items-center gap-2 h-10"
          onClick={handleButtonClick}
        >
          <Paperclip className="h-4 w-4" />
          <span>Anexar arquivo</span>
        </Button>
      )}
      
      {selectedFile && (
        <div className="border rounded-md p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1 rounded">
              <Image className="h-4 w-4 text-gray-500" />
            </div>
            <span className="text-sm truncate max-w-[250px]">{selectedFile.name}</span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleClearFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {previewUrl && (
        <div className="mt-2 relative">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-h-[150px] object-contain rounded-md border" 
          />
        </div>
      )}
    </div>
  );
}
