
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { ModelSelector, AIModel } from "@/components/chat/ModelSelector";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";

interface ChatInterfaceProps {
  initialApiKey: string;
  claudeApiKey?: string | null;
  selectedModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
}

export function ChatInterface({ 
  initialApiKey, 
  claudeApiKey,
  selectedModel = "gpt-4o", 
  onModelChange 
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<AIModel>(selectedModel);
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { id: conversationId } = useParams<{ id: string }>();
  
  // Use the appropriate API key based on selected model
  const apiKeyToUse = model.startsWith("claude") && claudeApiKey ? claudeApiKey : initialApiKey;
  
  const { messages, setMessages, isLoading, handleSubmit } = useChat(apiKeyToUse, model);

  useEffect(() => {
    if (conversationId) {
      const fetchMessages = async () => {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (data) {
          const formattedMessages: Message[] = data.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
            image_url: msg.image_url,
          }));
          setMessages(formattedMessages);
        }
      };

      fetchMessages();
    }
  }, [conversationId, setMessages]);

  // Create image preview when an image is pasted
  useEffect(() => {
    if (pastedImage) {
      const imageUrl = URL.createObjectURL(pastedImage);
      setPreviewImage(imageUrl);
      return () => {
        URL.revokeObjectURL(imageUrl);
      };
    } else {
      setPreviewImage(null);
    }
  }, [pastedImage]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !pastedImage) return;

    await handleSubmit(input, conversationId || null, pastedImage);
    setInput("");
    setPastedImage(null);
  };

  const handleModelChange = (newModel: AIModel) => {
    setModel(newModel);
    if (onModelChange) {
      onModelChange(newModel);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <ModelSelector model={model} onModelChange={handleModelChange} />
      </div>
      
      <div className="flex-1 overflow-hidden mb-4">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      <MessageInput 
        input={input} 
        setInput={setInput} 
        isLoading={isLoading} 
        onSubmit={handleFormSubmit}
        pastedImage={pastedImage}
        setPastedImage={setPastedImage}
        previewImage={previewImage}
      />
    </div>
  );
}
