import { useEffect, useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApiKey = async () => {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("openai_api_key")
        .single();

      if (!settings?.openai_api_key) {
        navigate("/settings");
      } else {
        setApiKey(settings.openai_api_key);
      }
    };

    fetchApiKey();
  }, [navigate]);

  if (!apiKey) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <ChatInterface initialApiKey={apiKey} />
    </div>
  );
};

export default Index;