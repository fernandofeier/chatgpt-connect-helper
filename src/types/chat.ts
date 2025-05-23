
export interface Message {
  role: "user" | "assistant";
  content: string;
  image_url?: string;
}

export interface MessagePayload {
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  image_url?: string;
}

export type ApiProvider = "openai" | "claude";
