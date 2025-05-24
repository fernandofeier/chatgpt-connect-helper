
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useModels } from "@/hooks/useModels";
import { ModelSetting } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function ModelManagement() {
  const { models, loading, updateModelStatus, refetch } = useModels();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newModel, setNewModel] = useState({
    model_id: "",
    model_name: "",
    provider: "openai"
  });
  const [addingModel, setAddingModel] = useState(false);

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelSetting[]>);

  const handleAddModel = async () => {
    if (!newModel.model_id || !newModel.model_name) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setAddingModel(true);
    try {
      const { error } = await supabase
        .from("model_settings")
        .insert({
          model_id: newModel.model_id,
          model_name: newModel.model_name,
          provider: newModel.provider,
          enabled: true
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Modelo adicionado com sucesso",
      });

      setNewModel({ model_id: "", model_name: "", provider: "openai" });
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error adding model:", error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar modelo",
        variant: "destructive",
      });
    } finally {
      setAddingModel(false);
    }
  };

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
        <div className="flex items-center justify-between">
          <CardTitle>Gerenciamento de Modelos</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Modelo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Modelo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model_name">Nome do Modelo</Label>
                  <Input
                    id="model_name"
                    value={newModel.model_name}
                    onChange={(e) => setNewModel({ ...newModel, model_name: e.target.value })}
                    placeholder="Ex: Gemini 2.5 Flash Preview"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_id">ID do Modelo (Chave API)</Label>
                  <Input
                    id="model_id"
                    value={newModel.model_id}
                    onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })}
                    placeholder="Ex: gemini-2.5-flash-preview"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provedor</Label>
                  <Select
                    value={newModel.provider}
                    onValueChange={(value) => setNewModel({ ...newModel, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="claude">Claude</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={addingModel}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddModel}
                    disabled={addingModel}
                    className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white"
                  >
                    {addingModel ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
