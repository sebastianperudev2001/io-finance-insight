import { Button } from "@/components/ui/button";
import { Download, Mail, FileEdit } from "lucide-react";

interface QueryActionsProps {
  onDownloadCSV: () => void;
  onEditTemplate: () => void;
  onSendCampaign: () => void;
  disabled?: boolean;
}

export const QueryActions = ({ onDownloadCSV, onEditTemplate, onSendCampaign, disabled }: QueryActionsProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={onDownloadCSV}
        disabled={disabled}
        variant="outline"
        size="sm"
        className="gap-2 border-2 hover:bg-secondary"
      >
        <Download size={16} />
        Descargar CSV
      </Button>
      <Button
        onClick={onEditTemplate}
        disabled={disabled}
        variant="outline"
        size="sm"
        className="gap-2 border-2 hover:bg-secondary"
      >
        <FileEdit size={16} />
        Editar Template
      </Button>
      <Button
        onClick={onSendCampaign}
        disabled={disabled}
        size="sm"
        className="gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground"
      >
        <Mail size={16} />
        Enviar Campaña
      </Button>
    </div>
  );
};
