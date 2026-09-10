/**
 * SignalR connection manager for WebRTC signaling between candidate and proctor.
 * Uses the ProctorHub at /hubs/proctor with JWT auth via query string.
 */
import * as signalR from "@microsoft/signalr";
import { getBackendBaseUrl } from "@/lib/backend-url.mjs";
import { safeSignalRLogger } from "@/lib/safe-logging";

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
  onExamSubmitted?: (event: {
    fromConnectionId: string;
    fromUserId: string;
    attemptId: number;
  }) => void;
  onWarningReceived?: (event: {
    fromConnectionId: string;
    fromUserId: string;
    message: string;
    attemptId: number;
    isLastWarning?: boolean;
  }) => void;
  onTerminationReceived?: (event: {
    fromConnectionId: string;
    fromUserId: string;
    reason: string;
    attemptId: number;
  }) => void;
  onViolationEventReceived?: (event: {
    id: number;
    attemptId: number;
    eventType: string;
    eventTypeId: number;
    metadataJson: string;
    occurredAt: string;
    severity: string;
  }) => void;
  onTimeExtended?: (event: {
    attemptId: number;
    extraMinutes: number;
    newRemainingSeconds: number;
    message: string;
  }) => void;
  onAttemptExpired?: (event: {
    attemptId: number;
    eventType: string;
    reason: string;
    message: string;
  }) => void;
  // Screen share signaling callbacks
  onScreenPeerJoined?: (event: {
    userId: string;
    connectionId: string;
    role: PeerRole;
    attemptId: number;
  }) => void;
  onScreenPeerLeft?: (event: {
    userId: string;
    connectionId: string;
    attemptId: number;
  }) => void;
  onReceiveScreenOffer?: (event: {
    fromConnectionId: string;
    fromUserId: string;
    sdp: string;
    attemptId: number;
  }) => void;
  onReceiveScreenAnswer?: (event: {
    fromConnectionId: string;
    fromUserId: string;
    sdp: string;
    attemptId: number;
  }) => void;
  onReceiveScreenIceCandidate?: (event: {
    fromConnectionId: string;
    candidate: string;
    attemptId: number;
  }) => void;
  onScreenShareStatusChanged?: (event: {
    fromConnectionId: string;
    fromUserId: string;
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
  private joinedScreenRoom = false;

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

    console.log(
      `%c[SignalR] Connecting as ${this.role} for attempt ${this.attemptId}...`,
      "color: #00bcd4; font-weight: bold",
    );

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      console.error(`[SignalR] No auth_token in localStorage! Cannot connect.`);
      throw new Error("No auth token available");
    }

    // Build hub URL — go through Next.js proxy is not needed for SignalR,
    // connect directly to backend
    const backendUrl = this.getBackendUrl();
    const hubUrl = `${backendUrl}/hubs/proctor`;

    // On localhost: skip negotiate, pure WebSockets (fastest dev experience, no round-trip).
    // In production: WebSockets first, SSE as fallback — LongPolling is excluded because it
    // introduces 1–30 s polling latency which causes the "slow notification" issue.
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        ...(isLocalhost
          ? {
              skipNegotiation: true,
              transport: signalR.HttpTransportType.WebSockets,
            }
          : {
              // Production: prefer WebSockets, allow SSE as fallback.
              // Both are server-push — no polling delay.
              transport:
                signalR.HttpTransportType.WebSockets |
                signalR.HttpTransportType.ServerSentEvents,
            }),
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
      .configureLogging(safeSignalRLogger)
      .build();
    console.log(`[SignalR] HubConnection built, starting...`);

    // Register event handlers
    this.connection.on("PeerJoined", (event: PeerJoinedEvent) => {
      console.log("[SignalR] PeerJoined");
      this.callbacks.onPeerJoined?.(event);
    });

    this.connection.on("PeerLeft", (event) => {
      console.log("[SignalR] PeerLeft");
      this.callbacks.onPeerLeft?.(event);
    });

    this.connection.on("ReceiveOffer", (event) => {
      console.log("[SignalR] ReceiveOffer");
      this.callbacks.onReceiveOffer?.(event);
    });

    this.connection.on("ReceiveAnswer", (event) => {
      console.log("[SignalR] ReceiveAnswer");
      this.callbacks.onReceiveAnswer?.(event);
    });

    this.connection.on("ReceiveIceCandidate", (event) => {
      console.log("[SignalR] ReceiveIceCandidate");
      this.callbacks.onReceiveIceCandidate?.(event);
    });

    this.connection.on("ExamSubmitted", (event) => {
      console.log(
        `%c[SignalR] ExamSubmitted by candidate for attempt ${event.attemptId}`,
        "color: #ff5722; font-weight: bold",
      );
      this.callbacks.onExamSubmitted?.(event);
    });

    this.connection.on("ReceiveWarning", (event) => {
      console.log("[SignalR] ReceiveWarning");
      this.callbacks.onWarningReceived?.(event);
    });

    this.connection.on("SessionTerminated", (event) => {
      console.log("[SignalR] SessionTerminated");
      this.callbacks.onTerminationReceived?.(event);
    });

    // Auto-termination warning from backend (different from manual proctor "ReceiveWarning")
    this.connection.on("ProctorWarning", (event) => {
      console.log("[SignalR] ProctorWarning");
      this.callbacks.onWarningReceived?.({
        fromConnectionId: "",
        fromUserId: "system",
        message: event.message,
        attemptId: this.attemptId,
        isLastWarning: event.isLastWarning ?? false,
      });
    });

    // Auto-termination from backend (different from manual proctor "SessionTerminated")
    this.connection.on("ExamTerminated", (event) => {
      console.log("[SignalR] ExamTerminated");
      this.callbacks.onTerminationReceived?.({
        fromConnectionId: "",
        fromUserId: "system",
        reason: event.reason,
        attemptId: this.attemptId,
      });
    });

    this.connection.on("RenegotiationRequested", (event) => {
      console.log("[SignalR] RenegotiationRequested");
      this.callbacks.onRenegotiationRequested?.(event);
    });

    this.connection.on("ConnectionStatusChanged", (event) => {
      console.log("[SignalR] ConnectionStatusChanged");
      this.callbacks.onConnectionStatusChanged?.(event);
    });

    this.connection.on("ViolationEventReceived", (event) => {
      console.log("[SignalR] ViolationEventReceived");
      this.callbacks.onViolationEventReceived?.(event);
    });

    this.connection.on("TimeExtended", (event) => {
      console.log(
        `%c[SignalR] TimeExtended: +${event.extraMinutes}min, remaining=${event.newRemainingSeconds}s`,
        "color: #4caf50; font-weight: bold",
      );
      this.callbacks.onTimeExtended?.(event);
    });

    this.connection.on("AttemptExpired", (event) => {
      console.log("[SignalR] AttemptExpired");
      this.callbacks.onAttemptExpired?.(event);
    });

    // Screen share signaling events
    this.connection.on("ScreenPeerJoined", (event) => {
      console.log("[SignalR] ScreenPeerJoined");
      this.callbacks.onScreenPeerJoined?.(event);
    });

    this.connection.on("ScreenPeerLeft", (event) => {
      console.log("[SignalR] ScreenPeerLeft");
      this.callbacks.onScreenPeerLeft?.(event);
    });

    this.connection.on("ReceiveScreenOffer", (event) => {
      console.log("[SignalR] ReceiveScreenOffer");
      this.callbacks.onReceiveScreenOffer?.(event);
    });

    this.connection.on("ReceiveScreenAnswer", (event) => {
      console.log("[SignalR] ReceiveScreenAnswer");
      this.callbacks.onReceiveScreenAnswer?.(event);
    });

    this.connection.on("ReceiveScreenIceCandidate", (event) => {
      console.log("[SignalR] ReceiveScreenIceCandidate");
      this.callbacks.onReceiveScreenIceCandidate?.(event);
    });

    this.connection.on("ScreenShareStatusChanged", (event) => {
      console.log("[SignalR] ScreenShareStatusChanged");
      this.callbacks.onScreenShareStatusChanged?.(event);
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
        // Rejoin screen room if we were in it
        if (this.joinedScreenRoom) {
          await this.connection?.invoke(
            "JoinScreenRoom",
            this.attemptId,
            this.role,
          );
        }
      } catch (e) {
        console.error("[SignalR] Failed to rejoin room");
      }
      this.callbacks.onReconnected?.();
    });

    this.connection.onclose((error) => {
      console.log("[SignalR] Disconnected");
      this.callbacks.onDisconnected?.(error);
    });

    // Start connection
    try {
      await this.connection.start();
      console.log(
        `%c[SignalR] ✅ Connected to ProctorHub as ${this.role}`,
        "color: #4caf50; font-weight: bold",
      );
    } catch (err) {
      console.error(
        `%c[SignalR] ❌ Failed to start connection!`,
        "color: red; font-weight: bold",
      );
      throw err;
    }

    // Join the attempt room
    await this.connection.invoke("JoinAttemptRoom", this.attemptId, this.role);
    console.log(
      `%c[SignalR] ✅ Joined room attempt_${this.attemptId} as ${this.role}`,
      "color: #4caf50; font-weight: bold",
    );
  }

  private getBackendUrl(): string {
    const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (envUrl) return getBackendBaseUrl(envUrl);
    if (typeof window === "undefined") return "http://localhost:5221";
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
    console.log(
      `[SignalR] Sending SDP offer for attempt ${this.attemptId} (${sdp.length} chars)`,
    );
    await this.connection?.invoke("SendOffer", this.attemptId, sdp);
    console.log(`[SignalR] ✅ Offer sent`);
  }

  async sendAnswer(sdp: string, targetConnectionId: string): Promise<void> {
    console.log("[SignalR] Sending SDP answer");
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
    console.log("[SignalR] Sending ICE candidate");
    await this.connection?.invoke(
      "SendIceCandidate",
      this.attemptId,
      candidate,
      targetConnectionId ?? null,
    );
  }

  async requestRenegotiation(): Promise<void> {
    console.log(
      `[SignalR] Requesting renegotiation for attempt ${this.attemptId}`,
    );
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

  async notifyExamSubmitted(): Promise<void> {
    console.log(
      `[SignalR] Notifying exam submitted for attempt ${this.attemptId}`,
    );
    await this.connection?.invoke("NotifyExamSubmitted", this.attemptId);
    console.log(`[SignalR] \u2705 Exam submitted notification sent`);
  }

  async sendWarningToCandidate(message: string): Promise<void> {
    console.log(
      `[SignalR] Sending warning to candidate for attempt ${this.attemptId}`,
    );
    await this.connection?.invoke(
      "SendWarningToCandidate",
      this.attemptId,
      message,
    );
    console.log(`[SignalR] \u2705 Warning sent to candidate`);
  }

  async sendTerminationToCandidate(reason: string): Promise<void> {
    console.log(
      `[SignalR] Sending termination to candidate for attempt ${this.attemptId}`,
    );
    await this.connection?.invoke(
      "SendTerminationToCandidate",
      this.attemptId,
      reason,
    );
    console.log(`[SignalR] \u2705 Termination sent to candidate`);
  }

  // ── Screen share signaling methods ──────────────────────────────

  /**
   * Connect to the hub (if not connected) and join the screen signaling room.
   * Used by ScreenSharePublisher and ScreenShareViewer.
   */
  async connectScreenRoom(): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      await this.connect();
    }
    await this.connection?.invoke("JoinScreenRoom", this.attemptId, this.role);
    this.joinedScreenRoom = true;
    console.log(
      `%c[SignalR] ✅ Joined screen room attempt_${this.attemptId}_screen as ${this.role}`,
      "color: #4caf50; font-weight: bold",
    );
  }

  async disconnectScreenRoom(): Promise<void> {
    if (this.joinedScreenRoom && this.connection) {
      try {
        await this.connection.invoke("LeaveScreenRoom", this.attemptId);
      } catch {
        // ignore
      }
      this.joinedScreenRoom = false;
    }
  }

  async sendScreenOffer(sdp: string): Promise<void> {
    await this.connection?.invoke("SendScreenOffer", this.attemptId, sdp);
  }

  async sendScreenAnswer(
    sdp: string,
    targetConnectionId: string,
  ): Promise<void> {
    await this.connection?.invoke(
      "SendScreenAnswer",
      this.attemptId,
      sdp,
      targetConnectionId,
    );
  }

  async sendScreenIceCandidate(
    candidate: string,
    targetConnectionId?: string,
  ): Promise<void> {
    await this.connection?.invoke(
      "SendScreenIceCandidate",
      this.attemptId,
      candidate,
      targetConnectionId ?? null,
    );
  }

  async notifyScreenShareStatus(status: string): Promise<void> {
    await this.connection?.invoke(
      "NotifyScreenShareStatus",
      this.attemptId,
      status,
    );
  }

  async disconnect(): Promise<void> {
    this.disposed = true;
    if (this.connection) {
      try {
        if (this.joinedScreenRoom) {
          await this.connection.invoke("LeaveScreenRoom", this.attemptId);
        }
        await this.connection.invoke("LeaveAttemptRoom", this.attemptId);
      } catch {
        // ignore - may already be disconnected
      }
      this.joinedScreenRoom = false;
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
