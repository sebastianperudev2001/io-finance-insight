import { useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ActionButtons } from "@/components/ActionButtons";
import { EmailConfirmDialog } from "@/components/EmailConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, BarChart3 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy el asistente de IO Finance. Puedo ayudarte a analizar datos financieros y generar reportes. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response - replace with actual AI call
    setTimeout(() => {
      const aiMessage: Message = {
        role: "assistant",
        content: "He analizado tu consulta sobre los datos financieros. Basándome en la base de datos, puedo generar un reporte detallado con los KPIs relevantes. ¿Te gustaría que genere el reporte en formato CSV?",
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleDownloadCSV = () => {
    // Generate sample CSV data
    const csvContent = `Métrica,Valor,Fecha
Ingresos Totales,"$125,000",2025-01-15
Gastos Operativos,"$75,000",2025-01-15
Margen de Ganancia,40%,2025-01-15
ROI,25%,2025-01-15`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte-financiero-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Reporte descargado",
      description: "El archivo CSV ha sido descargado exitosamente.",
    });
  };

  const handleSendEmail = () => {
    setEmailDialogOpen(true);
  };

  const handleConfirmEmail = () => {
    setEmailDialogOpen(false);
    toast({
      title: "Email enviado",
      description: "El reporte ha sido enviado a tu dirección de email.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <TrendingUp className="text-primary-foreground" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              IO Finance
            </h1>
            <p className="text-xs text-muted-foreground">Asistente de Análisis Financiero</p>
          </div>
          <div className="ml-auto">
            <BarChart3 className="text-muted-foreground" size={24} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="flex flex-col h-[calc(100vh-180px)] gap-6">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {messages.map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} />
            ))}
            {isLoading && (
              <div className="flex gap-4 p-4 rounded-lg bg-card max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <BarChart3 size={18} className="animate-pulse" />
                </div>
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <ActionButtons
            onDownloadCSV={handleDownloadCSV}
            onSendEmail={handleSendEmail}
            disabled={isLoading}
          />

          {/* Chat Input */}
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </main>

      {/* Email Confirmation Dialog */}
      <EmailConfirmDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onConfirm={handleConfirmEmail}
      />
    </div>
  );
};

export default Index;
