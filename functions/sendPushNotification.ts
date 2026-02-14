import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import webpush from 'npm:web-push@3.6.7';

// VAPID keys - should be set as environment variables
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = 'mailto:support@family-app.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, icon, data, url } = await req.json();

    // Get user notification preferences
    const preferences = await base44.entities.NotificationPreferences.list();
    const userPref = preferences.find(p => p.created_by === user.email);

    if (!userPref || !userPref.push_enabled || !userPref.subscription) {
      return Response.json({ 
        success: false, 
        message: 'Push notifications not enabled or subscription not found' 
      });
    }

    // Check quiet hours
    if (userPref.quiet_hours_enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = userPref.quiet_hours_start.split(':').map(Number);
      const [endH, endM] = userPref.quiet_hours_end.split(':').map(Number);
      const quietStart = startH * 60 + startM;
      const quietEnd = endH * 60 + endM;

      // Handle overnight quiet hours
      if (quietStart > quietEnd) {
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          return Response.json({ 
            success: false, 
            message: 'Quiet hours active' 
          });
        }
      } else {
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          return Response.json({ 
            success: false, 
            message: 'Quiet hours active' 
          });
        }
      }
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/logo.png',
      badge: '/badge.png',
      data: data || {},
      url: url || '/'
    });

    await webpush.sendNotification(userPref.subscription, payload);

    return Response.json({ success: true });

  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});