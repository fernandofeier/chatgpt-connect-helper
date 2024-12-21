import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type OpenAIModel = "gpt-4-turbo-preview" | "gpt-4" | "gpt-3.5-turbo" | "gpt-4-0125-preview" | "gpt-4-0613";

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
        <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
        <SelectItem value="gpt-4">GPT-4</SelectItem>
        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
        <SelectItem value="gpt-4-0125-preview">GPT-4-0125-Preview</SelectItem>
        <SelectItem value="gpt-4-0613">GPT-4-0613</SelectItem>
      </SelectContent>
    </Select>
  );
}