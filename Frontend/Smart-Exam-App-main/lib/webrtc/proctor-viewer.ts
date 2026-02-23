/**
 * WebRTC viewer for proctor side.
 * Connects via SignalR signaling to receive the candidate's webcam stream.
 * View-only — proctor does not publish any media.
 */
import { ProctorSignaling } from "@/lib/signalr/proctor-signaling";
import { getVideoConfig, buildRtcConfig } from "@/lib/webrtc/video-config";

// RTC_CONFIG is built dynamically from server config
let _rtcConfig: RTCConfiguration = { iceServers: [] };

export type ViewerStatus = "connecting" | "live" | "reconnecting" | "offline";

export interface ProctorViewerCallbacks {
  onStatusChange?: (status: ViewerStatus) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onExamSubmitted?: (attemptId: number) => void;
  onAttemptExpired?: (event: {
    attemptId: number;
    eventType: string;
    reason: string;
  }) => void;
  onSignalRStatusChange?: (connected: boolean) => void;
  onViolationEventReceived?: (event: {
    id: number;
    attemptId: number;
    eventType: string;
    eventTypeId: number;
    metadataJson: string;
    occurredAt: string;
    severity: string;
  }) => void;
}

export class ProctorViewer {
  private signaling: ProctorSignaling | null = null;
  private pc: RTCPeerConnection | null = null;
  private attemptId: number;
  private status: ViewerStatus = "connecting";
  private callbacks: ProctorViewerCallbacks;
  private disposed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private candidateConnectionId: string | null = null;
  private pendingIceCandidates: string[] = [];

  /** Expose signaling for sending warnings via SignalR */
  get signalingConnection(): ProctorSignaling | null {
    return this.signaling;
  }

