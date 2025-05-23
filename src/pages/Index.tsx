
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ModelProvider } from "@/components/ModelProvider";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [claudeApiKey, setClaudeApiKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    let mounted = true;

    const fetchApiKeys = async () => {
      try {
        // Aguardar o carregamento do role
        if (roleLoading) return;

        // Usuários não-admin não precisam de chaves API
        if (!isAdmin) {
          if (mounted) {
            setApiKey("dummy-key"); // Chave fictícia para usuários normais
            setClaudeApiKey(null);
            setLoadingKeys(false);
          }
          return;
        }

        const { data: settings, error } = await supabase
          .from("user_settings")
          .select("openai_api_key, claude_api_key")
          .maybeSingle();

        if (mounted) {
          if (error) {
            console.error("Error fetching API keys:", error);
            
            if (error.message && error.message.includes("claude_api_key")) {
              toast({
                title: "Atualização de Banco Necessária",
                description: "Por favor, atualize a página para usar o esquema atualizado do banco.",
                variant: "destructive",
              });
            }
            
            // Se é admin e não tem configurações, redireciona para configurações
            navigate("/settings");
            return;
          }

          if (!settings?.openai_api_key) {
            navigate("/settings");
          } else {
            setApiKey(settings.openai_api_key || "dummy-key");
            setClaudeApiKey(settings.claude_api_key || null);
          }
          setLoadingKeys(false);
        }
      } catch (error) {
        console.error("Error in fetchApiKeys:", error);
        if (mounted) {
          if (isAdmin) {
            navigate("/settings");
          } else {
            setApiKey("dummy-key");
            setClaudeApiKey(null);
          }
          setLoadingKeys(false);
        }
      }
    };

    fetchApiKeys();

    return () => {
      mounted = false;
    };
  }, [navigate, toast, isAdmin, roleLoading]);

  if (roleLoading || loadingKeys) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Configurando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ModelProvider openaiApiKey={apiKey} claudeApiKey={claudeApiKey} />
    </div>
  );
};

export default Index;
