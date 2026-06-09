"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getUnreadCount } from "@/lib/api/user-notifications";
import { NotificationHubClient } from "@/lib/signalr/notification-hub";
import type { UserNotificationDto } from "@/lib/api/user-notifications";

// Notification types that indicate exam session activity
const EXAM_SESSION_TYPES = new Set([4, 5]); // CandidateStartedExam=4, CandidateSubmittedExam=5

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

/**
 * Hook for the Proctor Center page.
 * Opens a dedicated SignalR connection and calls `onSessionChange` whenever
 * a CandidateStartedExam (type 4) or CandidateSubmittedExam (type 5)
 * notification is received — so the page can reload sessions immediately
 * instead of waiting for the 30-second polling interval.
 */
export function useProctorSessionRefresh(onSessionChange: () => void) {
  const hubRef = useRef<NotificationHubClient | null>(null);
  const callbackRef = useRef(onSessionChange);
  callbackRef.current = onSessionChange; // always latest without re-subscribing

  useEffect(() => {
    const hub = new NotificationHubClient();
    hubRef.current = hub;

    hub.connect((notification: UserNotificationDto) => {
      if (EXAM_SESSION_TYPES.has(notification.type)) {
        callbackRef.current();
      }
    });

    return () => {
      hub.disconnect();
      hubRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
