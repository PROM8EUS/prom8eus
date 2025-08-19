import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface InfoCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  variant: 'primary' | 'destructive';
}

const InfoCard = ({ title, value, description, icon: Icon, variant }: InfoCardProps) => {
  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
          variant === 'primary' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-destructive/10 text-destructive'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <div className={`text-3xl font-bold ${
            variant === 'primary' ? 'text-primary' : 'text-destructive'
          }`}>
            {value}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InfoCard;