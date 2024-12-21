import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type OpenAIModel = "gpt-3.5-turbo" | "gpt-4o" | "gpt-4o-mini" | "gpt-4" | "gpt-o1-mini";

interface ModelSelectorProps {
  model: OpenAIModel;
  onModelChange: (model: OpenAIModel) => void;
}

export function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  return (
    <Select value={model} onValueChange={(value) => onModelChange(value as OpenAIModel)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
        <SelectItem value="gpt-4">GPT-4</SelectItem>
        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
        <SelectItem value="gpt-o1-mini">GPT-o1-mini</SelectItem>
      </SelectContent>
    </Select>
  );
}