  constructor(attemptId: number, callbacks: ProctorViewerCallbacks = {}) {
    this.attemptId = attemptId;
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    if (this.disposed) return;

    console.log(
      `%c[WebRTC Viewer] Starting connect for attempt ${this.attemptId}`,
      "color: #e91e63; font-weight: bold",
    );
    this.setStatus("connecting");

    try {
      // Load STUN config from server
      const config = await getVideoConfig();
      console.log("[WebRTC Viewer] Video config:", JSON.stringify(config));
      _rtcConfig = buildRtcConfig(config);
      console.log("[WebRTC Viewer] RTC config:", JSON.stringify(_rtcConfig));

      this.signaling = new ProctorSignaling(this.attemptId, "proctor", {
        onPeerJoined: (event) => {
          console.log(
            `%c[WebRTC Viewer] PeerJoined event: role=${event.role}, connId=${event.connectionId}`,
            "color: #ff9800; font-weight: bold",
          );
          if (event.role === "candidate") {
            console.log(
              `%c[WebRTC Viewer] ✅ Candidate joined! connId=${event.connectionId}`,
              "color: #4caf50; font-weight: bold",
            );
            this.candidateConnectionId = event.connectionId;
            // The candidate joined AFTER the proctor, so it won't receive a
            // PeerJoined(proctor) event. Ask it to send an offer once its
            // PeerConnection is ready (~2 s grace period).
            setTimeout(() => {
              if (!this.disposed && this.signaling?.isConnected && !this.pc) {
                console.log(
                  "[WebRTC Viewer] Requesting renegotiation from candidate...",
                );
                this.signaling
                  .requestRenegotiation()
                  .catch((e) =>
                    console.warn(
                      "[WebRTC Viewer] renegotiation request failed:",
                      e,
                    ),
                  );
              }
            }, 2000);
          }
        },
        onPeerLeft: (event) => {
          console.log("[WebRTC Viewer] Candidate left");
          this.candidateConnectionId = null;
          this.setStatus("offline");
        },
        onReceiveOffer: async (event) => {
          console.log(
            `%c[WebRTC Viewer] ✅ Received SDP offer from candidate (connId=${event.fromConnectionId}, ${event.sdp?.length} chars)`,
            "color: #4caf50; font-weight: bold",
          );
          this.candidateConnectionId = event.fromConnectionId;
          await this.handleOffer(event.sdp, event.fromConnectionId);
        },
        onReceiveIceCandidate: async (event) => {
          try {
            if (this.pc && this.pc.remoteDescription) {
              const candidate = JSON.parse(event.candidate);
              await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              // Queue candidates until remote description is set
              this.pendingIceCandidates.push(event.candidate);
            }
          } catch (error) {
            console.error("[WebRTC Viewer] Error adding ICE candidate:", error);
          }
        },
        onConnectionStatusChanged: (event) => {
          console.log("[WebRTC Viewer] Candidate status:", event.status);
          if (event.status === "disconnected") {
            this.setStatus("offline");
          } else if (event.status === "reconnecting") {
            this.setStatus("reconnecting");
          }
        },
        onReconnecting: () => {
          this.setStatus("reconnecting");
          this.callbacks.onSignalRStatusChange?.(false);
        },
        onReconnected: async () => {
          console.log("[WebRTC Viewer] SignalR reconnected");
          this.callbacks.onSignalRStatusChange?.(true);
          // Request candidate to resend offer
          try {
            await this.signaling?.requestRenegotiation();
          } catch (e) {
            console.error("[WebRTC Viewer] Renegotiation request failed:", e);
          }
        },
        onDisconnected: () => {
          if (!this.disposed) {
            this.callbacks.onSignalRStatusChange?.(false);
            this.setStatus("offline");
            this.attemptReconnect();
          }
        },
        onViolationEventReceived: (event) => {
          console.log(
            `%c[WebRTC Viewer] Violation event: ${event.eventType} (severity=${event.severity})`,
            "color: #ff5722; font-weight: bold",
          );
          this.callbacks.onViolationEventReceived?.(event);
        },
        onExamSubmitted: (event) => {
          console.log(
            `%c[WebRTC Viewer] ExamSubmitted for attempt ${event.attemptId}`,
            "color: #4caf50; font-weight: bold",
          );
          this.callbacks.onExamSubmitted?.(event.attemptId);
        },
        onAttemptExpired: (event) => {
          console.log(
            `%c[WebRTC Viewer] AttemptExpired: reason=${event.reason}`,
            "color: #f44336; font-weight: bold",
          );
          this.callbacks.onAttemptExpired?.(event);
        },
      });

      await this.signaling.connect();
      this.callbacks.onSignalRStatusChange?.(true);
      this.reconnectAttempts = 0;
      console.log(
        `%c[WebRTC Viewer] \u2705 SignalR connected, waiting for candidate offer in room attempt_${this.attemptId}...`,
        "color: #4caf50; font-weight: bold",
      );
    } catch (error) {
      console.error("[WebRTC Viewer] Connect failed:", error);
      this.setStatus("offline");
      if (!this.disposed) {
        this.attemptReconnect();
      }
    }
  }

