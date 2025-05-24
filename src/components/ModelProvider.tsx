
import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { useToast } from "@/hooks/use-toast";
import { useModels } from "@/hooks/useModels";
import { supabase } from "@/integrations/supabase/client";

interface ModelProviderProps {
  openaiApiKey: string;
  claudeApiKey: string | null;
  geminiApiKey?: string | null;
}

export const ModelProvider = ({ openaiApiKey, claudeApiKey, geminiApiKey: initialGeminiApiKey }: ModelProviderProps) => {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(initialGeminiApiKey || null);
  const { toast } = useToast();
  const { models } = useModels();
  
  useEffect(() => {
    const fetchGeminiKey = async () => {
      if (initialGeminiApiKey && initialGeminiApiKey !== "dummy-key") {
        setGeminiApiKey(initialGeminiApiKey);
        return;
      }

      try {
        const { data: settings, error } = await supabase
          .from("user_settings")
          .select("gemini_api_key")
          .maybeSingle();

        if (!error && settings && settings.gemini_api_key) {
          setGeminiApiKey(settings.gemini_api_key);
        }
      } catch (dbError) {
        console.error("Error fetching Gemini API key:", dbError);
      }
    };

    fetchGeminiKey();
  }, [initialGeminiApiKey]);
  
  useEffect(() => {
    const enabledModels = models.filter(m => m.enabled);
    if (enabledModels.length > 0 && !selectedModel) {
      setSelectedModel(enabledModels[0].model_id);
    }
  }, [models, selectedModel]);
  
  const handleModelChange = (model: string) => {
    const modelSetting = models.find(m => m.model_id === model);
    
    if (!modelSetting) {
      toast({
        title: "Modelo Inválido",
        description: "O modelo selecionado não está disponível.",
        variant: "destructive",
      });
      return;
    }
    
    if (modelSetting.provider === "claude" && (!claudeApiKey || claudeApiKey === "dummy-key")) {
      toast({
        title: "Chave API Claude Não Encontrada",
        description: "Configure a chave API do Claude nas configurações.",
        variant: "destructive",
      });
      return;
    }
    
    if (modelSetting.provider === "gemini" && (!geminiApiKey || geminiApiKey === "dummy-key")) {
      toast({
        title: "Chave API Gemini Não Encontrada",
        description: "Configure a chave API do Gemini nas configurações.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedModel(model);
  };

  const getApiKeyForModel = (model: string) => {
    const modelSetting = models.find(m => m.model_id === model);
    if (!modelSetting) return openaiApiKey;
    
    switch (modelSetting.provider) {
      case "claude":
        return claudeApiKey && claudeApiKey !== "dummy-key" ? claudeApiKey : openaiApiKey;
      case "gemini":
        return geminiApiKey && geminiApiKey !== "dummy-key" ? geminiApiKey : openaiApiKey;
      default:
        return openaiApiKey;
    }
  };

  if (!selectedModel) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando modelos disponíveis...</div>
      </div>
    );
  }
  
  return (
    <ChatInterface 
      initialApiKey={getApiKeyForModel(selectedModel)}
      claudeApiKey={claudeApiKey}
      selectedModel={selectedModel}
      onModelChange={handleModelChange}
    />
  );
};
