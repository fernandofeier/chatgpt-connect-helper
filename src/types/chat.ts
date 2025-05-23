
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

export interface ModelSetting {
  id: string;
  model_id: string;
  model_name: string;
  provider: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}
