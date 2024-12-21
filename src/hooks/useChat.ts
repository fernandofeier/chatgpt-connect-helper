import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/chat";
import { OpenAIModel } from "@/components/chat/ModelSelector";

export function useChat(initialApiKey: string, model: OpenAIModel) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const createNewConversation = async (title: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Create a thread in OpenAI
    const threadResponse = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${initialApiKey}`,
      },
    });

    if (!threadResponse.ok) {
      toast({
        title: "Erro",
        description: "Falha ao criar thread na OpenAI",
        variant: "destructive",
      });
      return null;
    }

    const threadData = await threadResponse.json();
    const threadId = threadData.id;

    const { data, error } = await supabase
      .from("conversations")
      .insert([
        { user_id: user.id, title, thread_id: threadId }
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

  const saveMessage = async (message: Message, conversationId: string) => {
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

  const handleSubmit = async (input: string, conversationId: string | null, imageFile?: File) => {
    if (!input.trim() && !imageFile) return;

    let messageContent = input;
    if (imageFile) {
      messageContent = `[Imagem: ${imageFile.name}]\n${input}`;
    }

    const userMessage: Message = { role: "user", content: messageContent };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let currentConversationId = conversationId;
    let threadId: string | null = null;

    if (!currentConversationId) {
      currentConversationId = await createNewConversation(messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : ""));
      if (!currentConversationId) {
        setIsLoading(false);
        return;
      }
    } else {
      // Get thread_id for existing conversation
      const { data: conversationData } = await supabase
        .from("conversations")
        .select("thread_id")
        .eq("id", currentConversationId)
        .single();
      
      threadId = conversationData?.thread_id || null;
    }

    await saveMessage(userMessage, currentConversationId);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initialApiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [...messages, userMessage],
          stream: true,
          thread_id: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na chamada da API");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = { role: "assistant", content: "" };
      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                assistantMessage.content += content;
                setMessages(prev => 
                  prev.map((msg, i) => 
                    i === prev.length - 1 ? assistantMessage : msg
                  )
                );
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }
      }

      await saveMessage(assistantMessage, currentConversationId);
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

  return {
    messages,
    setMessages,
    isLoading,
    handleSubmit
  };
}