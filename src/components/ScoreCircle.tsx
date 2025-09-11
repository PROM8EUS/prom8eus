interface ScoreCircleProps {
  score: number;
  maxScore: number;
  label: string;
  variant?: 'default' | 'small' | 'xsmall';
  lang?: 'de' | 'en';
  showPercentage?: boolean;
  animate?: boolean;
}

const ScoreCircle = ({ score, maxScore, label, variant = 'default', lang = 'de', showPercentage = true, animate = true }: ScoreCircleProps) => {
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
  
  if (variant === 'xsmall') {
    const xsmallRadius = 12;
    const xsmallCircumference = 2 * Math.PI * xsmallRadius;
    const xsmallStrokeDasharray = xsmallCircumference;
    const xsmallStrokeDashoffset = xsmallCircumference - (percentage / 100) * xsmallCircumference;

    return (
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
          {/* Background circle */}
          <circle
            cx="16"
            cy="16"
            r={xsmallRadius}
            stroke="hsl(var(--muted))"
            strokeWidth="3"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="16"
            cy="16"
            r={xsmallRadius}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={xsmallStrokeDasharray}
            strokeDashoffset={animate ? xsmallStrokeDasharray : xsmallStrokeDashoffset}
            strokeLinecap="round"
            className={animate ? 'animate-progress-circle' : undefined}
            style={{
              '--stroke-dasharray': `${xsmallStrokeDasharray}px`,
              '--progress-offset': `${xsmallStrokeDashoffset}px`
            } as React.CSSProperties}
          />
        </svg>
        
        {/* No text for xsmall variant - always hidden */}
      </div>
    );
  }

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
            strokeDashoffset={animate ? smallStrokeDasharray : smallStrokeDashoffset}
            strokeLinecap="round"
            className={animate ? 'animate-progress-circle' : undefined}
            style={{
              '--stroke-dasharray': `${smallStrokeDasharray}px`,
              '--progress-offset': `${smallStrokeDashoffset}px`
            } as React.CSSProperties}
          />
        </svg>
        
        {/* Score text in center - always show for small variant */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{formatScore(score)}</span>
        </div>
      </div>
    );
  }

  // Default variant
  const circumference = 2 * Math.PI * 60; // radius = 60 (increased from 45)
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <svg className="w-48 h-48 md:w-56 md:h-56 transform -rotate-90" viewBox="0 0 140 140">
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
            strokeDashoffset={animate ? strokeDasharray : strokeDashoffset}
            strokeLinecap="round"
            className={animate ? 'animate-progress-circle' : undefined}
            style={{
              '--stroke-dasharray': `${strokeDasharray}px`,
              '--progress-offset': `${strokeDashoffset}px`
            } as React.CSSProperties}
          />
        </svg>
        
        {/* Score text in center - only show if showPercentage is true */}
        {showPercentage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl md:text-5xl font-bold text-foreground">{formatScore(score)}</span>
            <span className="text-xl md:text-2xl text-muted-foreground">/{maxScore}</span>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{label}</p>
      </div>
    </div>
  );
};

export default ScoreCircle;