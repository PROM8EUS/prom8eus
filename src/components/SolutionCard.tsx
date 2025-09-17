import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import IntegrationIcon from '@/components/IntegrationIcon';
import CreatorBadge from './CreatorBadge';
import { CapabilityChips } from './CapabilityChip';
import { WorkflowScoreChip } from './WorkflowScoreDisplay';
import { AgentTierChip, AgentDisclaimerChip } from './AgentTierDisplay';
import { ReasoningChip, convertWorkflowReasoning, convertAgentReasoning } from './ReasoningChip';
import { TypeBadge, ReliabilityBadge, getSolutionType } from './TypeBadge';
import { DomainBadge, convertToDomainData } from './DomainBadge';

export interface SolutionData {
  id: string;
  name: string;
  filename?: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  type: 'workflow' | 'ai-agent';
  rating?: number;
  reviewCount?: number;
  triggerType?: 'Complex' | 'Webhook' | 'Manual' | 'Scheduled';
  complexity?: 'Low' | 'Medium' | 'High';
  integrations?: string[];
  tags?: string[];
  capabilities?: string[]; // Agent capabilities
  model?: string; // Agent model
  provider?: string; // Agent provider
  matchScore?: number; // Workflow match score (0-100)
  agentTier?: 'Generalist' | 'Specialist' | 'Experimental'; // Agent tier
  agentDisclaimer?: string; // Agent disclaimer
  reasoning?: string[]; // Reasoning for the match
  confidence?: number; // Confidence in the match
  domains?: string[]; // Business domains
  domain_confidences?: number[]; // Domain confidence scores
  domain_origin?: string; // Domain classification origin
  active?: boolean;
  lastUpdated?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  authorEmail?: string;
  authorVerified?: boolean;
  pricing?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
}

interface SolutionCardProps {
  solution: SolutionData;
  onView?: (solution: SolutionData) => void;
  className?: string;
  isAdmin?: boolean;
}

function SolutionCard({ solution, onView, className }: SolutionCardProps) {
  const handleClick = () => onView?.(solution);
  const isAgent = solution.type === 'ai-agent';
  
  // For workflows: show integrations, for agents: show capabilities
  const techs = isAgent 
    ? (solution.capabilities || []).slice(0, 4)
    : (solution.integrations && solution.integrations.length > 0
        ? solution.integrations
        : (solution.tags || [])).slice(0, 4);

  return (
    <Card className={`transition-shadow h-full hover:shadow-md ${className}`} onClick={handleClick} role="button">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Title with type badge and score */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1" title={solution.filename || solution.name}>
            {solution.name}
          </h3>
          <div className="flex items-center gap-2 ml-2">
            {/* Workflow Score */}
            {!isAgent && solution.matchScore !== undefined && (
              <WorkflowScoreChip 
                score={solution.matchScore} 
                size="sm" 
                showLabel={false}
              />
            )}
            {/* Agent Tier */}
            {isAgent && solution.agentTier && (
              <AgentTierChip 
                tier={solution.agentTier} 
                size="sm" 
                showIcon={true}
              />
            )}
            {/* Type and Reliability Badges */}
            <div className="flex items-center gap-1">
              <TypeBadge 
                type={isAgent ? 'agent' : 'workflow'} 
                size="sm" 
                showLabel={true}
                showIcon={true}
                variant="outline"
              />
              <ReliabilityBadge 
                type={isAgent ? 'agent' : 'workflow'} 
                size="sm" 
                showLabel={true}
                showIcon={true}
                variant="outline"
              />
            </div>
          </div>
        </div>

        {/* Agent model/provider info */}
        {isAgent && (solution.model || solution.provider) && (
          <div className="text-xs text-gray-600 mb-2">
            {solution.model && solution.provider ? `${solution.model} (${solution.provider})` : solution.model || solution.provider}
          </div>
        )}

        {/* Integrations/Capabilities display */}
        {techs && techs.length > 0 && (
          <div className="mb-4">
            {isAgent ? (
              <CapabilityChips 
                capabilities={techs} 
                maxDisplay={4} 
                size="sm"
                className="justify-start"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {techs.map((t, i) => (
                  <IntegrationIcon key={i} name={t} size="sm" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agent Disclaimer */}
        {isAgent && solution.agentDisclaimer && (
          <div className="mb-4">
            <AgentDisclaimerChip 
              disclaimer={solution.agentDisclaimer} 
              size="sm"
            />
          </div>
        )}

        {/* Reasoning Chip */}
        {solution.reasoning && solution.reasoning.length > 0 && (
          <div className="mb-4">
            <ReasoningChip 
              reasoning={isAgent 
                ? convertAgentReasoning(
                    solution.reasoning, 
                    solution.matchScore || 0, 
                    solution.agentTier || 'Experimental',
                    solution.confidence || 50
                  )
                : convertWorkflowReasoning(
                    solution.reasoning, 
                    solution.matchScore || 0, 
                    solution.confidence || 50
                  )
              }
              size="sm"
              maxItems={2}
              showScore={true}
            />
          </div>
        )}

        {/* Domain Badge */}
        {solution.domains && solution.domains.length > 0 && (
          <div className="mb-4">
            <DomainBadge 
              domains={convertToDomainData(
                solution.domains, 
                solution.domain_confidences || [], 
                solution.domain_origin || 'default'
              )}
              size="sm"
              showConfidence={false}
              showOrigin={false}
              maxDisplay={1}
              variant="outline"
            />
          </div>
        )}

        {/* Spacer pushes bottom row down */}
        <div className="flex-1" />

        {/* Bottom row: creator left, rating right */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <CreatorBadge
              name={(solution.authorName && solution.authorName.toLowerCase() !== 'community')
                ? solution.authorName
                : 'Community'}
              avatarUrl={solution.authorAvatarUrl}
              email={(solution.authorEmail && solution.authorEmail.includes('@')) ? solution.authorEmail : undefined}
              verified={solution.authorVerified}
            />
            {!solution.authorVerified && (!solution.authorName || (solution.authorName || '').toLowerCase() === 'community') && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-primary/10 text-primary-700 border-primary/30">Community</span>
            )}
            {solution.pricing && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  solution.pricing === 'Free'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : solution.pricing === 'Freemium'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : solution.pricing === 'Paid'
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
              >
                {solution.pricing}
              </span>
            )}
          </div>

          {solution.rating && (
            <div className="flex items-center gap-1 text-sm text-gray-900">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{solution.rating.toFixed(1)}</span>
              {solution.reviewCount ? (
                <span className="text-xs text-gray-500">({solution.reviewCount})</span>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SolutionCard;
export { SolutionData };