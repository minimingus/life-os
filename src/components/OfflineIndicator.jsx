import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { offlineSync } from "../utils/offlineSync";
import { offlineStorage } from "../utils/offlineStorage";
import { cn } from "@/lib/utils";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const updatePendingCount = async () => {
      const ops = await offlineStorage.getPendingOperations();
      setPendingCount(ops.length);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 2000);

    const unsubscribe = offlineSync.addListener((event) => {
      if (event.type === 'sync-start') {
        setSyncing(true);
      } else if (event.type === 'sync-complete') {
        setSyncing(false);
        updatePendingCount();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium",
        isOnline 
          ? "bg-blue-500 text-white" 
          : "bg-slate-800 text-white"
      )}
    >
      {syncing ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : isOnline ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      
      <span>
        {syncing 
          ? "מסנכרן..." 
          : isOnline 
            ? `${pendingCount} שינויים ממתינים` 
            : "מצב לא מקוון"
        }
      </span>
    </div>
  );
}