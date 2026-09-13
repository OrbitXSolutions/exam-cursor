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
  const countRequestRef = useRef(0);

  const refreshCount = useCallback(async () => {
    const request = ++countRequestRef.current;
    try {
      const { count } = await getUnreadCount();
      if (mountedRef.current && request === countRequestRef.current)
        setUnreadCount(count);
    } catch {
      // silently ignore — bell badge is non-critical
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    // Fetch initial unread count
    queueMicrotask(() => {
      if (active) void refreshCount();
    });

    // Connect SignalR for real-time push
    const hub = new NotificationHubClient();
    hubRef.current = hub;

    // REST is authoritative: replayed pushes and events missed offline must not skew the badge.
    void hub.connect(
      () => {
        void refreshCount();
      },
      () => {
        void refreshCount();
      },
    );
    const poll = setInterval(() => {
      void refreshCount();
    }, 30000);

    return () => {
      active = false;
      mountedRef.current = false;
      countRequestRef.current++;
      clearInterval(poll);
      void hub.disconnect();
      hubRef.current = null;
    };
  }, [refreshCount]);

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

  useEffect(() => {
    callbackRef.current = onSessionChange;
  }, [onSessionChange]);

  useEffect(() => {
    const hub = new NotificationHubClient();
    hubRef.current = hub;

    void hub.connect(
      (notification: UserNotificationDto) => {
        if (EXAM_SESSION_TYPES.has(notification.type)) {
          callbackRef.current();
        }
      },
      () => callbackRef.current(),
    );

    return () => {
      void hub.disconnect();
      hubRef.current = null;
    };
  }, []);
}
