import { useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { EmailConfirmDialog } from "@/components/EmailConfirmDialog";
import { EmailTemplateDialog } from "@/components/EmailTemplateDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, BarChart3 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  hasActions?: boolean;
  queryResults?: any[];
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy el asistente de IO Finance. Puedo ayudarte a analizar datos de clientes y generar campañas de marketing. Por ejemplo, prueba: 'Muéstrame todos los clientes Premium activos'",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: "Campaña de Marketing - IO Finance",
    body: `Estimado/a {{nombre}},

Nos complace contactarte desde IO Finance.

En {{empresa}}, sabemos que el éxito financiero requiere las herramientas adecuadas.

Saludos cordiales,
Equipo IO Finance`
  });
  const [currentResults, setCurrentResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("process-query", {
        body: { query: content },
      });

      if (error) throw error;

      if (data.success) {
        setCurrentResults(data.results || []);
        const aiMessage: Message = {
          role: "assistant",
          content: data.message,
          hasActions: data.results && data.results.length > 0,
          queryResults: data.results,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || "Error al procesar la consulta");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu consulta. Por favor, intenta reformularla.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "No se pudo procesar la consulta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (currentResults.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay resultados para descargar",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(currentResults[0]).join(",");
    const rows = currentResults
      .map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(",")
      )
      .join("\n");
    const csvContent = `${headers}\n${rows}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `clientes-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Reporte descargado",
      description: `Se descargaron ${currentResults.length} registros en formato CSV.`,
    });
  };

  const handleEditTemplate = () => {
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = (subject: string, body: string) => {
    setEmailTemplate({ subject, body });
    toast({
      title: "Template guardado",
      description: "El template de email ha sido actualizado.",
    });
  };

  const handleSendCampaign = () => {
    if (currentResults.length === 0) {
      toast({
        title: "No hay destinatarios",
        description: "No hay clientes seleccionados para la campaña",
        variant: "destructive",
      });
      return;
    }
    setEmailDialogOpen(true);
  };

  const handleConfirmCampaign = () => {
    setEmailDialogOpen(false);
    
    // Aquí se integraría con el servicio de email (Resend u otro)
    toast({
      title: "Campaña programada",
      description: `Se enviarán ${currentResults.length} emails personalizados a los clientes seleccionados.`,
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
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                hasActions={message.hasActions}
                onDownloadCSV={handleDownloadCSV}
                onEditTemplate={handleEditTemplate}
                onSendCampaign={handleSendCampaign}
              />
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

          {/* Chat Input */}
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </main>

      {/* Email Template Dialog */}
      <EmailTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSave={handleSaveTemplate}
      />

      {/* Campaign Confirmation Dialog */}
      <EmailConfirmDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onConfirm={handleConfirmCampaign}
      />
    </div>
  );
};

export default Index;
