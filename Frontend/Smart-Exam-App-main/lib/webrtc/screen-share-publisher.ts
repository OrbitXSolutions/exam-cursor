/**
 * WebRTC publisher for candidate screen sharing.
 * Uses a SEPARATE PeerConnection from CandidatePublisher (webcam).
 * Signaling goes through the ProctorHub screen room (attempt_{id}_screen).
 * Supports ICE restart, reconnect, and track-ended detection.
 */
import { ProctorSignaling } from "@/lib/signalr/proctor-signaling";
import { getVideoConfig, buildRtcConfig } from "@/lib/webrtc/video-config";

let _rtcConfig: RTCConfiguration = { iceServers: [] };

export type ScreenShareStatus =
  | "idle"
  | "requesting"
  | "active"
  | "stopped"
  | "denied"
  | "lost"
  | "reconnecting"
  | "failed";

export interface ScreenSharePublisherCallbacks {
  onStatusChange?: (status: ScreenShareStatus) => void;
  onTrackEnded?: () => void;
  onError?: (error: Error) => void;
}

export class ScreenSharePublisher {
  private signaling: ProctorSignaling | null = null;
  private pc: RTCPeerConnection | null = null;
  private stream: MediaStream | null = null;
  private attemptId: number;
  private status: ScreenShareStatus = "idle";
  private callbacks: ScreenSharePublisherCallbacks;
  private disposed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private proctorConnectionId: string | null = null;

  constructor(
    attemptId: number,
    callbacks: ScreenSharePublisherCallbacks = {},
  ) {
    this.attemptId = attemptId;
    this.callbacks = callbacks;
  }

