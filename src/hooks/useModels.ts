
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ModelSetting } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";

export function useModels() {
  const [models, setModels] = useState<ModelSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("model_settings")
        .select("*")
        .order("provider", { ascending: true });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error("Error fetching models:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar modelos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateModelStatus = async (modelId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("model_settings")
        .update({ enabled })
        .eq("model_id", modelId);

      if (error) throw error;

      setModels(prev => 
        prev.map(model => 
          model.model_id === modelId 
            ? { ...model, enabled }
            : model
        )
      );

      toast({
        title: "Sucesso",
        description: `Modelo ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`,
      });
    } catch (error) {
      console.error("Error updating model:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar modelo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchModels();

    // Listen for real-time updates
    const subscription = supabase
      .channel('model_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'model_settings' },
        () => fetchModels()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    models,
    loading,
    updateModelStatus,
    refetch: fetchModels
  };
}
