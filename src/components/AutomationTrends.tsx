import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Zap, Clock, Shield } from "lucide-react";

interface AutomationTrendsProps {
  trends: {
    highPotential: string[];
    mediumPotential: string[];
    lowPotential: string[];
  };
  lang: "de" | "en";
}

const AutomationTrends = ({ trends, lang }: AutomationTrendsProps) => {
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      de: {
        automation_trends: "Automatisierungstrends",
        high_potential: "Hohes Potenzial",
        medium_potential: "Mittleres Potenzial", 
        low_potential: "Niedriges Potenzial",
        increasing_trend: "Steigender Trend",
        stable_trend: "Stabiler Trend",
        decreasing_trend: "Fallender Trend",
        no_tasks: "Keine Aufgaben in dieser Kategorie"
      },
      en: {
        automation_trends: "Automation Trends",
        high_potential: "High Potential",
        medium_potential: "Medium Potential",
        low_potential: "Low Potential", 
        increasing_trend: "Increasing Trend",
        stable_trend: "Stable Trend",
        decreasing_trend: "Decreasing Trend",
        no_tasks: "No tasks in this category"
      }
    };
    return translations[lang]?.[key] || key;
  };

  const renderTrendCard = (
    title: string,
    tasks: string[],
    icon: React.ReactNode,
    color: string,
    trendType: string
  ) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          {icon}
          <span>{title}</span>
          <Badge variant="outline" className={`text-xs ${color}`}>
            {trendType}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.map((task, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                <span className="text-primary font-medium">•</span>
                <span className="flex-1">{task}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {t("no_tasks")}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">
        {t("automation_trends")}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderTrendCard(
          t("high_potential"),
          trends.highPotential,
          <Zap className="w-5 h-5 text-green-600" />,
          "text-green-600 bg-green-50",
          t("increasing_trend")
        )}
        
        {renderTrendCard(
          t("medium_potential"),
          trends.mediumPotential,
          <Clock className="w-5 h-5 text-yellow-600" />,
          "text-yellow-600 bg-yellow-50",
          t("stable_trend")
        )}
        
        {renderTrendCard(
          t("low_potential"),
          trends.lowPotential,
          <Shield className="w-5 h-5 text-red-600" />,
          "text-red-600 bg-red-50",
          t("decreasing_trend")
        )}
      </div>
    </div>
  );
};

export default AutomationTrends;
