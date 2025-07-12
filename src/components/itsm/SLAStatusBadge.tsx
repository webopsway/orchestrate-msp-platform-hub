import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { SLATracking, getSLAStatus } from '@/hooks/useITSMConfig';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SLAStatusBadgeProps {
  tracking?: SLATracking;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SLAStatusBadge: React.FC<SLAStatusBadgeProps> = ({ 
  tracking, 
  showDetails = false,
  size = 'md'
}) => {
  if (!tracking) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Aucun SLA
      </Badge>
    );
  }

  const slaStatus = getSLAStatus(tracking);
  const now = new Date();
  const responseDeadline = new Date(tracking.response_due_at);
  const resolutionDeadline = new Date(tracking.resolution_due_at);

  const getIcon = () => {
    switch (slaStatus.status) {
      case 'resolved_on_time':
        return <CheckCircle className="h-3 w-3" />;
      case 'resolved_late':
        return <CheckCircle className="h-3 w-3" />;
      case 'breached':
      case 'response_breached':
        return <XCircle className="h-3 w-3" />;
      case 'escalated':
        return <TrendingUp className="h-3 w-3" />;
      case 'at_risk':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    switch (slaStatus.status) {
      case 'resolved_on_time':
      case 'on_track':
        return 'default' as const;
      case 'at_risk':
        return 'secondary' as const;
      case 'breached':
      case 'response_breached':
      case 'resolved_late':
        return 'destructive' as const;
      case 'escalated':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getTimeRemaining = () => {
    if (tracking.resolved_at) return null;
    
    const nextDeadline = tracking.first_response_at ? resolutionDeadline : responseDeadline;
    const timeLeft = nextDeadline.getTime() - now.getTime();
    
    if (timeLeft < 0) {
      return `En retard de ${formatDistanceToNow(nextDeadline, { locale: fr })}`;
    } else {
      return `${formatDistanceToNow(nextDeadline, { locale: fr })} restantes`;
    }
  };

  const getTooltipContent = () => {
    const timeRemaining = getTimeRemaining();
    const nextDeadlineType = tracking.first_response_at ? 'résolution' : 'première réponse';
    
    return (
      <div className="space-y-2 text-sm">
        <div className="font-medium">{slaStatus.label}</div>
        
        {tracking.sla_policy && (
          <div className="text-xs text-muted-foreground">
            Politique: {tracking.sla_policy.name}
          </div>
        )}
        
        <div className="space-y-1 text-xs">
          <div>
            Première réponse: {tracking.sla_policy?.response_time_hours || 'N/A'}h
            {tracking.first_response_at ? 
              ` ✓ (${formatDistanceToNow(new Date(tracking.first_response_at), { locale: fr, addSuffix: true })})` :
              ` (${formatDistanceToNow(responseDeadline, { locale: fr, addSuffix: true })})`
            }
          </div>
          
          <div>
            Résolution: {tracking.sla_policy?.resolution_time_hours || 'N/A'}h
            {tracking.resolved_at ? 
              ` ✓ (${formatDistanceToNow(new Date(tracking.resolved_at), { locale: fr, addSuffix: true })})` :
              ` (${formatDistanceToNow(resolutionDeadline, { locale: fr, addSuffix: true })})`
            }
          </div>
          
          {tracking.escalation_due_at && (
            <div>
              Escalade: {formatDistanceToNow(new Date(tracking.escalation_due_at), { locale: fr, addSuffix: true })}
              {tracking.is_escalated ? ' ✓' : ''}
            </div>
          )}
        </div>
        
        {timeRemaining && (
          <div className="font-medium text-xs border-t pt-1">
            {nextDeadlineType}: {timeRemaining}
          </div>
        )}
      </div>
    );
  };

  const badge = (
    <Badge 
      variant={getVariant()} 
      className={`gap-1 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm px-3 py-1' : ''}`}
      style={slaStatus.status === 'breached' || slaStatus.status === 'response_breached' ? 
        { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' } : 
        slaStatus.status === 'at_risk' ? 
        { backgroundColor: 'hsl(var(--warning))', color: 'hsl(var(--warning-foreground))' } :
        undefined
      }
    >
      {getIcon()}
      {size !== 'sm' && slaStatus.label}
    </Badge>
  );

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {getTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      {badge}
      {showDetails && (
        <div className="text-xs text-muted-foreground">
          {getTimeRemaining()}
        </div>
      )}
    </div>
  );
};