export interface Message {
  role: "user" | "assistant";
  content: string;
  conversation_id?: string;
}

export interface MessagePayload {
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}