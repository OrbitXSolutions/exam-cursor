"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getUnreadCount } from "@/lib/api/user-notifications";
import { NotificationHubClient } from "@/lib/signalr/notification-hub";
import type { UserNotificationDto } from "@/lib/api/user-notifications";

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const hubRef = useRef<NotificationHubClient | null>(null);
  const mountedRef = useRef(true);

  const refreshCount = useCallback(async () => {
    try {
      const { count } = await getUnreadCount();
      if (mountedRef.current) setUnreadCount(count);
    } catch {
      // silently ignore — bell badge is non-critical
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Fetch initial unread count
    refreshCount();

    // Connect SignalR for real-time push
    const hub = new NotificationHubClient();
    hubRef.current = hub;

    hub.connect((notification: UserNotificationDto) => {
      if (mountedRef.current && !notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      mountedRef.current = false;
      hub.disconnect();
      hubRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { unreadCount, setUnreadCount, refreshCount };
}
