
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }
        
        const { data: settings, error } = await supabase
          .from("user_settings")
          .select("openai_api_key, claude_api_key")
          .single();
        
        if (error) {
          console.error("Error fetching settings:", error);
          
          // Check if the error is specifically about the claude_api_key column
          if (error.message && error.message.includes("claude_api_key")) {
            toast({
              title: "Database Update Required",
              description: "Please refresh the page to use the updated database schema.",
              variant: "destructive",
            });
          }
          
          return;
        }
        
        if (settings) {
          if (settings.openai_api_key) {
            setOpenaiApiKey(settings.openai_api_key);
          }
          if (settings.claude_api_key) {
            setClaudeApiKey(settings.claude_api_key);
          }
        }
      } catch (error) {
        console.error("Error in checkSession:", error);
      }
    };

    checkSession();
  }, [navigate, toast]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Check if the user already has settings
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", userId)
        .single();
      
      let error;
      
      if (existingSettings) {
        // Update existing settings
        ({ error } = await supabase
          .from("user_settings")
          .update({ 
            openai_api_key: openaiApiKey,
            claude_api_key: claudeApiKey 
          })
          .eq("user_id", userId));
      } else {
        // Insert new settings
        ({ error } = await supabase
          .from("user_settings")
          .insert({ 
            user_id: userId,
            openai_api_key: openaiApiKey,
            claude_api_key: claudeApiKey 
          }));
      }

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your API keys have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving settings:", error);
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
          <Tabs defaultValue="openai">
            <TabsList className="mb-4">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="claude">Claude</TabsTrigger>
            </TabsList>
            
            <TabsContent value="openai" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="openaiApiKey" className="text-sm font-medium text-[#3B3B3B]">
                  OpenAI API Key
                </label>
                <Input
                  id="openaiApiKey"
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="font-inter"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="claude" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="claudeApiKey" className="text-sm font-medium text-[#3B3B3B]">
                  Claude API Key
                </label>
                <Input
                  id="claudeApiKey"
                  type="password"
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="font-inter"
                />
              </div>
            </TabsContent>
          </Tabs>
          
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
