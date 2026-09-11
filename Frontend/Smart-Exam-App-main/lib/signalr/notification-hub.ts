/**
 * Lightweight SignalR client for in-app notifications.
 * Connects to NotificationHub at /hubs/notifications.
 * Server pushes "ReceiveNotification" events to the connected user's group.
 */
import * as signalR from "@microsoft/signalr";
import type { UserNotificationDto } from "@/lib/api/user-notifications";
import { getBackendBaseUrl } from "@/lib/backend-url.mjs";
import { safeSignalRLogger } from "@/lib/safe-logging";

type NotificationHandler = (notification: UserNotificationDto) => void;

export class NotificationHubClient {
  private connection: signalR.HubConnection | null = null;
  private onReceive: NotificationHandler | null = null;
  private onConnected: (() => void) | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  /** Start the connection. Resolves when connected. */
  async connect(onReceive: NotificationHandler, onConnected?: () => void): Promise<void> {
    if (this.connection) return; // already connected

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return; // unauthenticated — no-op

    this.onReceive = onReceive;
    this.onConnected = onConnected ?? null;

    const backendUrl = this.getBackendUrl();
    const hubUrl = `${backendUrl}/hubs/notifications`;

    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem("auth_token") ?? "",
        ...(isLocalhost
          ? { skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets }
          : { transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents }),
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(safeSignalRLogger)
      .build();

    this.connection.on("ReceiveNotification", (notification: UserNotificationDto) => {
      this.onReceive?.(notification);
    });
    const connection = this.connection;
    connection.onreconnected(() => {
      if (this.connection === connection) this.onConnected?.();
    });
    connection.onclose(() => this.scheduleRetry(connection));

    await this.start(connection);
  }

  private async start(connection: signalR.HubConnection): Promise<void> {
    try {
      await connection.start();
      if (this.connection === connection) this.onConnected?.();
    } catch {
      // Automatic reconnect does not cover initial start failures or exhausted retries.
      this.scheduleRetry(connection);
    }
  }

  private scheduleRetry(connection: signalR.HubConnection): void {
    if (this.connection !== connection || this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.connection === connection && localStorage.getItem("auth_token")) {
        void this.start(connection);
      }
    }, 30000);
  }

  /** Disconnect and clean up. */
  async disconnect(): Promise<void> {
    const connection = this.connection;
    this.connection = null;
    this.onReceive = null;
    this.onConnected = null;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    if (connection) await connection.stop();
  }

  private getBackendUrl(): string {
    const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (envUrl) return getBackendBaseUrl(envUrl);
    if (typeof window === "undefined") return "http://localhost:5221";
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5221";
    }
    return window.location.origin;
  }
}
