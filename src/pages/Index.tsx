
import { useEffect, useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ModelProvider } from "@/components/ModelProvider";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [claudeApiKey, setClaudeApiKey] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const { data: settings, error } = await supabase
          .from("user_settings")
          .select("openai_api_key, claude_api_key")
          .single();

        if (error) {
          console.error("Error fetching API keys:", error);
          
          // Check if the error is specifically about the claude_api_key column
          if (error.message && error.message.includes("claude_api_key")) {
            toast({
              title: "Database Update Required",
              description: "Please refresh the page to use the updated database schema.",
              variant: "destructive",
            });
          }
          
          navigate("/settings");
          return;
        }

        if (!settings?.openai_api_key) {
          navigate("/settings");
        } else {
          setApiKey(settings.openai_api_key);
          setClaudeApiKey(settings.claude_api_key || null);
        }
      } catch (error) {
        console.error("Error in fetchApiKeys:", error);
        navigate("/settings");
      }
    };

    fetchApiKeys();
  }, [navigate, toast]);

  if (!apiKey) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <ModelProvider openaiApiKey={apiKey} claudeApiKey={claudeApiKey} />
    </div>
  );
};

export default Index;
