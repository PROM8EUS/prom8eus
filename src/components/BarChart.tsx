interface BarChartProps {
  automatizable: number;
  humanRequired: number;
}

const BarChart = ({ automatizable, humanRequired }: BarChartProps) => {
  const total = automatizable + humanRequired;
  const autoPercentage = (automatizable / total) * 100;
  const humanPercentage = (humanRequired / total) * 100;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground text-center">
        Verteilung der Aufgaben
      </h3>
      
      <div className="space-y-4">
        {/* Automatisierbar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-foreground font-medium">Automatisierbar</span>
            <span className="text-sm text-muted-foreground">{Math.round(autoPercentage)}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${autoPercentage}%`,
                animation: 'progress-bar-static 1.2s ease-out forwards'
              }}
            />
          </div>
        </div>

        {/* Mensch notwendig */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-foreground font-medium">Mensch notwendig</span>
            <span className="text-sm text-muted-foreground">{Math.round(humanPercentage)}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-destructive rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${humanPercentage}%`,
                animation: 'progress-bar-static 1.4s ease-out forwards'
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{automatizable}</p>
          <p className="text-sm text-muted-foreground">Automatisierbare Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-destructive">{humanRequired}</p>
          <p className="text-sm text-muted-foreground">Menschliche Tasks</p>
        </div>
      </div>
    </div>
  );
};

export default BarChart;