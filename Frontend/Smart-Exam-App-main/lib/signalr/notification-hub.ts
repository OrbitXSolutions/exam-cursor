/**
 * Lightweight SignalR client for in-app notifications.
 * Connects to NotificationHub at /hubs/notifications.
 * Server pushes "ReceiveNotification" events to the connected user's group.
 */
import * as signalR from "@microsoft/signalr";
import type { UserNotificationDto } from "@/lib/api/user-notifications";

type NotificationHandler = (notification: UserNotificationDto) => void;

export class NotificationHubClient {
  private connection: signalR.HubConnection | null = null;
  private onReceive: NotificationHandler | null = null;

  /** Start the connection. Resolves when connected. */
  async connect(onReceive: NotificationHandler): Promise<void> {
    if (this.connection) return; // already connected

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return; // unauthenticated — no-op

    this.onReceive = onReceive;

    const backendUrl = this.getBackendUrl();
    const hubUrl = `${backendUrl}/hubs/notifications`;

    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        ...(isLocalhost
          ? { skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets }
          : { transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents }),
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on("ReceiveNotification", (notification: UserNotificationDto) => {
      this.onReceive?.(notification);
    });

    try {
      await this.connection.start();
    } catch {
      // Non-critical — real-time won't work but REST polling still functions
      this.connection = null;
    }
  }

  /** Disconnect and clean up. */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
    this.onReceive = null;
  }

  private getBackendUrl(): string {
    if (typeof window === "undefined") return "http://localhost:5221";
    const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (envUrl) return envUrl.replace(/\/+$/, "").replace(/\/api\/?$/, "");
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5221";
    }
    return window.location.origin;
  }
}
