
import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from 'react-router-dom';
import { MessageList } from "./chat/MessageList";
import { MessageInput } from "./chat/MessageInput";
import { useChat } from "@/hooks/useChat";
import { Message, MessagePayload } from "@/types/chat";
import { ModelSelector, AIModel } from "./chat/ModelSelector";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface ChatInterfaceProps {
  initialApiKey: string;
}

export function ChatInterface({ initialApiKey }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<AIModel>("gpt-4o-mini");
  const { id: existingConversationId } = useParams();
  const { toast } = useToast();
  const { messages, setMessages, isLoading, handleSubmit } = useChat(initialApiKey, model);

  useEffect(() => {
    if (!existingConversationId) {
      setMessages([]);
      return;
    }

    const loadConversation = async () => {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", existingConversationId)
        .order("created_at", { ascending: true });

      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao carregar mensagens",
          variant: "destructive",
        });
        return;
      }

      if (messagesData) {
        setMessages(messagesData as Message[]);
      }
    };

    loadConversation();
  }, [existingConversationId, setMessages, toast]);

  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload: RealtimePostgresChangesPayload<MessagePayload>) => {
          const newMessage = payload.new as MessagePayload | null;
          if (newMessage && newMessage.conversation_id === existingConversationId) {
            const fetchMessages = async () => {
              const { data: messagesData, error } = await supabase
                .from("messages")
                .select("role, content")
                .eq("conversation_id", existingConversationId)
                .order("created_at", { ascending: true });

              if (!error && messagesData) {
                setMessages(messagesData as Message[]);
              }
            };
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [existingConversationId, setMessages]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(input, existingConversationId);
    setInput("");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-none border-0">
      <CardContent className="p-0">
        <div className="mb-4 p-4">
          <ModelSelector model={model} onModelChange={setModel} />
        </div>
        <MessageList messages={messages} isLoading={isLoading} />
        <div className="sticky bottom-0 bg-background px-2 pb-2 md:px-4 md:pb-4">
          <MessageInput
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSubmit={onSubmit}
          />
        </div>
      </CardContent>
    </Card>
  );
}
