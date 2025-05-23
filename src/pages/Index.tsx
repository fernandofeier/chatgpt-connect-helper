
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ModelProvider } from "@/components/ModelProvider";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [claudeApiKey, setClaudeApiKey] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        // Usuários não-admin não precisam de chaves API
        if (!roleLoading && !isAdmin) {
          setApiKey("dummy-key"); // Chave fictícia para usuários normais
          setClaudeApiKey(null);
          return;
        }

        const { data: settings, error } = await supabase
          .from("user_settings")
          .select("openai_api_key, claude_api_key")
          .single();

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
          if (isAdmin) {
            navigate("/settings");
          } else {
            // Para usuários normais, usar chave fictícia
            setApiKey("dummy-key");
            setClaudeApiKey(null);
          }
          return;
        }

        if (isAdmin && !settings?.openai_api_key) {
          navigate("/settings");
        } else {
          setApiKey(settings?.openai_api_key || "dummy-key");
          setClaudeApiKey(settings?.claude_api_key || null);
        }
      } catch (error) {
        console.error("Error in fetchApiKeys:", error);
        if (isAdmin) {
          navigate("/settings");
        } else {
          setApiKey("dummy-key");
          setClaudeApiKey(null);
        }
      }
    };

    if (!roleLoading) {
      fetchApiKeys();
    }
  }, [navigate, toast, isAdmin, roleLoading]);

  if (roleLoading || !apiKey) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Carregando...</div>
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
