
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message, ApiProvider } from "@/types/chat";
import { AIModel } from "@/components/chat/ModelSelector";

export function useChat(initialApiKey: string, model: AIModel) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Determine which API provider to use based on model name
  const isClaudeModel = (modelName: string) => modelName.startsWith('claude');

  const createNewConversation = async (title: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("conversations")
      .insert([
        { user_id: user.id, title, thread_id: null }
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

  const uploadImage = async (imageData: string, conversationId: string): Promise<string | null> => {
    try {
      // Extrair o tipo de arquivo e o base64
      const matches = imageData.match(/^data:(.+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error("Formato de dados da imagem inválido");
      }
      
      // Converter base64 para blob
      const base64 = matches[2];
      const contentType = matches[1];
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      
      // Gerar um nome único para o arquivo
      const timestamp = new Date().getTime();
      const filename = `${conversationId}/${timestamp}.jpg`;
      
      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat_images')
        .upload(filename, blob, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error("Erro ao fazer upload da imagem:", error);
        return null;
      }
      
      // Obter a URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(data.path);
        
      return publicUrl;
      
    } catch (error) {
      console.error("Erro ao processar a imagem:", error);
      return null;
    }
  };

  const saveMessage = async (message: Message, conversationId: string) => {
    const messageData: any = {
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
    };
    
    // Adicionar o URL da imagem se existir
    if (message.image) {
      messageData.image_url = message.image;
    }
    
    const { error } = await supabase
      .from("messages")
      .insert([messageData]);

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar mensagem",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (input: string, conversationId: string | null, imageData?: string) => {
    if (!input.trim() && !imageData) return;

    let messageContent = input;
    let imageUrl: string | null = null;
    
    setIsLoading(true);

    let currentConversationId = conversationId;

    if (!currentConversationId) {
      currentConversationId = await createNewConversation(messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : ""));
      if (!currentConversationId) {
        setIsLoading(false);
        return;
      }
    }
    
    // Processar upload de imagem se houver
    if (imageData && currentConversationId) {
      imageUrl = await uploadImage(imageData, currentConversationId);
      if (imageUrl) {
        messageContent = messageContent || "Imagem anexada";
      }
    }

    const userMessage: Message = { 
      role: "user", 
      content: messageContent,
      ...(imageUrl ? { image: imageUrl } : {})
    };
    
    setMessages((prev) => [...prev, userMessage]);

    await saveMessage(userMessage, currentConversationId);

    try {
      // Determine which API to use based on the selected model
      const usingClaudeAPI = isClaudeModel(model);
      
      let endpoint = usingClaudeAPI
        ? "https://api.anthropic.com/v1/messages"
        : "https://api.openai.com/v1/chat/completions";
      
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (usingClaudeAPI) {
        headers = {
          ...headers,
          "anthropic-version": "2023-06-01",
          "x-api-key": initialApiKey
        };
      } else {
        headers = {
          ...headers,
          "Authorization": `Bearer ${initialApiKey}`
        };
      }
      
      let requestBody: Record<string, any> = {};
      
      // Preparar mensagens, incluindo imagens se necessário
      const apiMessages = [...messages, userMessage].map(msg => {
        if (msg.image && !usingClaudeAPI) {
          // Formato específico para OpenAI com imagens
          return {
            role: msg.role,
            content: [
              { type: "text", text: msg.content },
              { type: "image_url", image_url: { url: msg.image } }
            ]
          };
        } else {
          // Formato padrão de texto
          return { 
            role: msg.role,
            content: msg.content
          };
        }
      });
      
      if (usingClaudeAPI) {
        // Format request body for Claude API
        requestBody = {
          model: model,
          messages: apiMessages,
          stream: true,
          max_tokens: 4096
        };
      } else {
        // Format request body for OpenAI API
        requestBody = {
          model: model,
          messages: apiMessages,
          stream: true,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(usingClaudeAPI ? "Erro na chamada da API Claude" : "Erro na chamada da API OpenAI");
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
                
                // Handle different formats for OpenAI vs Claude
                let content = '';
                if (usingClaudeAPI) {
                  // Claude stream format
                  if (data.type === 'content_block_delta' && data.delta?.text) {
                    content = data.delta.text;
                  }
                } else {
                  // OpenAI stream format
                  content = data.choices[0]?.delta?.content || '';
                }
                
                if (content) {
                  assistantMessage.content += content;
                  setMessages(prev => 
                    prev.map((msg, i) => 
                      i === prev.length - 1 ? assistantMessage : msg
                    )
                  );
                }
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
