import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu pregunta sobre los datos financieros..."
        disabled={disabled}
        className="min-h-[60px] resize-none"
      />
      <Button 
        type="submit" 
        disabled={disabled || !message.trim()}
        size="icon"
        className="h-[60px] w-[60px] bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        <Send size={20} />
      </Button>
    </form>
  );
};
