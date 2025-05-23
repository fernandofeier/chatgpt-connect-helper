
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useModels } from "@/hooks/useModels";
import { ModelSetting } from "@/types/chat";

export function ModelManagement() {
  const { models, loading, updateModelStatus } = useModels();

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelSetting[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Modelos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Carregando modelos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Modelos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedModels).map(([provider, providerModels]) => (
          <div key={provider} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold capitalize">{provider}</h3>
              <Badge variant="secondary">{providerModels.length} modelos</Badge>
            </div>
            <div className="space-y-2">
              {providerModels.map((model) => (
                <div
                  key={model.model_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{model.model_name}</div>
                    <div className="text-sm text-gray-500">{model.model_id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={model.enabled ? "default" : "secondary"}>
                      {model.enabled ? "Habilitado" : "Desabilitado"}
                    </Badge>
                    <Switch
                      checked={model.enabled}
                      onCheckedChange={(enabled) => 
                        updateModelStatus(model.model_id, enabled)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
