import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      
      const { data: settings } = await supabase
        .from("user_settings")
        .select("openai_api_key")
        .single();
      
      if (settings?.openai_api_key) {
        setApiKey(settings.openai_api_key);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ openai_api_key: apiKey })
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your API key has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-[#3B3B3B] font-inter">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium text-[#3B3B3B]">
              OpenAI API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="font-inter"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter"
          >
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;