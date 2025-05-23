
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModels } from "@/hooks/useModels";

export type AIModel = string;

interface ModelSelectorProps {
  model: AIModel;
  onModelChange: (model: AIModel) => void;
}

export function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  const { models } = useModels();
  const [enabledModels, setEnabledModels] = useState<typeof models>([]);

  useEffect(() => {
    const enabled = models.filter(m => m.enabled);
    setEnabledModels(enabled);
    
    // Se o modelo atual não está mais habilitado, seleciona o primeiro disponível
    if (enabled.length > 0 && !enabled.find(m => m.model_id === model)) {
      onModelChange(enabled[0].model_id);
    }
  }, [models, model, onModelChange]);

  const groupedModels = enabledModels.reduce((acc, modelItem) => {
    if (!acc[modelItem.provider]) {
      acc[modelItem.provider] = [];
    }
    acc[modelItem.provider].push(modelItem);
    return acc;
  }, {} as Record<string, typeof enabledModels>);

  if (enabledModels.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Nenhum modelo disponível
      </div>
    );
  }

  return (
    <Select value={model} onValueChange={onModelChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecione um modelo" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedModels).map(([provider, providerModels]) => (
          <div key={provider}>
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
              {provider}
            </div>
            {providerModels.map((modelItem) => (
              <SelectItem key={modelItem.model_id} value={modelItem.model_id}>
                {modelItem.model_name}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
