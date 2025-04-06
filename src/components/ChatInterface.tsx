
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
import { ModelSelector, AIModel } from "@/components/chat/ModelSelector";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { Message } from "@/types/chat";
import { FileUpload } from "@/components/chat/FileUpload";

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
  const { id: conversationId } = useParams<{ id: string }>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
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
          }));
          setMessages(formattedMessages);
        }
      };

      fetchMessages();
    }
  }, [conversationId, setMessages]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile)) return;

    await handleSubmit(input, conversationId || null, selectedFile);
    setInput("");
    setSelectedFile(null);
  };

  const handleModelChange = (newModel: AIModel) => {
    setModel(newModel);
    if (onModelChange) {
      onModelChange(newModel);
    }
  };

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <ModelSelector model={model} onModelChange={handleModelChange} />
      </div>
      
      <MessageList 
        messages={messages} 
        isLoading={isLoading} 
      />

      <div className="mt-4 flex flex-col gap-2">
        <FileUpload 
          selectedFile={selectedFile} 
          onFileSelected={handleFileSelected} 
        />
        <MessageInput 
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleFormSubmit}
        />
      </div>
    </div>
  );
}
