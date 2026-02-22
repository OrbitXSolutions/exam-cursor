/**
 * SignalR connection manager for WebRTC signaling between candidate and proctor.
 * Uses the ProctorHub at /hubs/proctor with JWT auth via query string.
 */
import * as signalR from "@microsoft/signalr";

export type PeerRole = "candidate" | "proctor";

export interface PeerJoinedEvent {
  userId: string;
  connectionId: string;
  role: PeerRole;
  attemptId: number;
}

export interface SignalingCallbacks {
  onPeerJoined?: (event: PeerJoinedEvent) => void;
  onPeerLeft?: (event: {
    userId: string;
    connectionId: string;
    attemptId: number;
  }) => void;
  onReceiveOffer?: (event: {
    fromConnectionId: string;
    fromUserId: string;
    sdp: string;
    attemptId: number;
  }) => void;
  onReceiveAnswer?: (event: {
    fromConnectionId: string;
    fromUserId: string;
    sdp: string;
    attemptId: number;
  }) => void;
  onReceiveIceCandidate?: (event: {
    fromConnectionId: string;
    candidate: string;
    attemptId: number;
  }) => void;
  onRenegotiationRequested?: (event: {
    fromConnectionId: string;
    attemptId: number;
  }) => void;
  onConnectionStatusChanged?: (event: {
    fromConnectionId: string;
    status: string;
    attemptId: number;
  }) => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
  onDisconnected?: (error?: Error) => void;
}

export class ProctorSignaling {
  private connection: signalR.HubConnection | null = null;
  private callbacks: SignalingCallbacks;
  private attemptId: number;
  private role: PeerRole;
  private disposed = false;

  constructor(
    attemptId: number,
    role: PeerRole,
    callbacks: SignalingCallbacks,
  ) {
    this.attemptId = attemptId;
    this.role = role;
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    if (this.disposed) return;

    console.log(`%c[SignalR] Connecting as ${this.role} for attempt ${this.attemptId}...`, 'color: #00bcd4; font-weight: bold');

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      console.error(`[SignalR] No auth_token in localStorage! Cannot connect.`);
      throw new Error("No auth token available");
    }
    console.log(`[SignalR] Token found (${token.substring(0, 20)}...)`);

    // Build hub URL — go through Next.js proxy is not needed for SignalR,
    // connect directly to backend
    const backendUrl = this.getBackendUrl();
    const hubUrl = `${backendUrl}/hubs/proctor?access_token=${encodeURIComponent(token)}`;
    console.log(`[SignalR] Hub URL: ${backendUrl}/hubs/proctor`);

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();
    console.log(`[SignalR] HubConnection built, starting...`);

    // Register event handlers
    this.connection.on("PeerJoined", (event: PeerJoinedEvent) => {
      console.log("[SignalR] PeerJoined:", event);
      this.callbacks.onPeerJoined?.(event);
    });

    this.connection.on("PeerLeft", (event) => {
      console.log("[SignalR] PeerLeft:", event);
      this.callbacks.onPeerLeft?.(event);
    });

    this.connection.on("ReceiveOffer", (event) => {
      console.log("[SignalR] ReceiveOffer from:", event.fromConnectionId);
      this.callbacks.onReceiveOffer?.(event);
    });

    this.connection.on("ReceiveAnswer", (event) => {
      console.log("[SignalR] ReceiveAnswer from:", event.fromConnectionId);
      this.callbacks.onReceiveAnswer?.(event);
    });

    this.connection.on("ReceiveIceCandidate", (event) => {
      console.log(`[SignalR] ReceiveIceCandidate from: ${event.fromConnectionId}`);
      this.callbacks.onReceiveIceCandidate?.(event);
    });

    this.connection.on("RenegotiationRequested", (event) => {
      console.log("[SignalR] RenegotiationRequested");
      this.callbacks.onRenegotiationRequested?.(event);
    });

