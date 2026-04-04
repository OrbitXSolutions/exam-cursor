/**
 * WebRTC viewer for proctor side — receives candidate's screen share stream.
 * Uses a SEPARATE PeerConnection from ProctorViewer (webcam).
 * Signaling goes through the ProctorHub screen room (attempt_{id}_screen).
 */
import { ProctorSignaling } from "@/lib/signalr/proctor-signaling";
import { getVideoConfig, buildRtcConfig } from "@/lib/webrtc/video-config";

let _rtcConfig: RTCConfiguration = { iceServers: [] };

export type ScreenViewerStatus =
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline";

export interface ScreenShareViewerCallbacks {
  onStatusChange?: (status: ScreenViewerStatus) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onScreenShareStatusChanged?: (status: string) => void;
}

export class ScreenShareViewer {
  private signaling: ProctorSignaling | null = null;
  private pc: RTCPeerConnection | null = null;
  private attemptId: number;
  private status: ScreenViewerStatus = "connecting";
  private callbacks: ScreenShareViewerCallbacks;
  private disposed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private candidateConnectionId: string | null = null;
  private pendingIceCandidates: string[] = [];

  constructor(attemptId: number, callbacks: ScreenShareViewerCallbacks = {}) {
    this.attemptId = attemptId;
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    if (this.disposed) return;

    console.log(
      `%c[Screen Viewer] Starting connect for attempt ${this.attemptId}`,
      "color: #e91e63; font-weight: bold",
    );
    this.setStatus("connecting");

    try {
      const config = await getVideoConfig();
      _rtcConfig = buildRtcConfig(config);

      this.signaling = new ProctorSignaling(this.attemptId, "proctor", {
        onScreenPeerJoined: (event) => {
          if (event.role === "candidate") {
            console.log(
              `%c[Screen Viewer] ✅ Candidate screen peer joined`,
              "color: #4caf50; font-weight: bold",
            );
            this.candidateConnectionId = event.connectionId;
          }
        },
        onScreenPeerLeft: () => {
          console.log("[Screen Viewer] Candidate screen peer left");
          this.candidateConnectionId = null;
          this.setStatus("offline");
        },
        onReceiveScreenOffer: async (event) => {
          console.log(
            `%c[Screen Viewer] ✅ Received screen offer from candidate`,
            "color: #4caf50; font-weight: bold",
          );
          this.candidateConnectionId = event.fromConnectionId;
          await this.handleOffer(event.sdp, event.fromConnectionId);
        },
        onReceiveScreenIceCandidate: async (event) => {
          try {
            if (this.pc && this.pc.remoteDescription) {
              const candidate = JSON.parse(event.candidate);
              await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              this.pendingIceCandidates.push(event.candidate);
            }
          } catch (error) {
            console.error("[Screen Viewer] Error adding ICE candidate:", error);
          }
        },
        onScreenShareStatusChanged: (event) => {
          console.log(
            `%c[Screen Viewer] Screen share status: ${event.status}`,
            "color: #ff9800; font-weight: bold",
          );
          this.callbacks.onScreenShareStatusChanged?.(event.status);
          if (event.status === "stopped" || event.status === "lost") {
            this.setStatus("offline");
          } else if (event.status === "started" || event.status === "resumed") {
            // Candidate will send new offer
          }
        },
        onReconnecting: () => {
          this.setStatus("reconnecting");
        },
        onReconnected: async () => {
          console.log("[Screen Viewer] SignalR reconnected");
        },
        onDisconnected: () => {
          if (!this.disposed) {
            this.setStatus("offline");
            this.attemptReconnect();
          }
        },
      });

      await this.signaling.connectScreenRoom();
      this.reconnectAttempts = 0;
      console.log(
        `%c[Screen Viewer] ✅ Connected, waiting for candidate screen offer...`,
        "color: #4caf50; font-weight: bold",
      );
    } catch (error) {
      console.error("[Screen Viewer] Connect failed:", error);
      this.setStatus("offline");
      if (!this.disposed) {
        this.attemptReconnect();
      }
    }
  }

  private createPeerConnection(): void {
    if (this.pc) {
      this.pc.close();
    }

    this.pc = new RTCPeerConnection(_rtcConfig);
    this.pendingIceCandidates = [];

    // Receive remote tracks (candidate's screen)
    this.pc.ontrack = (event) => {
      console.log(
        "[Screen Viewer] Received remote screen track:",
        event.track.kind,
      );
      if (event.streams[0]) {
        this.callbacks.onRemoteStream?.(event.streams[0]);
      }
    };

    // ICE candidate handling
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling
          ?.sendScreenIceCandidate(
            JSON.stringify(event.candidate.toJSON()),
            this.candidateConnectionId ?? undefined,
          )
          .catch((e) => console.error("[Screen Viewer] Error sending ICE:", e));
      }
    };

    // Connection state monitoring
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log(
        `%c[Screen Viewer] Connection state: ${state}`,
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
          break;
        case "failed":
          this.setStatus("reconnecting");
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
      this.createPeerConnection();

      await this.pc!.setRemoteDescription(
        new RTCSessionDescription({ type: "offer", sdp }),
      );

      // Process queued ICE candidates
      for (const candidateStr of this.pendingIceCandidates) {
        try {
          const candidate = JSON.parse(candidateStr);
          await this.pc!.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error(
            "[Screen Viewer] Error adding queued ICE candidate:",
            e,
          );
        }
      }
      this.pendingIceCandidates = [];

      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      await this.signaling!.sendScreenAnswer(answer.sdp!, fromConnectionId);
      console.log(
        `%c[Screen Viewer] ✅ Screen answer sent`,
        "color: #4caf50; font-weight: bold",
      );
    } catch (error) {
      console.error("[Screen Viewer] Error handling screen offer:", error);
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.disposed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus("offline");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      30000,
    );

    await new Promise((r) => setTimeout(r, delay));
    if (this.disposed) return;

    try {
      await this.signaling?.disconnectScreenRoom();
      await this.connect();
    } catch {
      this.attemptReconnect();
    }
  }

  private setStatus(status: ScreenViewerStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.callbacks.onStatusChange?.(status);
    }
  }

  get currentStatus(): ScreenViewerStatus {
    return this.status;
  }

  async disconnect(): Promise<void> {
    this.disposed = true;

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    await this.signaling?.disconnectScreenRoom();
    this.signaling = null;

    this.setStatus("offline");
  }
}
