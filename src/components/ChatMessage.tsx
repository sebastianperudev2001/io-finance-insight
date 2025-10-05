import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  actions?: ReactNode;
}

export const ChatMessage = ({ role, content, actions }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-lg transition-all duration-300",
        isUser ? "bg-secondary/50 ml-auto max-w-[80%]" : "bg-card max-w-[80%]"
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
      <div className="flex-1">
        <p className="text-sm font-medium mb-1">{isUser ? "Analista" : "IO Assistant"}</p>
        <div className="text-foreground/90 leading-relaxed prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              ul: ({ children }) => <ul className="list-none space-y-1 my-2">{children}</ul>,
              li: ({ children }) => <li className="flex items-start gap-1">{children}</li>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {actions && <div className="mt-2">{actions}</div>}
      </div>
    </div>
  );
};
