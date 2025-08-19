import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
  url: string;
  textLength: number;
  wasRendered?: boolean;
}

export function DebugModal({ 
  isOpen, 
  onClose, 
  rawText, 
  url, 
  textLength, 
  wasRendered 
}: DebugModalProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      toast({
        title: "Text kopiert",
        description: "Der Rohtext wurde in die Zwischenablage kopiert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Text konnte nicht kopiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url_obj = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url_obj;
    link.download = `rohtext_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url_obj);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rohtext Analyse - Debug Information</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 flex-1">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>URL:</strong> 
              <p className="break-all text-muted-foreground">{url}</p>
            </div>
            <div>
              <strong>Textlänge:</strong> 
              <span className={`ml-2 ${textLength < 500 ? 'text-destructive' : 'text-green-600'}`}>
                {textLength.toLocaleString()} Zeichen
              </span>
            </div>
            <div>
              <strong>Rendering-Modus:</strong> 
              <span className="ml-2">
                {wasRendered ? '🚀 JavaScript gerendert' : '📄 Statisch geladen'}
              </span>
            </div>
            <div>
              <strong>Qualität:</strong>
              <span className={`ml-2 ${
                textLength < 500 ? 'text-destructive' : 
                textLength < 2000 ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {textLength < 500 ? 'Unzureichend' : 
                 textLength < 2000 ? 'Ausreichend' : 'Gut'}
              </span>
            </div>
          </div>

          {textLength < 500 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                ⚠️ <strong>Warnung:</strong> Der extrahierte Text ist sehr kurz ({textLength} Zeichen). 
                Dies kann zu ungenauen Analyseergebnissen führen. Bitte prüfen Sie den Text unten und 
                fügen Sie bei Bedarf manuell zusätzliche Informationen hinzu.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Kopieren
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Als Datei speichern
            </Button>
          </div>

          <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/30">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {rawText || 'Kein Text extrahiert'}
            </pre>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}