/**
 * WebRTC publisher for candidate side.
 * Creates a peer connection and publishes the webcam stream to proctors via SignalR signaling.
 * Supports ICE restart, renegotiation, and hard reset reconnect.
 */
import { ProctorSignaling } from "@/lib/signalr/proctor-signaling";
import { getVideoConfig, buildRtcConfig } from "@/lib/webrtc/video-config";

// RTC_CONFIG is built dynamically from server config
let _rtcConfig: RTCConfiguration = { iceServers: [] };

export type PublisherStatus =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "failed";

export interface CandidatePublisherCallbacks {
  onStatusChange?: (status: PublisherStatus) => void;
}

export class CandidatePublisher {
  private signaling: ProctorSignaling | null = null;
  private pc: RTCPeerConnection | null = null;
  private stream: MediaStream | null = null;
  private attemptId: number;
  private status: PublisherStatus = "idle";
  private callbacks: CandidatePublisherCallbacks;
  private disposed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private proctorConnectionId: string | null = null;

  constructor(attemptId: number, callbacks: CandidatePublisherCallbacks = {}) {
    this.attemptId = attemptId;
    this.callbacks = callbacks;
  }

  /**
   * Start publishing the webcam stream.
   * @param existingStream - Reuse an existing MediaStream (from proctoring webcam) instead of opening a new one.
   */
  async start(existingStream?: MediaStream): Promise<void> {
    if (this.disposed) return;

    console.log(`%c[WebRTC Publisher] Starting for attempt ${this.attemptId}`, 'color: #9c27b0; font-weight: bold');
    this.setStatus("connecting");

    try {
      // Load STUN config from server
      const config = await getVideoConfig();
      console.log('[WebRTC Publisher] Video config:', JSON.stringify(config));
      _rtcConfig = buildRtcConfig(config);
      console.log('[WebRTC Publisher] RTC config:', JSON.stringify(_rtcConfig));

      // Reuse existing webcam stream or create new one
      if (existingStream) {
        this.stream = existingStream;
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
      }

      // Create signaling connection
      this.signaling = new ProctorSignaling(this.attemptId, "candidate", {
        onPeerJoined: async (event) => {
          console.log(`%c[WebRTC Publisher] PeerJoined event: role=${event.role}, connId=${event.connectionId}`, 'color: #ff9800; font-weight: bold');
          if (event.role === "proctor") {
            console.log(`%c[WebRTC Publisher] ✅ Proctor joined! Creating offer...`, 'color: #4caf50; font-weight: bold');
            this.proctorConnectionId = event.connectionId;
            await this.createAndSendOffer();
          }
        },
        onPeerLeft: (event) => {
          console.log("[WebRTC Publisher] Proctor left");
          this.proctorConnectionId = null;
        },
        onReceiveAnswer: async (event) => {
          console.log("[WebRTC Publisher] Received answer from proctor");
          try {
            if (this.pc && this.pc.signalingState !== "closed") {
              await this.pc.setRemoteDescription(
                new RTCSessionDescription({ type: "answer", sdp: event.sdp }),
              );
              console.log(`%c[WebRTC Publisher] \u2705 Remote answer set successfully`, 'color: #4caf50; font-weight: bold');
            } else {
              console.warn(`[WebRTC Publisher] Cannot set answer: pc=${!!this.pc}, remoteDesc already set=${!!this.pc?.remoteDescription}`);
            }
          } catch (error) {
            console.error(
              "[WebRTC Publisher] Error setting remote description:",
              error,
            );
          }
        },
        onReceiveIceCandidate: async (event) => {
          try {
            if (this.pc && this.pc.remoteDescription) {
              const candidate = JSON.parse(event.candidate);
              await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log(`[WebRTC Publisher] Remote ICE candidate added`);
            } else {
              console.warn(`[WebRTC Publisher] Cannot add ICE: pc=${!!this.pc}, hasRemoteDesc=${!!this.pc?.remoteDescription}`);
            }
          } catch (error) {
            console.error(
              "[WebRTC Publisher] Error adding ICE candidate:",
              error,
            );
          }
        },
        onRenegotiationRequested: async () => {
          console.log(`%c[WebRTC Publisher] ⚡ Renegotiation requested by proctor, creating offer...`, 'color: #ff9800; font-weight: bold');
          await this.createAndSendOffer();
        },
        onReconnecting: () => {
          this.setStatus("reconnecting");
        },
        onReconnected: async () => {
          console.log(
            "[WebRTC Publisher] SignalR reconnected, resending offer...",
          );
          // Recreate peer connection with fresh ICE
          await this.resetPeerConnection();
        },
        onDisconnected: () => {
          if (!this.disposed) {
            this.setStatus("reconnecting");
            this.attemptReconnect();
          }
        },
      });

      await this.signaling.connect();
      console.log('[WebRTC Publisher] SignalR connected, creating PeerConnection...');
      this.createPeerConnection();
      this.reconnectAttempts = 0;

      // Don't set "live" yet — wait for ICE connected state
      console.log(`%c[WebRTC Publisher] ✅ Ready, waiting for proctor to join room attempt_${this.attemptId}...`, 'color: #4caf50; font-weight: bold');
    } catch (error) {
      console.error("[WebRTC Publisher] Start failed:", error);
      this.setStatus("failed");
    }
  }

