import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";

interface ActionButtonsProps {
  onDownloadCSV: () => void;
  onSendEmail: () => void;
  disabled?: boolean;
}

export const ActionButtons = ({ onDownloadCSV, onSendEmail, disabled }: ActionButtonsProps) => {
  return (
    <div className="flex gap-3">
      <Button
        onClick={onDownloadCSV}
        disabled={disabled}
        variant="outline"
        className="flex-1 gap-2 border-2 hover:bg-secondary"
      >
        <Download size={18} />
        Descargar Reporte CSV
      </Button>
      <Button
        onClick={onSendEmail}
        disabled={disabled}
        className="flex-1 gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground"
      >
        <Mail size={18} />
        Enviar por Email
      </Button>
    </div>
  );
};
