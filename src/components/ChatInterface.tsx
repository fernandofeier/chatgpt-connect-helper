import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const createConversation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("conversations")
        .insert([
          { user_id: user.id, title: "New Chat" }
        ])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
        return;
      }

      setConversationId(data.id);
    };

    createConversation();
  }, [toast]);

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
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await saveMessage(userMessage);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${initialApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Error in API call");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);

      // Update conversation title after first message
      if (messages.length === 0 && conversationId) {
        const title = input.slice(0, 50) + (input.length > 50 ? "..." : "");
        await supabase
          .from("conversations")
          .update({ title })
          .eq("id", conversationId);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your message. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-inter text-[#3B3B3B]">Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] mb-4 p-4 border rounded-lg">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-[#146EF5] text-white ml-auto max-w-[80%]"
                  : "bg-gray-100 text-[#3B3B3B] max-w-[80%]"
              } font-inter`}
            >
              {message.content}
            </div>
          ))}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="font-inter"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter"
          >
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}