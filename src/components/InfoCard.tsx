import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface InfoCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  variant: 'primary' | 'destructive' | 'human';
}

const InfoCard = ({ title, value, description, icon: Icon, variant }: InfoCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          iconBg: 'bg-primary/10 text-primary',
          valueColor: 'text-primary'
        };
      case 'destructive':
        return {
          iconBg: 'bg-destructive/10 text-destructive',
          valueColor: 'text-destructive'
        };
      case 'human':
        return {
          iconBg: 'bg-teal-100 text-teal-600',
          valueColor: 'text-teal-600'
        };
      default:
        return {
          iconBg: 'bg-primary/10 text-primary',
          valueColor: 'text-primary'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${styles.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <div className={`text-3xl font-bold ${styles.valueColor}`}>
            {value}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InfoCard;