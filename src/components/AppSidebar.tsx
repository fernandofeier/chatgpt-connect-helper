import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export function AppSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { id: currentConversationId } = useParams();

  useEffect(() => {
    const fetchConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setConversations(data);
      }
    };

    fetchConversations();

    const channel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SidebarContent>
      <SidebarGroup>
        <Link to="/chat">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Nova conversa
          </Button>
        </Link>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Conversas recentes</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {conversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id}>
                <Link to={`/chat/${conversation.id}`} className="w-full">
                  <SidebarMenuButton
                    className={currentConversationId === conversation.id ? "bg-gray-100 dark:bg-gray-800" : ""}
                  >
                    {conversation.title}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}