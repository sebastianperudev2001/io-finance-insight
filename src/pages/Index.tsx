import { useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { QueryActionButtons } from "@/components/QueryActionButtons";
import { TemplateEditor } from "@/components/TemplateEditor";
import { EmailConfirmDialog } from "@/components/EmailConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  queryData?: any[];
  sqlQuery?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 ¡Hola! Soy tu asistente de marketing de IO Finance. Te ayudo a segmentar clientes y crear campañas personalizadas.\n\n💡 Prueba preguntas como:\n• 'Muéstrame clientes Premium activos'\n• 'Busca empresas con valor mayor a $20,000'\n• 'Lista clientes VIP registrados este año'",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: "{{nombre}}, tenemos una propuesta especial para {{empresa}}",
    body: "Hola {{nombre}},\n\nDesde IO Finance queremos agradecerte por ser parte de nuestro segmento {{segmento}}.\n\nHemos preparado contenido exclusivo pensado especialmente para {{empresa}}.\n\n¿Te gustaría conocer más sobre nuestras soluciones financieras?\n\nSaludos cordiales,\nEquipo de Marketing - IO Finance"
  });
  const [currentQueryData, setCurrentQueryData] = useState<any[] | null>(null);
  const { toast } = useToast();

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-query', {
        body: { query: content }
      });

      if (error) throw error;

      const resultCount = data.data?.length || 0;
      const aiMessage: Message = {
        role: "assistant",
        content: `🎯 Perfecto! Encontré **${resultCount} cliente${resultCount !== 1 ? 's' : ''}** que coinciden con tu segmentación.\n\n📊 **Próximos pasos:**\n• Descarga el reporte en CSV\n• Personaliza el template de email\n• Lanza tu campaña de marketing`,
        queryData: data.data,
        sqlQuery: data.sqlQuery
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setCurrentQueryData(data.data);
      
      toast({
        title: "✅ Segmentación completada",
        description: `${resultCount} cliente${resultCount !== 1 ? 's' : ''} listo${resultCount !== 1 ? 's' : ''} para tu campaña`,
      });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: "assistant",
        content: "⚠️ Ups, algo salió mal al procesar tu segmentación. Por favor, intenta reformular tu consulta o prueba con otro criterio.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: "Error en la segmentación",
        description: "No pudimos procesar tu consulta. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = (data: any[]) => {
    if (!data || data.length === 0) {
      toast({
        title: "Sin resultados",
        description: "No hay clientes en esta segmentación para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

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
      title: "📥 Reporte exportado",
      description: `${data.length} cliente${data.length !== 1 ? 's' : ''} descargado${data.length !== 1 ? 's' : ''} en formato CSV`,
    });
  };

  const handleEditTemplate = () => {
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = (subject: string, body: string) => {
    setEmailTemplate({ subject, body });
    toast({
      title: "✅ Template actualizado",
      description: "Tu plantilla de email está lista para la campaña",
    });
  };

  const handleSendCampaign = () => {
    if (!currentQueryData || currentQueryData.length === 0) {
      toast({
        title: "Sin audiencia",
        description: "Primero debes segmentar clientes para lanzar una campaña",
        variant: "destructive",
      });
      return;
    }
    setEmailDialogOpen(true);
  };

  const handleConfirmEmail = async () => {
    setEmailDialogOpen(false);
    
    if (!currentQueryData) return;

    const recipientCount = currentQueryData.length;
    
    // Email hardcoded para pruebas
    const HARDCODED_EMAIL = "test@iofinance.com";
    
    toast({
      title: "🚀 Lanzando campaña...",
      description: `Enviando ${recipientCount} email${recipientCount !== 1 ? 's' : ''} personalizado${recipientCount !== 1 ? 's' : ''}`,
    });

    try {
      // Enviar un correo por cada cliente en la consulta
      const emailPromises = currentQueryData.map(async (cliente, index) => {
        // Reemplazar variables del template con datos del cliente
        const personalizedSubject = emailTemplate.subject
          .replace(/\{\{nombre\}\}/g, cliente.nombre || 'Cliente')
          .replace(/\{\{empresa\}\}/g, cliente.empresa || 'N/A')
          .replace(/\{\{segmento\}\}/g, cliente.segmento || 'N/A');
        
        const personalizedBody = emailTemplate.body
          .replace(/\{\{nombre\}\}/g, cliente.nombre || 'Cliente')
          .replace(/\{\{empresa\}\}/g, cliente.empresa || 'N/A')
          .replace(/\{\{segmento\}\}/g, cliente.segmento || 'N/A')
          .replace(/\{\{valor_cliente\}\}/g, cliente.valor_cliente?.toString() || '0')
          .replace(/\{\{email\}\}/g, cliente.email || 'N/A');

        // Simular envío con delay progresivo para no saturar
        await new Promise(resolve => setTimeout(resolve, index * 100));

        // Aquí puedes conectar con tu webhook de n8n
        // const response = await fetch('https://tu-webhook.n8n.cloud/email', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     to: HARDCODED_EMAIL,
        //     subject: personalizedSubject,
        //     body: personalizedBody,
        //     clientData: cliente
        //   })
        // });

        console.log(`Email ${index + 1}/${recipientCount} enviado a ${HARDCODED_EMAIL}:`, {
          subject: personalizedSubject,
          body: personalizedBody,
          originalClient: cliente.email,
          clientName: cliente.nombre
        });

        return { success: true, index };
      });

      // Esperar a que todos los emails se procesen
      await Promise.all(emailPromises);

      toast({
        title: "🎉 Campaña lanzada con éxito",
        description: `${recipientCount} email${recipientCount !== 1 ? 's' : ''} personalizado${recipientCount !== 1 ? 's' : ''} enviado${recipientCount !== 1 ? 's' : ''} a ${HARDCODED_EMAIL}`,
      });

    } catch (error) {
      console.error('Error al enviar campaña:', error);
      toast({
        title: "Error en el envío",
        description: "No pudimos completar el envío de la campaña. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
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
            <p className="text-xs text-muted-foreground">Asistente de Marketing Inteligente</p>
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
                actions={message.queryData && message.queryData.length > 0 ? (
                  <QueryActionButtons
                    onDownloadCSV={() => handleDownloadCSV(message.queryData!)}
                    onEditTemplate={handleEditTemplate}
                    onSendCampaign={handleSendCampaign}
                    disabled={isLoading}
                  />
                ) : undefined}
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

      {/* Template Editor */}
      <TemplateEditor
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSave={handleSaveTemplate}
        initialSubject={emailTemplate.subject}
        initialBody={emailTemplate.body}
      />

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