  private createPeerConnection(): void {
    console.log('[WebRTC Publisher] Creating RTCPeerConnection...');
    if (this.pc) {
      this.pc.close();
    }

    this.pc = new RTCPeerConnection(_rtcConfig);
    console.log('[WebRTC Publisher] RTCPeerConnection created');

    // Add tracks from stream
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        this.pc.addTrack(track, this.stream);
        console.log(`[WebRTC Publisher] Added track: kind=${track.kind}, id=${track.id}, enabled=${track.enabled}`);
      }
    } else {
      console.warn('[WebRTC Publisher] No stream to add tracks from!');
    }

    // ICE candidate handling
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[WebRTC Publisher] Local ICE candidate: ${event.candidate.candidate.substring(0, 60)}...`);
        this.signaling
          ?.sendIceCandidate(
            JSON.stringify(event.candidate.toJSON()),
            this.proctorConnectionId ?? undefined,
          )
          .catch((e) =>
            console.error("[WebRTC Publisher] Error sending ICE:", e),
          );
      }
    };

    // Connection state monitoring
    this.pc.onicegatheringstatechange = () => {
      console.log(`[WebRTC Publisher] ICE gathering state: ${this.pc?.iceGatheringState}`);
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC Publisher] ICE connection state: ${this.pc?.iceConnectionState}`);
    };

    this.pc.onsignalingstatechange = () => {
      console.log(`[WebRTC Publisher] Signaling state: ${this.pc?.signalingState}`);
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log(`%c[WebRTC Publisher] Connection state: ${state}`, state === 'connected' ? 'color: #4caf50; font-weight: bold' : 'color: #ff5722; font-weight: bold');
      switch (state) {
        case "connected":
          this.setStatus("live");
          this.reconnectAttempts = 0;
          this.signaling?.notifyConnectionStatus("connected").catch(() => {});
          break;
        case "disconnected":
          this.setStatus("reconnecting");
          this.signaling
            ?.notifyConnectionStatus("reconnecting")
            .catch(() => {});
          // Try ICE restart after short delay
          setTimeout(() => this.tryIceRestart(), 2000);
          break;
        case "failed":
          this.setStatus("reconnecting");
          this.signaling
            ?.notifyConnectionStatus("reconnecting")
            .catch(() => {});
          this.tryIceRestart();
          break;
        case "closed":
          if (!this.disposed) {
            this.setStatus("failed");
            this.signaling
              ?.notifyConnectionStatus("disconnected")
              .catch(() => {});
          }
          break;
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      // already logged above
    };
  }

  private async createAndSendOffer(): Promise<void> {
    if (!this.pc || !this.signaling) {
      console.error('[WebRTC Publisher] Cannot create offer: pc=', !!this.pc, 'signaling=', !!this.signaling);
      return;
    }

    try {
      console.log('[WebRTC Publisher] Creating SDP offer...');
      const offer = await this.pc.createOffer();
      console.log(`[WebRTC Publisher] Offer created (${offer.sdp?.length} chars), setting local description...`);
      await this.pc.setLocalDescription(offer);
      console.log('[WebRTC Publisher] Local description set, sending offer via SignalR...');
      await this.signaling.sendOffer(offer.sdp!);
      console.log(`%c[WebRTC Publisher] \u2705 Offer sent successfully`, 'color: #4caf50; font-weight: bold');
    } catch (error) {
      console.error("%c[WebRTC Publisher] \u274c Error creating/sending offer:", 'color: red; font-weight: bold', error);
    }
  }

  private async tryIceRestart(): Promise<void> {
    if (this.disposed || !this.pc || !this.signaling?.isConnected) return;

    try {
      console.log("[WebRTC Publisher] Attempting ICE restart...");
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      await this.signaling.sendOffer(offer.sdp!);
    } catch (error) {
      console.error(
        "[WebRTC Publisher] ICE restart failed, trying hard reset:",
        error,
      );
      await this.resetPeerConnection();
    }
  }

  private async resetPeerConnection(): Promise<void> {
    if (this.disposed) return;

    console.log("[WebRTC Publisher] Hard reset of peer connection");
    this.createPeerConnection();
    if (this.proctorConnectionId) {
      await this.createAndSendOffer();
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.disposed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebRTC Publisher] Max reconnect attempts reached");
      this.setStatus("failed");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      30000,
    );
    console.log(
      `[WebRTC Publisher] Reconnect attempt ${this.reconnectAttempts} in ${delay}ms`,
    );

    await new Promise((r) => setTimeout(r, delay));
    if (this.disposed) return;

    try {
      await this.signaling?.connect();
      this.createPeerConnection();
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error("[WebRTC Publisher] Reconnect failed:", error);
      this.attemptReconnect();
    }
  }

  private setStatus(status: PublisherStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.callbacks.onStatusChange?.(status);
    }
  }

  get currentStatus(): PublisherStatus {
    return this.status;
  }

  async stop(): Promise<void> {
    this.disposed = true;

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // Don't stop stream if it was provided externally (shared with proctoring)
    // The stream lifecycle is managed by the exam page

    await this.signaling?.disconnect();
    this.signaling = null;

    this.setStatus("idle");
  }
}
