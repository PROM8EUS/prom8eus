interface LandingScoreCircleProps {
  score: number;
  maxScore: number;
  jobTitle: string;
}

const LandingScoreCircle = ({ score, maxScore, jobTitle }: LandingScoreCircleProps) => {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 60; // radius = 60 for larger circle
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="text-center space-y-6">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
        Analyse-Ergebnis für <span className="text-primary">{jobTitle}</span>
      </h1>
      
      <div className="flex justify-center">
        <div className="relative w-48 h-48 md:w-56 md:h-56">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r="60"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="70"
              cy="70"
              r="60"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-2000 ease-out"
            />
          </svg>
          
          {/* Score text in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl md:text-5xl font-bold text-foreground">{score}</span>
            <span className="text-xl md:text-2xl text-muted-foreground">/{maxScore}</span>
            <span className="text-sm md:text-base text-primary font-semibold mt-2">
              Automatisierbar
            </span>
          </div>
        </div>
      </div>
      
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Diese Position zeigt ein hohes Potenzial für Automatisierung durch moderne KI-Technologien
      </p>
    </div>
  );
};

export default LandingScoreCircle;