  /**
   * Request screen share permission and start publishing.
   * Returns true if sharing started, false if denied.
   */
  async start(): Promise<boolean> {
    if (this.disposed) return false;

    console.log(
      `%c[Screen Publisher] Starting for attempt ${this.attemptId}`,
      "color: #9c27b0; font-weight: bold",
    );
    this.setStatus("requesting");

    try {
      // Load STUN config from server
      const config = await getVideoConfig();
      _rtcConfig = buildRtcConfig(config);

      // Request screen share permission
      try {
        this.stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "window",
          } as MediaTrackConstraints,
          audio: false,
        });
      } catch (err: unknown) {
        const error = err as Error;
        console.warn("[Screen Publisher] Screen share denied:", error.message);
        this.setStatus("denied");
        return false;
      }

      // Listen for track ended (user clicks browser "Stop sharing" button)
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log(
            `%c[Screen Publisher] Track ended (user stopped sharing)`,
            "color: #ff5722; font-weight: bold",
          );
          this.setStatus("stopped");
          this.callbacks.onTrackEnded?.();
          // Notify proctor via main room (not screen room)
          this.signaling?.notifyScreenShareStatus("stopped").catch(() => {});
        };
      }

      // Create signaling connection for screen share
      this.signaling = new ProctorSignaling(this.attemptId, "candidate", {
        onScreenPeerJoined: async (event) => {
          console.log(
            `%c[Screen Publisher] Screen peer joined: role=${event.role}`,
            "color: #ff9800; font-weight: bold",
          );
          if (event.role === "proctor") {
            this.proctorConnectionId = event.connectionId;
            // Reset PeerConnection to ensure clean state (the immediate offer
            // sent in start() may have left the PC in "have-local-offer" state)
            await this.resetPeerConnection();
          }
        },
        onScreenPeerLeft: () => {
          console.log("[Screen Publisher] Screen proctor left");
          this.proctorConnectionId = null;
        },
        onReceiveScreenAnswer: async (event) => {
          console.log("[Screen Publisher] Received screen answer from proctor");
          try {
            if (this.pc && this.pc.signalingState !== "closed") {
              await this.pc.setRemoteDescription(
                new RTCSessionDescription({ type: "answer", sdp: event.sdp }),
              );
            }
          } catch (error) {
            console.error(
              "[Screen Publisher] Error setting remote description:",
              error,
            );
          }
        },
        onReceiveScreenIceCandidate: async (event) => {
          try {
            if (this.pc && this.pc.remoteDescription) {
              const candidate = JSON.parse(event.candidate);
              await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (error) {
            console.error(
              "[Screen Publisher] Error adding ICE candidate:",
              error,
            );
          }
        },
        onReconnecting: () => {
          this.setStatus("reconnecting");
        },
        onReconnected: async () => {
          console.log(
            "[Screen Publisher] SignalR reconnected, resending offer...",
          );
          await this.resetPeerConnection();
        },
        onDisconnected: () => {
          if (!this.disposed) {
            this.setStatus("reconnecting");
            this.attemptReconnect();
          }
        },
      });

      // Connect and join SCREEN room
      await this.signaling.connectScreenRoom();
      console.log(
        "[Screen Publisher] SignalR connected, creating PeerConnection...",
      );
      this.createPeerConnection();
      this.reconnectAttempts = 0;

      // Immediately send offer in case proctor is already in the room
      // (JoinScreenRoom only notifies others, not the joining peer about existing members)
      await this.createAndSendOffer();

      // Notify proctor of screen share status via main room
      this.signaling.notifyScreenShareStatus("started").catch(() => {});

      this.setStatus("active");
      console.log(
        `%c[Screen Publisher] ✅ Screen sharing active, waiting for proctor...`,
        "color: #4caf50; font-weight: bold",
      );
      return true;
    } catch (error) {
      console.error("[Screen Publisher] Start failed:", error);
      this.setStatus("failed");
      this.callbacks.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Restart screen share after it was stopped (e.g., user stopped sharing in Strict mode).
   */
  async restart(): Promise<boolean> {
    if (this.disposed) return false;

    // Clean up old stream but keep signaling
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.setStatus("requesting");

    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "window",
        } as MediaTrackConstraints,
        audio: false,
      });
    } catch {
      this.setStatus("denied");
      return false;
    }

    // Listen for track ended again
    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        this.setStatus("stopped");
        this.callbacks.onTrackEnded?.();
        this.signaling?.notifyScreenShareStatus("stopped").catch(() => {});
      };
    }

    this.createPeerConnection();
    if (this.proctorConnectionId) {
      await this.createAndSendOffer();
    }

    this.signaling?.notifyScreenShareStatus("resumed").catch(() => {});

    this.setStatus("active");
    return true;
  }

  private createPeerConnection(): void {
    if (this.pc) {
      this.pc.close();
    }

    this.pc = new RTCPeerConnection(_rtcConfig);

    // Add screen share track
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        this.pc.addTrack(track, this.stream);
      }
    }

    // ICE candidate handling
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling
          ?.sendScreenIceCandidate(
            JSON.stringify(event.candidate.toJSON()),
            this.proctorConnectionId ?? undefined,
          )
          .catch((e) =>
            console.error("[Screen Publisher] Error sending ICE:", e),
          );
      }
    };

    // Connection state monitoring
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log(
        `%c[Screen Publisher] Connection state: ${state}`,
        state === "connected"
          ? "color: #4caf50; font-weight: bold"
          : "color: #ff5722; font-weight: bold",
      );
      switch (state) {
        case "connected":
          this.setStatus("active");
          this.reconnectAttempts = 0;
          break;
        case "disconnected":
          this.setStatus("reconnecting");
          setTimeout(() => this.tryIceRestart(), 2000);
          break;
        case "failed":
          this.setStatus("reconnecting");
          this.tryIceRestart();
          break;
        case "closed":
          if (!this.disposed) {
            this.setStatus("lost");
            this.signaling?.notifyScreenShareStatus("lost").catch(() => {});
          }
          break;
      }
    };
  }

  private async createAndSendOffer(): Promise<void> {
    if (!this.pc || !this.signaling) return;

    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      await this.signaling.sendScreenOffer(offer.sdp!);
      console.log(
        `%c[Screen Publisher] ✅ Screen offer sent`,
        "color: #4caf50; font-weight: bold",
      );
    } catch (error) {
      console.error("[Screen Publisher] Error creating/sending offer:", error);
    }
  }

  private async tryIceRestart(): Promise<void> {
    if (this.disposed || !this.pc || !this.signaling?.isConnected) return;

    try {
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      await this.signaling.sendScreenOffer(offer.sdp!);
    } catch (error) {
      console.error("[Screen Publisher] ICE restart failed:", error);
      await this.resetPeerConnection();
    }
  }

  private async resetPeerConnection(): Promise<void> {
    if (this.disposed) return;
    this.createPeerConnection();
    if (this.proctorConnectionId) {
      await this.createAndSendOffer();
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.disposed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus("failed");
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
      await this.signaling?.connectScreenRoom();
      this.createPeerConnection();
      this.reconnectAttempts = 0;
    } catch {
      this.attemptReconnect();
    }
  }

  private setStatus(status: ScreenShareStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.callbacks.onStatusChange?.(status);
    }
  }

  get currentStatus(): ScreenShareStatus {
    return this.status;
  }

  async stop(): Promise<void> {
    this.disposed = true;

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    await this.signaling?.disconnectScreenRoom();
    this.signaling = null;

    this.setStatus("idle");
  }
}
