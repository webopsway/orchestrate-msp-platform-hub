import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

interface NotificationTransport {
  id: string;
  team_id: string;
  channel: string;
  config: Json;
  configured_by: string;
  is_active: boolean;
  scope: string;
  created_at: string;
  updated_at: string;
}

interface NotificationHistory {
  id: string;
  team_id: string;
  transport_id: string;
  event_type: string;
  payload: Json;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export const useNotifications = () => {
  const { sessionContext } = useAuth();
  const [transports, setTransports] = useState<NotificationTransport[]>([]);
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransports = useCallback(async () => {
    if (!sessionContext?.current_team_id) {
      setTransports([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_transports')
        .select('*')
        .eq('team_id', sessionContext.current_team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransports(data || []);
    } catch (error) {
      console.error('Error fetching transports:', error);
      toast.error('Erreur lors du chargement des transports');
    } finally {
      setLoading(false);
    }
  }, [sessionContext?.current_team_id]);

  const fetchNotifications = useCallback(async () => {
    if (!sessionContext?.current_team_id) {
      setNotifications([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('team_id', sessionContext.current_team_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications((data || []) as NotificationHistory[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    }
  }, [sessionContext?.current_team_id]);

  const createTransport = useCallback(async (transportData: {
    channel: string;
    scope: string;
    config: any;
    is_active: boolean;
  }) => {
    if (!sessionContext?.current_team_id) {
      toast.error('Aucune équipe sélectionnée');
      throw new Error('No team ID available');
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_transports')
        .insert([{
          team_id: sessionContext.current_team_id,
          channel: transportData.channel,
          scope: transportData.scope,
          config: transportData.config,
          configured_by: sessionContext.current_team_id, // TODO: Use actual user ID
          is_active: transportData.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Transport créé avec succès');
      await fetchTransports();
      return data;
    } catch (error) {
      console.error('Error creating transport:', error);
      toast.error('Erreur lors de la création du transport');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionContext?.current_team_id, fetchTransports]);

  const updateTransport = useCallback(async (transportId: string, updates: {
    channel?: string;
    scope?: string;
    config?: any;
    is_active?: boolean;
  }) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_transports')
        .update(updates)
        .eq('id', transportId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Transport mis à jour');
      await fetchTransports();
      return data;
    } catch (error) {
      console.error('Error updating transport:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchTransports]);

  const deleteTransport = useCallback(async (transportId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('notification_transports')
        .delete()
        .eq('id', transportId);

      if (error) throw error;

      toast.success('Transport supprimé');
      await fetchTransports();
    } catch (error) {
      console.error('Error deleting transport:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchTransports]);

  const testTransport = useCallback(async (transportId: string) => {
    try {
      setLoading(true);
      
      // Call the notification dispatcher edge function to test the transport
      const { data, error } = await supabase.functions.invoke('notification-dispatcher', {
        body: {
          transport_id: transportId,
          test: true,
          payload: {
            message: 'Test de notification',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      toast.success('Test envoyé avec succès');
      await fetchNotifications();
    } catch (error) {
      console.error('Error testing transport:', error);
      toast.error('Erreur lors du test');
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  const retryNotification = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      
      // Call the notification dispatcher to retry a failed notification
      const { data, error } = await supabase.functions.invoke('notification-dispatcher', {
        body: {
          notification_id: notificationId,
          retry: true
        }
      });

      if (error) throw error;

      toast.success('Notification relancée');
      await fetchNotifications();
    } catch (error) {
      console.error('Error retrying notification:', error);
      toast.error('Erreur lors de la relance');
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  return {
    transports,
    notifications,
    loading,
    createTransport,
    updateTransport,
    deleteTransport,
    testTransport,
    retryNotification,
    fetchTransports,
    fetchNotifications
  };
};