import { useState, useEffect } from 'react';
import { sessionService, SessionContext } from '@/services/sessionService';

export const useSession = () => {
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(
    sessionService.getSessionContext()
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = sessionService.subscribe((context) => {
      setSessionContext(context);
    });

    return unsubscribe;
  }, []);

  const initializeSession = async (organizationId?: string, teamId?: string) => {
    setLoading(true);
    try {
      const success = await sessionService.initializeSession(organizationId, teamId);
      return success;
    } finally {
      setLoading(false);
    }
  };

  const switchContext = async (organizationId: string, teamId: string) => {
    setLoading(true);
    try {
      const success = await sessionService.switchContext(organizationId, teamId);
      return success;
    } finally {
      setLoading(false);
    }
  };

  return {
    sessionContext,
    userProfile: sessionService.getUserProfile(),
    hasValidContext: sessionService.hasValidContext(),
    isMspAdmin: sessionService.isMspAdmin(),
    getCurrentTeamId: sessionService.getCurrentTeamId,
    getCurrentOrganizationId: sessionService.getCurrentOrganizationId,
    initializeSession,
    switchContext,
    loading
  };
};