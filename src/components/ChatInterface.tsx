
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/useChat";
import { Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { ModelSelector, AIModel } from "@/components/chat/ModelSelector";

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
            image_url: msg.image_url || undefined,
          }));
          setMessages(formattedMessages);
        }
      };

      fetchMessages();
    }
  }, [conversationId, setMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await handleSubmit(input, conversationId || null);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e as unknown as React.FormEvent);
    }
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
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 rounded-lg border">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100 ml-12"
                  : "bg-gray-100 mr-12"
              }`}
            >
              <div className="font-semibold mb-1">
                {message.role === "user" ? "You" : "AI"}
              </div>
              {message.image_url && (
                <div className="mb-2">
                  <img 
                    src={message.image_url} 
                    alt="Uploaded content" 
                    className="max-w-xs rounded-lg"
                  />
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="p-4 rounded-lg bg-gray-100 mr-12">
            <div className="font-semibold mb-1">AI</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 resize-none"
          rows={3}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
