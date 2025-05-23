
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { ModelManagement } from "@/components/admin/ModelManagement";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userRole, isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }
        
        // Apenas administradores podem acessar as configurações
        if (!roleLoading && !isAdmin) {
          toast({
            title: "Acesso Negado",
            description: "Apenas administradores podem acessar as configurações.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        const { data: settings, error } = await supabase
          .from("user_settings")
          .select("openai_api_key, claude_api_key")
          .single();
        
        if (error) {
          console.error("Error fetching settings:", error);
          
          if (error.message && error.message.includes("claude_api_key")) {
            toast({
              title: "Atualização de Banco Necessária",
              description: "Por favor, atualize a página para usar o esquema atualizado do banco.",
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

    if (!roleLoading) {
      checkSession();
    }
  }, [navigate, toast, isAdmin, roleLoading]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado");
      }
      
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", userId)
        .single();
      
      let error;
      
      if (existingSettings) {
        ({ error } = await supabase
          .from("user_settings")
          .update({ 
            openai_api_key: openaiApiKey,
            claude_api_key: claudeApiKey 
          })
          .eq("user_id", userId));
      } else {
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
        title: "Configurações salvas",
        description: "Suas chaves API foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Verificando permissões...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#3B3B3B]">Configurações de Administrador</h1>
        <Badge variant="default">Administrador</Badge>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="api-keys">Chaves API</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <ModelManagement />
        </TabsContent>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#3B3B3B] font-inter">Chaves API</CardTitle>
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
                      Chave API OpenAI
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
                      Chave API Claude
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
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
