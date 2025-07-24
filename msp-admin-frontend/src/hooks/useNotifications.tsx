import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

export type NotificationTransport = Tables<'notification_transports'>;
export type Notification = Tables<'notifications'> & {
  transport?: NotificationTransport;
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [transports, setTransports] = useState<NotificationTransport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch notification transports
  const fetchTransports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_transports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransports(data || []);
    } catch (error) {
      console.error('Error fetching transports:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les transports de notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications history
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          transport:notification_transports(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create or update transport
  const saveTransport = async (transport: Partial<NotificationTransport>) => {
    if (!user) return;

    try {
      setLoading(true);

      if (transport.id) {
        // Update existing transport
        const { error } = await supabase
          .from('notification_transports')
          .update({
            scope: transport.scope,
            channel: transport.channel,
            config: transport.config,
            is_active: transport.is_active,
          })
          .eq('id', transport.id);

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Transport de notification mis à jour",
        });
      } else {
        // Create new transport
        const { error } = await supabase
          .from('notification_transports')
          .insert({
            team_id: transport.team_id,
            configured_by: user.id,
            scope: transport.scope,
            channel: transport.channel,
            config: transport.config,
            is_active: transport.is_active ?? true,
          });

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Transport de notification créé",
        });
      }

      await fetchTransports();
    } catch (error) {
      console.error('Error saving transport:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le transport",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete transport
  const deleteTransport = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('notification_transports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Transport supprimé",
      });
      await fetchTransports();
    } catch (error) {
      console.error('Error deleting transport:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le transport",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test transport by sending a test notification
  const testTransport = async (transportId: string) => {
    try {
      setLoading(true);
      
      // Create a test notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          team_id: (await supabase.rpc('get_current_user_session')).data?.[0]?.current_team_id,
          transport_id: transportId,
          event_type: 'test',
          payload: {
            title: 'Test de notification',
            description: 'Ceci est un test de votre configuration de notification.',
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      // Trigger the dispatcher
      await supabase.functions.invoke('notification-dispatcher');

      toast({
        title: "Test envoyé",
        description: "Une notification de test a été envoyée",
      });
      
      await fetchNotifications();
    } catch (error) {
      console.error('Error testing transport:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le test",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Retry failed notification
  const retryNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      
      // Reset notification status
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'pending',
          error_message: null
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Trigger the dispatcher
      await supabase.functions.invoke('notification-dispatcher');

      toast({
        title: "Notification relancée",
        description: "La notification sera retraitée",
      });
      
      await fetchNotifications();
    } catch (error) {
      console.error('Error retrying notification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de relancer la notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_transports'
        },
        () => {
          fetchTransports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    transports,
    notifications,
    loading,
    fetchTransports,
    fetchNotifications,
    saveTransport,
    deleteTransport,
    testTransport,
    retryNotification,
  };
};