
import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { useToast } from "@/hooks/use-toast";
import { useModels } from "@/hooks/useModels";

interface ModelProviderProps {
  openaiApiKey: string;
  claudeApiKey: string | null;
}

export const ModelProvider = ({ openaiApiKey, claudeApiKey }: ModelProviderProps) => {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const { toast } = useToast();
  const { models } = useModels();
  
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
    
    setSelectedModel(model);
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
      initialApiKey={openaiApiKey}
      claudeApiKey={claudeApiKey}
      selectedModel={selectedModel}
      onModelChange={handleModelChange}
    />
  );
};
