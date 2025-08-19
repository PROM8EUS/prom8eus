interface ScoreCircleProps {
  score: number;
  maxScore: number;
  label: string;
  variant?: 'default' | 'small';
  lang?: 'de' | 'en';
}

const ScoreCircle = ({ score, maxScore, label, variant = 'default', lang = 'de' }: ScoreCircleProps) => {
  const percentage = (score / maxScore) * 100;
  
  // Format score based on language and variant
  const formatScore = (score: number) => {
    if (variant === 'small') {
      // Round to 1 decimal place for small variant
      const roundedScore = Math.round(score * 10) / 10;
      return lang === 'de' 
        ? roundedScore.toString().replace('.', ',')
        : roundedScore.toString();
    }
    return Math.round(score).toString();
  };
  
  if (variant === 'small') {
    const smallRadius = 20;
    const smallCircumference = 2 * Math.PI * smallRadius;
    const smallStrokeDasharray = smallCircumference;
    const smallStrokeDashoffset = smallCircumference - (percentage / 100) * smallCircumference;

    return (
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 44 44">
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r={smallRadius}
            stroke="hsl(var(--muted))"
            strokeWidth="3"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="22"
            cy="22"
            r={smallRadius}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={smallStrokeDasharray}
            strokeDashoffset={smallStrokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              '--progress-offset': `${smallStrokeDashoffset}px`,
              animation: 'progress-circle 1.5s ease-out forwards'
            } as React.CSSProperties}
          />
        </svg>
        
        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{formatScore(score)}</span>
        </div>
      </div>
    );
  }

  // Default variant
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 116 116">
          {/* Background circle */}
          <circle
            cx="58"
            cy="58"
            r="45"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="58"
            cy="58"
            r="45"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              '--progress-offset': `${strokeDashoffset}px`,
              animation: 'progress-circle 1.5s ease-out forwards'
            } as React.CSSProperties}
          />
        </svg>
        
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{formatScore(score)}</span>
          <span className="text-lg text-muted-foreground">/{maxScore}</span>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{label}</p>
      </div>
    </div>
  );
};

export default ScoreCircle;