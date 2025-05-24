
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ModelProvider } from "@/components/ModelProvider";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [claudeApiKey, setClaudeApiKey] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    let mounted = true;

    const fetchApiKeys = async () => {
      try {
        if (roleLoading) return;

        if (!isAdmin) {
          if (mounted) {
            setApiKey("dummy-key");
            setClaudeApiKey("dummy-key");
            setGeminiApiKey("dummy-key");
            setLoadingKeys(false);
          }
          return;
        }

        // Tentar buscar as chaves - se a coluna gemini_api_key não existir, vai dar erro
        try {
          const { data: settings, error } = await supabase
            .from("user_settings")
            .select("openai_api_key, claude_api_key, gemini_api_key")
            .maybeSingle();

          if (mounted) {
            if (error) {
              console.error("Error fetching API keys:", error);
              setApiKey("dummy-key");
              setClaudeApiKey("dummy-key");
              setGeminiApiKey("dummy-key");
            } else if (settings) {
              setApiKey(settings.openai_api_key || "dummy-key");
              setClaudeApiKey(settings.claude_api_key || "dummy-key");
              setGeminiApiKey(settings.gemini_api_key || "dummy-key");
            } else {
              setApiKey("dummy-key");
              setClaudeApiKey("dummy-key");
              setGeminiApiKey("dummy-key");
              
              toast({
                title: "Configuração Necessária",
                description: "Configure suas chaves API nas configurações para usar todos os recursos.",
              });
            }
            setLoadingKeys(false);
          }
        } catch (dbError) {
          // Se houver erro ao acessar a coluna gemini_api_key, buscar apenas as colunas existentes
          console.error("Database error, trying fallback:", dbError);
          const { data: settings, error } = await supabase
            .from("user_settings")
            .select("openai_api_key, claude_api_key")
            .maybeSingle();

          if (mounted) {
            if (error) {
              console.error("Error fetching API keys:", error);
              setApiKey("dummy-key");
              setClaudeApiKey("dummy-key");
              setGeminiApiKey("dummy-key");
            } else if (settings) {
              setApiKey(settings.openai_api_key || "dummy-key");
              setClaudeApiKey(settings.claude_api_key || "dummy-key");
              setGeminiApiKey("dummy-key");
            } else {
              setApiKey("dummy-key");
              setClaudeApiKey("dummy-key");
              setGeminiApiKey("dummy-key");
            }
            setLoadingKeys(false);
          }
        }
      } catch (error) {
        console.error("Error in fetchApiKeys:", error);
        if (mounted) {
          setApiKey("dummy-key");
          setClaudeApiKey("dummy-key");
          setGeminiApiKey("dummy-key");
          setLoadingKeys(false);
        }
      }
    };

    fetchApiKeys();

    return () => {
      mounted = false;
    };
  }, [toast, isAdmin, roleLoading]);

  if (roleLoading || loadingKeys) {
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
      <ModelProvider 
        openaiApiKey={apiKey} 
        claudeApiKey={claudeApiKey} 
        geminiApiKey={geminiApiKey}
      />
    </div>
  );
};

export default Index;
