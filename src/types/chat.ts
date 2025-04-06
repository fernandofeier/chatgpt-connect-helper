
export interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export interface MessagePayload {
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  image_url?: string | null;
}

export type ApiProvider = "openai" | "claude";
