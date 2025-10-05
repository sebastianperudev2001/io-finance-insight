import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (subject: string, body: string) => void;
}

export const EmailTemplateDialog = ({ open, onOpenChange, onSave }: EmailTemplateDialogProps) => {
  const [subject, setSubject] = useState("Campaña de Marketing - IO Finance");
  const [body, setBody] = useState(`Estimado/a {{nombre}},

Nos complace contactarte desde IO Finance.

En {{empresa}}, sabemos que el éxito financiero requiere las herramientas adecuadas. Por eso queremos presentarte nuestras soluciones diseñadas especialmente para clientes del segmento {{segmento}}.

¿Te gustaría conocer más sobre cómo podemos ayudarte?

Saludos cordiales,
Equipo IO Finance`);

  const handleSave = () => {
    onSave(subject, body);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Template de Email</DialogTitle>
          <DialogDescription>
            Personaliza el template usando variables: {"{{nombre}}"}, {"{{empresa}}"}, {"{{segmento}}"}, {"{{email}}"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Cuerpo del mensaje</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe el cuerpo del email..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
          >
            Guardar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
