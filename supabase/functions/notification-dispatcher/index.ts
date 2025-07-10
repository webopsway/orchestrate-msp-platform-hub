import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transport {
  id: string;
  channel: string;
  config: any;
  team_id: string;
}

interface Notification {
  id: string;
  team_id: string;
  transport_id: string;
  event_type: string;
  payload: any;
  status: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const sendSMTPEmail = async (transport: Transport, notification: Notification) => {
  const { host, port, user, password, from } = transport.config;
  const { title, description, change_request_id } = notification.payload;

  // Using a simple SMTP library (in real implementation, you'd use nodemailer)
  console.log(`Sending SMTP email via ${host}:${port} from ${from}`);
  console.log(`Subject: ${notification.event_type} - ${title}`);
  
  // Mock implementation - replace with actual SMTP
  return { success: true, messageId: `smtp-${Date.now()}` };
};

const sendTransactionalEmail = async (transport: Transport, notification: Notification) => {
  const { provider, apiKey, from } = transport.config;
  const { title, description } = notification.payload;

  if (provider === 'sendgrid') {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: transport.config.to }],
          subject: `${notification.event_type} - ${title}`,
        }],
        from: { email: from },
        content: [{
          type: 'text/html',
          value: `<h1>${title}</h1><p>${description}</p>`
        }]
      })
    });

    return { success: response.ok, messageId: response.headers.get('x-message-id') };
  }

  return { success: false, error: 'Unsupported provider' };
};

const sendSlackMessage = async (transport: Transport, notification: Notification) => {
  const { webhookUrl } = transport.config;
  const { title, description, status } = notification.payload;

  const slackMessage = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${notification.event_type.toUpperCase()}: ${title}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:* ${description}\n*Status:* ${status}`
        }
      }
    ]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage)
  });

  return { success: response.ok, messageId: `slack-${Date.now()}` };
};

const sendTeamsMessage = async (transport: Transport, notification: Notification) => {
  const { webhookUrl } = transport.config;
  const { title, description, status } = notification.payload;

  const teamsCard = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7",
    "summary": `${notification.event_type}: ${title}`,
    "sections": [{
      "activityTitle": `${notification.event_type.toUpperCase()}`,
      "activitySubtitle": title,
      "text": description,
      "facts": [
        { "name": "Status", "value": status },
        { "name": "Event", "value": notification.event_type }
      ]
    }]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teamsCard)
  });

  return { success: response.ok, messageId: `teams-${Date.now()}` };
};

const sendAPINotification = async (transport: Transport, notification: Notification) => {
  const { url, method = 'POST', headers = {} } = transport.config;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({
      notification_id: notification.id,
      team_id: notification.team_id,
      event_type: notification.event_type,
      payload: notification.payload,
      timestamp: new Date().toISOString()
    })
  });

  return { success: response.ok, messageId: `api-${Date.now()}` };
};

const dispatchNotification = async (notification: Notification, transport: Transport) => {
  let result;

  try {
    switch (transport.channel) {
      case 'smtp':
        result = await sendSMTPEmail(transport, notification);
        break;
      case 'transactional_email':
        result = await sendTransactionalEmail(transport, notification);
        break;
      case 'slack':
        result = await sendSlackMessage(transport, notification);
        break;
      case 'teams':
        result = await sendTeamsMessage(transport, notification);
        break;
      case 'api':
        result = await sendAPINotification(transport, notification);
        break;
      default:
        throw new Error(`Unsupported channel: ${transport.channel}`);
    }

    if (result.success) {
      await supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      console.log(`Notification ${notification.id} sent successfully via ${transport.channel}`);
      return { success: true };
    } else {
      throw new Error(result.error || 'Failed to send notification');
    }
  } catch (error) {
    console.error(`Failed to send notification ${notification.id}:`, error);
    
    await supabase
      .from('notifications')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', notification.id);

    return { success: false, error: error.message };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get pending notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select(`
        *,
        transport:notification_transports(*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (notificationsError) {
      throw new Error(`Failed to fetch notifications: ${notificationsError.message}`);
    }

    console.log(`Processing ${notifications?.length || 0} pending notifications`);

    const results = [];

    for (const notification of notifications || []) {
      if (!notification.transport) {
        console.error(`No transport found for notification ${notification.id}`);
        continue;
      }

      const result = await dispatchNotification(notification, notification.transport);
      results.push({
        notification_id: notification.id,
        transport_channel: notification.transport.channel,
        ...result
      });

      // Small delay between sends to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in notification dispatcher:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);