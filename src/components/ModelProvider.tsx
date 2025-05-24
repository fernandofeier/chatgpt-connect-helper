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
  
  // Buscar chave API do Gemini quando necessário
  useEffect(() => {
    if (!initialGeminiApiKey) {
      const fetchGeminiKey = async () => {
        try {
          const { data: settings, error } = await supabase
            .from("user_settings")
            .select("gemini_api_key")
            .maybeSingle();

          if (!error && settings) {
            setGeminiApiKey(settings.gemini_api_key || "dummy-key");
          } else {
            setGeminiApiKey("dummy-key");
          }
        } catch (error) {
          console.error("Error fetching Gemini API key:", error);
          setGeminiApiKey("dummy-key");
        }
      };

      fetchGeminiKey();
    } else {
      setGeminiApiKey(initialGeminiApiKey);
    }
  }, [initialGeminiApiKey]);
  
  // Definir modelo padrão quando os modelos carregarem
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
    
    // Verificar se mudou para Claude sem chave API do Claude
    if (modelSetting.provider === "claude" && !claudeApiKey) {
      toast({
        title: "Chave API Claude Não Encontrada",
        description: "Entre em contato com o administrador para configurar a chave API do Claude.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se mudou para Gemini sem chave API do Gemini
    if (modelSetting.provider === "gemini" && !geminiApiKey) {
      toast({
        title: "Chave API Gemini Não Encontrada",
        description: "Entre em contato com o administrador para configurar a chave API do Gemini.",
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
        return claudeApiKey || "dummy-key";
      case "gemini":
        return geminiApiKey || "dummy-key";
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
