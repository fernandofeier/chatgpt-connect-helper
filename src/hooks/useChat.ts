
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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro",
        description: "Falha ao fazer upload da imagem",
        variant: "destructive",
      });
      return null;
    }
  };

  const saveMessage = async (message: Message, conversationId: string, imageUrl?: string | null) => {
    const { error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          image_url: imageUrl || null
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

  const handleSubmit = async (input: string, conversationId: string | null, imageFile?: File | null) => {
    if (!input.trim() && !imageFile) return;

    setIsLoading(true);
    let imageUrl: string | null = null;
    
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    let messageContent = input;
    if (imageUrl) {
      messageContent = input.trim() ? input : "Analise esta imagem:";
    }

    const userMessage: Message = { 
      role: "user", 
      content: messageContent,
      imageUrl: imageUrl || undefined
    };
    
    setMessages((prev) => [...prev, userMessage]);

    let currentConversationId = conversationId;

    if (!currentConversationId) {
      currentConversationId = await createNewConversation(messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : ""));
      if (!currentConversationId) {
        setIsLoading(false);
        return;
      }
    }

    await saveMessage(userMessage, currentConversationId, imageUrl);

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
      
      if (usingClaudeAPI) {
        // Format request body for Claude API
        requestBody = {
          model: model,
          messages: [...messages, userMessage].map(msg => {
            // Claude doesn't support images yet in this implementation
            return {
              role: msg.role,
              content: msg.content
            };
          }),
          stream: true,
          max_tokens: 4096
        };
      } else {
        // Format request body for OpenAI API
        const formattedMessages = [...messages, userMessage].map(msg => {
          if (msg.imageUrl && msg.role === "user") {
            // For OpenAI with image
            return {
              role: msg.role,
              content: [
                { type: "text", text: msg.content },
                { 
                  type: "image_url", 
                  image_url: {
                    url: msg.imageUrl
                  }
                }
              ]
            };
          } else {
            // Regular message
            return { 
              role: msg.role,
              content: msg.content
            };
          }
        });
        
        requestBody = {
          model: model,
          messages: formattedMessages,
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