    this.connection.on("ConnectionStatusChanged", (event) => {
      console.log("[SignalR] ConnectionStatusChanged:", event.status);
      this.callbacks.onConnectionStatusChanged?.(event);
    });

    this.connection.onreconnecting(() => {
      console.log("[SignalR] Reconnecting...");
      this.callbacks.onReconnecting?.();
    });

    this.connection.onreconnected(async () => {
      console.log("[SignalR] Reconnected, rejoining room...");
      try {
        await this.connection?.invoke(
          "JoinAttemptRoom",
          this.attemptId,
          this.role,
        );
      } catch (e) {
        console.error("[SignalR] Failed to rejoin room:", e);
      }
      this.callbacks.onReconnected?.();
    });

    this.connection.onclose((error) => {
      console.log("[SignalR] Disconnected:", error);
      this.callbacks.onDisconnected?.(error);
    });

    // Start connection
    try {
      await this.connection.start();
      console.log(`%c[SignalR] ✅ Connected to ProctorHub as ${this.role}`, 'color: #4caf50; font-weight: bold');
    } catch (err) {
      console.error(`%c[SignalR] ❌ Failed to start connection!`, 'color: red; font-weight: bold', err);
      throw err;
    }

    // Join the attempt room
    await this.connection.invoke("JoinAttemptRoom", this.attemptId, this.role);
    console.log(
      `%c[SignalR] ✅ Joined room attempt_${this.attemptId} as ${this.role}`, 'color: #4caf50; font-weight: bold',
    );
  }

  private getBackendUrl(): string {
    if (typeof window === "undefined") return "http://localhost:5221";
    // In production, the backend runs on the same host or a configured URL
    // Check for env variable first
    const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (envUrl) return envUrl.replace(/\/+$/, "");
    // Default: same origin (assumes reverse proxy) or localhost for dev
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:5221";
    }
    return window.location.origin;
  }

  async sendOffer(sdp: string): Promise<void> {
    console.log(`[SignalR] Sending SDP offer for attempt ${this.attemptId} (${sdp.length} chars)`);
    await this.connection?.invoke("SendOffer", this.attemptId, sdp);
    console.log(`[SignalR] ✅ Offer sent`);
  }

  async sendAnswer(sdp: string, targetConnectionId: string): Promise<void> {
    console.log(`[SignalR] Sending SDP answer to ${targetConnectionId} (${sdp.length} chars)`);
    await this.connection?.invoke(
      "SendAnswer",
      this.attemptId,
      sdp,
      targetConnectionId,
    );
    console.log(`[SignalR] ✅ Answer sent`);
  }

  async sendIceCandidate(
    candidate: string,
    targetConnectionId?: string,
  ): Promise<void> {
    console.log(`[SignalR] Sending ICE candidate (target=${targetConnectionId ?? 'broadcast'})`);
    await this.connection?.invoke(
      "SendIceCandidate",
      this.attemptId,
      candidate,
      targetConnectionId ?? null,
    );
  }

  async requestRenegotiation(): Promise<void> {
    console.log(`[SignalR] Requesting renegotiation for attempt ${this.attemptId}`);
    await this.connection?.invoke("RequestRenegotiation", this.attemptId);
    console.log(`[SignalR] ✅ Renegotiation requested`);
  }

  async notifyConnectionStatus(
    status: "connected" | "reconnecting" | "disconnected",
  ): Promise<void> {
    await this.connection?.invoke(
      "NotifyConnectionStatus",
      this.attemptId,
      status,
    );
  }

  async disconnect(): Promise<void> {
    this.disposed = true;
    if (this.connection) {
      try {
        await this.connection.invoke("LeaveAttemptRoom", this.attemptId);
      } catch {
        // ignore - may already be disconnected
      }
      try {
        await this.connection.stop();
      } catch {
        // ignore
      }
      this.connection = null;
    }
  }

  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  get state(): signalR.HubConnectionState | null {
    return this.connection?.state ?? null;
  }
}
