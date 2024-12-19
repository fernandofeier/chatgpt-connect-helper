import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from 'react-router-dom';
import { MessageList } from "./chat/MessageList";
import { MessageInput } from "./chat/MessageInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  initialApiKey: string;
}

export function ChatInterface({ initialApiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const { id: existingConversationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!existingConversationId) {
      setMessages([]);
      setConversationId(null);
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
        setConversationId(existingConversationId);
      }
    };

    loadConversation();
  }, [existingConversationId, toast]);

  const createNewConversation = async (title: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("conversations")
      .insert([
        { user_id: user.id, title }
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar conversa",
        variant: "destructive",
      });
      return null;
    }

    navigate(`/chat/${data.id}`);
    return data.id;
  };

  const saveMessage = async (message: Message) => {
    if (!conversationId) return;

    const { error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
        }
      ]);

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar mensagem",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  };

  const handleSubmit = async (e: React.FormEvent, imageFile?: File) => {
    e.preventDefault();
    if (!input.trim() && !imageFile) return;

    let messageContent = input;
    if (imageFile) {
      messageContent = `[Imagem: ${imageFile.name}]\n${input}`;
    }

    const userMessage: Message = { role: "user", content: messageContent };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (!conversationId) {
      const newConversationId = await createNewConversation(messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : ""));
      if (!newConversationId) {
        setIsLoading(false);
        return;
      }
      setConversationId(newConversationId);
    }

    await saveMessage(userMessage);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initialApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na chamada da API");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar sua mensagem. Verifique sua chave API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-none border-0">
      <CardContent className="p-0">
        <MessageList messages={messages} isLoading={isLoading} />
        <div className="sticky bottom-0 bg-background pb-4">
          <MessageInput
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onFileUpload={handleFileUpload}
          />
        </div>
      </CardContent>
    </Card>
  );
}