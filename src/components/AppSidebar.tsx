import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Settings, MessageSquare, Plus, LogOut, Trash2, Home } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export function AppSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: currentConversationId } = useParams();
  const location = useLocation();
  const showHomeButton = conversations.length === 0 && location.pathname !== "/";

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar conversas",
        variant: "destructive",
      });
      return;
    }

    setConversations(data || []);
  };

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleNewChat = () => {
    navigate("/");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleDeleteConversation = async (id: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao deletar conversa",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Conversa deletada com sucesso",
    });

    if (id === currentConversationId) {
      navigate("/");
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Button
          onClick={handleNewChat}
          className="w-full bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter"
        >
          <Plus className="mr-2" size={16} />
          Nova Conversa
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground">Conversas Recentes</SidebarGroupLabel>
          <SidebarGroupContent>
            {showHomeButton && (
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/")} className="w-full">
                  <Home size={16} />
                  <span className="text-foreground">Início</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenu>
              {conversations.map((conversation) => (
                <SidebarMenuItem key={conversation.id}>
                  <div className="flex items-center w-full group">
                    <SidebarMenuButton
                      asChild
                      className={`flex-1 ${
                        currentConversationId === conversation.id 
                          ? 'bg-gray-100 dark:bg-gray-800' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Link to={`/chat/${conversation.id}`}>
                        <MessageSquare size={16} />
                        <span className="text-foreground">
                          {conversation.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar Conversa</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteConversation(conversation.id)}
                          >
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings">
                <Settings size={16} />
                <span className="text-foreground">Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut size={16} />
              <span className="text-foreground">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}