  private createPeerConnection(): void {
    console.log("[WebRTC Viewer] Creating RTCPeerConnection...");
    if (this.pc) {
      this.pc.close();
    }

    this.pc = new RTCPeerConnection(_rtcConfig);
    this.pendingIceCandidates = [];
    console.log("[WebRTC Viewer] RTCPeerConnection created");

    // Receive remote tracks (candidate's webcam)
    this.pc.ontrack = (event) => {
      console.log("[WebRTC Viewer] Received remote track:", event.track.kind);
      if (event.streams[0]) {
        this.callbacks.onRemoteStream?.(event.streams[0]);
      }
    };

    // ICE candidate handling
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(
          `[WebRTC Viewer] Local ICE candidate: ${event.candidate.candidate.substring(0, 60)}...`,
        );
        this.signaling
          ?.sendIceCandidate(
            JSON.stringify(event.candidate.toJSON()),
            this.candidateConnectionId ?? undefined,
          )
          .catch((e) => console.error("[WebRTC Viewer] Error sending ICE:", e));
      }
    };

    // Connection state monitoring
    this.pc.onicegatheringstatechange = () => {
      console.log(
        `[WebRTC Viewer] ICE gathering state: ${this.pc?.iceGatheringState}`,
      );
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log(
        `[WebRTC Viewer] ICE connection state: ${this.pc?.iceConnectionState}`,
      );
    };

    this.pc.onsignalingstatechange = () => {
      console.log(
        `[WebRTC Viewer] Signaling state: ${this.pc?.signalingState}`,
      );
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log(
        `%c[WebRTC Viewer] Connection state: ${state}`,
        state === "connected"
          ? "color: #4caf50; font-weight: bold"
          : "color: #ff5722; font-weight: bold",
      );
      switch (state) {
        case "connected":
          this.setStatus("live");
          this.reconnectAttempts = 0;
          break;
        case "disconnected":
          this.setStatus("reconnecting");
          setTimeout(() => {
            if (this.pc?.connectionState === "disconnected") {
              this.requestRenegotiation();
            }
          }, 3000);
          break;
        case "failed":
          this.setStatus("reconnecting");
          this.requestRenegotiation();
          break;
        case "closed":
          if (!this.disposed) {
            this.setStatus("offline");
          }
          break;
      }
    };
  }

  private async handleOffer(
    sdp: string,
    fromConnectionId: string,
  ): Promise<void> {
    try {
      console.log(
        `[WebRTC Viewer] Handling offer from ${fromConnectionId} (${sdp.length} chars)...`,
      );
      this.createPeerConnection();

      console.log("[WebRTC Viewer] Setting remote description (offer)...");
      await this.pc!.setRemoteDescription(
        new RTCSessionDescription({ type: "offer", sdp }),
      );
      console.log("[WebRTC Viewer] Remote description set");

      // Process queued ICE candidates
      for (const candidateStr of this.pendingIceCandidates) {
        try {
          const candidate = JSON.parse(candidateStr);
          await this.pc!.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error(
            "[WebRTC Viewer] Error adding queued ICE candidate:",
            e,
          );
        }
      }
      this.pendingIceCandidates = [];

      console.log("[WebRTC Viewer] Creating SDP answer...");
      const answer = await this.pc!.createAnswer();
      console.log(
        `[WebRTC Viewer] Answer created (${answer.sdp?.length} chars), setting local description...`,
      );
      await this.pc!.setLocalDescription(answer);
      console.log(
        "[WebRTC Viewer] Local description set, sending answer via SignalR...",
      );
      await this.signaling!.sendAnswer(answer.sdp!, fromConnectionId);
      console.log(
        `%c[WebRTC Viewer] \u2705 Answer sent successfully to ${fromConnectionId}`,
        "color: #4caf50; font-weight: bold",
      );
    } catch (error) {
      console.error("[WebRTC Viewer] Error handling offer:", error);
    }
  }

  private async requestRenegotiation(): Promise<void> {
    if (this.disposed || !this.signaling?.isConnected) return;
    try {
      console.log("[WebRTC Viewer] Requesting renegotiation...");
      await this.signaling.requestRenegotiation();
    } catch (error) {
      console.error("[WebRTC Viewer] Renegotiation request failed:", error);
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.disposed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebRTC Viewer] Max reconnect attempts reached");
      this.setStatus("offline");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      30000,
    );
    console.log(
      `[WebRTC Viewer] Reconnect attempt ${this.reconnectAttempts} in ${delay}ms`,
    );

    await new Promise((r) => setTimeout(r, delay));
    if (this.disposed) return;

    try {
      await this.signaling?.disconnect();
      await this.connect();
    } catch (error) {
      console.error("[WebRTC Viewer] Reconnect failed:", error);
      this.attemptReconnect();
    }
  }

  private setStatus(status: ViewerStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.callbacks.onStatusChange?.(status);
    }
  }

  get currentStatus(): ViewerStatus {
    return this.status;
  }

  async disconnect(): Promise<void> {
    this.disposed = true;
    this.callbacks.onSignalRStatusChange?.(false);

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    await this.signaling?.disconnect();
    this.signaling = null;

    this.setStatus("offline");
  }
}
