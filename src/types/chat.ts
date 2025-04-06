
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface MessagePayload {
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export type ApiProvider = "openai" | "claude";
