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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (subject: string, body: string) => void;
  initialSubject?: string;
  initialBody?: string;
}

export const TemplateEditor = ({ 
  open, 
  onOpenChange, 
  onSave,
  initialSubject = "Campaña IO Finance",
  initialBody = "Hola {{nombre}},\n\nNos complace compartir contigo información relevante desde IO Finance.\n\nSaludos,\nEquipo IO Finance"
}: TemplateEditorProps) => {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  const handleSave = () => {
    onSave(subject, body);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Template de Email</DialogTitle>
          <DialogDescription>
            Usa variables como {"{{"} nombre {"}}"}, {"{{"} empresa {"}}"}, {"{{"} segmento {"}}"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Cuerpo del mensaje</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Contenido del email..."
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-accent to-accent/80">
            Guardar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
