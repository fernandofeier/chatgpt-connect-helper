import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Paperclip, Copy } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router-dom';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { id: existingConversationId } = useParams();

  useEffect(() => {
    const initializeConversation = async () => {
      if (existingConversationId) {
        setConversationId(existingConversationId);
        const { data: messagesData, error } = await supabase
          .from("messages")
          .select("*")
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

        setMessages(messagesData || []);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("conversations")
          .insert([
            { user_id: user.id, title: "Nova Conversa" }
          ])
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro",
            description: "Falha ao criar conversa",
            variant: "destructive",
          });
          return;
        }

        setConversationId(data.id);
      }
    };

    initializeConversation();
  }, [existingConversationId, toast]);

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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Sucesso",
      description: "Código copiado para a área de transferência",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Here you would implement file upload logic
    // For now, we'll just add the file name to the input
    setInput(prev => `${prev} [Arquivo: ${file.name}]`);
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
        title: "Erro",
        description: "Falha ao processar sua mensagem. Verifique sua chave API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isCodeBlock = message.content.includes("```");
    
    return (
      <div
        key={index}
        className={`mb-4 p-3 rounded-lg ${
          message.role === "user"
            ? "bg-[#146EF5] text-white ml-auto max-w-[80%]"
            : "bg-gray-100 text-[#3B3B3B] max-w-[80%]"
        } font-inter text-[14px]`}
      >
        {isCodeBlock ? (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => handleCopyCode(message.content)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <ReactMarkdown
              className="mt-6 p-4 bg-gray-200 rounded-md font-mono"
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-none">
      <CardContent>
        <ScrollArea className="h-[600px] mb-4 p-4 rounded-lg">
          {messages.map((message, index) => renderMessage(message, index))}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="font-inter"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-inter"
          >
            Enviar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}