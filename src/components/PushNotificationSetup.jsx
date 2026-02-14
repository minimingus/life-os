import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// VAPID public key - should match the one used in the backend
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

export default function PushNotificationSetup() {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreferences.list();
      return prefs[0] || null;
    }
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return await base44.entities.NotificationPreferences.update(id, data);
      } else {
        return await base44.entities.NotificationPreferences.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences']);
    }
  });

  const enablePushNotifications = async () => {
    if (!isSupported) {
      toast.error('הדפדפן שלך לא תומך בהתראות דחיפה');
      return;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast.error('יש לאשר הרשאות כדי לקבל התראות');
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save subscription to database
      await updatePrefsMutation.mutateAsync({
        id: preferences?.id,
        data: {
          ...preferences,
          push_enabled: true,
          subscription: subscription.toJSON()
        }
      });

      toast.success('התראות דחיפה הופעלו בהצלחה! 🔔');

    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('שגיאה בהפעלת התראות דחיפה');
    }
  };

  const disablePushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      await updatePrefsMutation.mutateAsync({
        id: preferences?.id,
        data: {
          ...preferences,
          push_enabled: false,
          subscription: null
        }
      });

      toast.success('התראות דחיפה הושבתו');

    } catch (error) {
      console.error('Error disabling push notifications:', error);
      toast.error('שגיאה בהשבתת התראות');
    }
  };

  const sendTestNotification = async () => {
    try {
      await base44.functions.invoke('sendPushNotification', {
        title: '🔔 התראת בדיקה',
        body: 'זוהי התראה לבדיקת המערכת. אם אתה רואה את זה, הכל עובד!',
        icon: '/logo.png'
      });
      toast.success('התראת בדיקה נשלחה');
    } catch (error) {
      toast.error('שגיאה בשליחת התראת בדיקה');
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                הדפדפן לא תומך בהתראות דחיפה
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                נסה להשתמש בדפדפן מודרני יותר כמו Chrome, Firefox או Safari
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEnabled = preferences?.push_enabled && permission === 'granted';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEnabled ? (
              <Bell className="w-5 h-5 text-green-500" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-400" />
            )}
            <CardTitle className="text-base">התראות דחיפה</CardTitle>
          </div>
          {isEnabled && (
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              <span>פעיל</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          קבל התראות על אירועים חשובים ישירות למכשיר שלך, גם כשהאפליקציה סגורה
        </p>

        {isEnabled ? (
          <div className="space-y-3">
            <Button
              onClick={sendTestNotification}
              variant="outline"
              className="w-full"
            >
              שלח התראת בדיקה
            </Button>
            <Button
              onClick={disablePushNotifications}
              variant="outline"
              className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <BellOff className="w-4 h-4 ml-2" />
              השבת התראות דחיפה
            </Button>
          </div>
        ) : (
          <Button
            onClick={enablePushNotifications}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Bell className="w-4 h-4 ml-2" />
            הפעל התראות דחיפה
          </Button>
        )}

        {permission === 'denied' && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              ההרשאות להתראות נחסמו. יש לאפשר אותן בהגדרות הדפדפן
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}