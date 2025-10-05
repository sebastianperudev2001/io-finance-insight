import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { QueryActions } from "./QueryActions";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  hasActions?: boolean;
  onDownloadCSV?: () => void;
  onEditTemplate?: () => void;
  onSendCampaign?: () => void;
}

export const ChatMessage = ({ 
  role, 
  content, 
  hasActions = false,
  onDownloadCSV,
  onEditTemplate,
  onSendCampaign 
}: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-lg transition-all duration-300",
        isUser ? "bg-secondary/50 ml-auto max-w-[80%]" : "bg-card max-w-[85%]"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <p className="text-sm font-medium mb-1">{isUser ? "Analista" : "IO Assistant"}</p>
          <p className="text-foreground/90 leading-relaxed">{content}</p>
        </div>
        {hasActions && !isUser && onDownloadCSV && onEditTemplate && onSendCampaign && (
          <QueryActions
            onDownloadCSV={onDownloadCSV}
            onEditTemplate={onEditTemplate}
            onSendCampaign={onSendCampaign}
          />
        )}
      </div>
    </div>
  );
};
