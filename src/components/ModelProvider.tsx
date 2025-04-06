
import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { AIModel } from "@/components/chat/ModelSelector";
import { useToast } from "@/hooks/use-toast";

interface ModelProviderProps {
  openaiApiKey: string;
  claudeApiKey: string | null;
}

export const ModelProvider = ({ openaiApiKey, claudeApiKey }: ModelProviderProps) => {
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt-4o");
  const { toast } = useToast();
  
  // Determine which API key to use based on the selected model
  const getApiKeyForModel = (): string => {
    const isClaudeModel = selectedModel.startsWith("claude");
    
    if (isClaudeModel) {
      if (!claudeApiKey) {
        toast({
          title: "Claude API Key Missing",
          description: "Please add a Claude API key in the settings.",
          variant: "destructive",
        });
        return openaiApiKey; // Fallback to OpenAI
      }
      return claudeApiKey;
    }
    
    return openaiApiKey;
  };
  
  const handleModelChange = (model: AIModel) => {
    // Check if switching to Claude without a Claude API key
    if (model.startsWith("claude") && !claudeApiKey) {
      toast({
        title: "Claude API Key Missing",
        description: "Please add a Claude API key in the settings to use Claude models.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedModel(model);
  };
  
  return (
    <ChatInterface 
      initialApiKey={getApiKeyForModel()} 
      selectedModel={selectedModel}
      onModelChange={handleModelChange}
    />
  );
};
