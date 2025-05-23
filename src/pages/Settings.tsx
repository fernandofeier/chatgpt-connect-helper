
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
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userRole, isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const checkSessionAndLoadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        // Carregar email do usuário
        if (session.user?.email) {
          setEmail(session.user.email);
        }
        
        // Se for admin, carregar as chaves API
        if (isAdmin) {
          const { data: settings, error } = await supabase
            .from("user_settings")
            .select("openai_api_key, claude_api_key")
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching settings:", error);
          } else if (settings) {
            if (settings.openai_api_key) {
              setOpenaiApiKey(settings.openai_api_key);
            }
            if (settings.claude_api_key) {
              setClaudeApiKey(settings.claude_api_key);
            }
          }
        }
      } catch (error) {
        console.error("Error in checkSessionAndLoadData:", error);
      }
    };

    if (!roleLoading) {
      checkSessionAndLoadData();
    }
  }, [navigate, isAdmin, roleLoading]);

  const handleSaveApiKeys = async () => {
    if (!isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Apenas administradores podem alterar as chaves API.",
        variant: "destructive",
      });
      return;
    }

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
        .maybeSingle();
      
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao alterar senha. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error changing password:", error);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#3B3B3B]">Configurações</h1>
        <Badge variant={isAdmin ? "default" : "secondary"}>
          {isAdmin ? "Administrador" : "Usuário"}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="models">Modelos</TabsTrigger>}
          {isAdmin && <TabsTrigger value="api-keys">Chaves API</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#3B3B3B] font-inter">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[#3B3B3B]">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="font-inter bg-gray-50"
                />
                <p className="text-xs text-gray-500">O email não pode ser alterado</p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium text-[#3B3B3B]">Alterar Senha</h3>
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-[#3B3B3B]">
                    Nova Senha
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="font-inter"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-[#3B3B3B]">
                    Confirmar Nova Senha
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    className="font-inter"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                  className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter"
                >
                  {passwordLoading ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="models">
            <ModelManagement />
          </TabsContent>
        )}

        {isAdmin && (
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
                  onClick={handleSaveApiKeys}
                  disabled={loading}
                  className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter"
                >
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
