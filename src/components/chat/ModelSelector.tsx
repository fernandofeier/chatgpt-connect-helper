
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AIModel = 
  // OpenAI models
  | "gpt-3.5-turbo" 
  | "gpt-4o" 
  | "gpt-4o-mini" 
  | "gpt-4" 
  | "gpt-o1-mini"
  // Claude models 
  | "claude-3-5-sonnet-20240620" 
  | "claude-3-sonnet-20240229";

interface ModelSelectorProps {
  model: AIModel;
  onModelChange: (model: AIModel) => void;
}

export function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  return (
    <Select value={model} onValueChange={(value) => onModelChange(value as AIModel)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
        <SelectItem value="gpt-4">GPT-4</SelectItem>
        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
        <SelectItem value="gpt-o1-mini">GPT-o1-mini</SelectItem>
        <SelectItem value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</SelectItem>
        <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
      </SelectContent>
    </Select>
  );
}
