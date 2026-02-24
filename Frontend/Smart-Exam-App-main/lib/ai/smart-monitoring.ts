/**
 * Smart Monitoring — AI Proctoring (Phase 1)
 * Uses MediaPipe FaceLandmarker for client-side face detection.
 *
 * Detections:
 *  1. FaceNotDetected     — no face for 2s continuous
 *  2. MultipleFacesDetected — >1 face for 2s continuous
 *  3. FaceOutOfFrame      — face bbox far from centre for 2s continuous
 *  4. HeadTurnDetected    — head yaw/pitch beyond threshold for 2s continuous
 *  5. CameraBlocked       — dark / covered frame for 2s (heuristic, not AI)
 *
 * All detections:
 *  - Fire via a callback so the caller (exam-page) logs the event & shows warning.
 *  - Have per-type 10 s cooldown to avoid spam.
 *  - Run at ~5 FPS (200 ms interval) to stay lightweight.
 *  - Fail silently — never block the exam.
 */

import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type ViolationType =
  | "FaceNotDetected"
  | "MultipleFacesDetected"
  | "FaceOutOfFrame"
  | "HeadTurnDetected"
  | "CameraBlocked";

export interface ViolationEvent {
  type: ViolationType;
  message: string;
  metadata: Record<string, unknown>;
}

export interface SmartMonitoringCallbacks {
  /** Called when a violation is confirmed (after continuous threshold + cooldown). */
  onViolation: (event: ViolationEvent) => void;
}

export interface SmartMonitoringConfig {
  /** How long a condition must persist before firing (ms). Default 2000 */
  continuousThresholdMs?: number;
  /** Per-type cooldown between fires (ms). Default 10000 */
  cooldownMs?: number;
  /** Detection loop interval (ms). Default 200 (≈5 FPS) */
  detectionIntervalMs?: number;
  /** Face bbox margin — how far from centre (0-1, fraction of frame) before "out of frame". Default 0.30 */
  outOfFrameMargin?: number;
  /** Head yaw threshold in degrees for "looking left/right". Default 30 */
  headYawThresholdDeg?: number;
  /** Head pitch threshold in degrees for "looking down". Default 25 */
  headPitchThresholdDeg?: number;
  /** Camera-blocked: brightness threshold (0-255). Default 25 */
  darkBrightnessThreshold?: number;
  /** Camera-blocked: variance threshold. Default 15 */
  darkVarianceThreshold?: number;
}

const DEFAULTS: Required<SmartMonitoringConfig> = {
  continuousThresholdMs: 2000,
  cooldownMs: 10000,
  detectionIntervalMs: 200,
  outOfFrameMargin: 0.3,
  headYawThresholdDeg: 30,
  headPitchThresholdDeg: 25,
  darkBrightnessThreshold: 25,
  darkVarianceThreshold: 15,
};

// ─── Violation messages ─────────────────────────────────────────────────────────

const MESSAGES: Record<ViolationType, string> = {
  FaceNotDetected: "Your face is not visible. Please look at the screen.",
  MultipleFacesDetected:
    "Multiple faces detected. Only the candidate should be visible.",
  FaceOutOfFrame:
    "Your face is out of frame. Please center yourself in the camera.",
  HeadTurnDetected:
    "Please face the screen directly. Looking away is not allowed.",
  CameraBlocked:
    "Your camera appears to be blocked or covered. Please uncover it.",
};

// ─── SmartMonitoring class ──────────────────────────────────────────────────────

export class SmartMonitoring {
  private faceLandmarker: FaceLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private callbacks: SmartMonitoringCallbacks;
  private config: Required<SmartMonitoringConfig>;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private running = false;
  private disposed = false;

  // Per-type continuous tracking: when the condition started (null = not active)
  private conditionStart: Record<ViolationType, number | null> = {
    FaceNotDetected: null,
    MultipleFacesDetected: null,
    FaceOutOfFrame: null,
    HeadTurnDetected: null,
    CameraBlocked: null,
  };

  // Per-type cooldown: last time a violation was fired
  private lastFired: Record<ViolationType, number> = {
    FaceNotDetected: 0,
    MultipleFacesDetected: 0,
    FaceOutOfFrame: 0,
    HeadTurnDetected: 0,
    CameraBlocked: 0,
  };

  constructor(
    callbacks: SmartMonitoringCallbacks,
    config?: SmartMonitoringConfig,
  ) {
    this.callbacks = callbacks;
    this.config = { ...DEFAULTS, ...config };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Initialise FaceLandmarker and start the detection loop.
   * @param videoElement The <video> element already playing the webcam stream.
   * @returns true if model loaded successfully, false otherwise.
   */
  async start(videoElement: HTMLVideoElement): Promise<boolean> {
    if (this.disposed) return false;
    this.videoElement = videoElement;

    try {
      console.log(
        "[SmartMonitoring] Loading MediaPipe FaceLandmarker model...",
      );

      const vision = await FilesetResolver.forVisionTasks(
        // Serve WASM from CDN — avoids needing to copy files to public/
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm",
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU", // Use WebGL — falls back to CPU automatically
        },
        runningMode: "VIDEO",
        numFaces: 4, // detect up to 4 to catch "multiple faces"
        outputFaceBlendshapes: false, // don't need blendshapes for Phase 1
        outputFacialTransformationMatrixes: true, // need this for head pose (yaw/pitch)
      });

      console.log("[SmartMonitoring] ✅ FaceLandmarker loaded successfully");

      // Create offscreen canvas for camera-blocked heuristic
      this.canvas = document.createElement("canvas");
      this.canvas.width = 64; // small — just for brightness sampling
      this.canvas.height = 48;
      this.canvasCtx = this.canvas.getContext("2d", {
        willReadFrequently: true,
      });

      // Start detection loop
      this.running = true;
      this.loopTimer = setInterval(
        () => this.detectFrame(),
        this.config.detectionIntervalMs,
      );

      console.log(
        `[SmartMonitoring] Detection loop started (${this.config.detectionIntervalMs}ms interval)`,
      );
      return true;
    } catch (err) {
      console.warn(
        "[SmartMonitoring] Failed to load FaceLandmarker (non-fatal):",
        err,
      );
      return false;
    }
  }

  /** Stop the detection loop and release resources. */
  dispose(): void {
    this.disposed = true;
    this.running = false;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    this.faceLandmarker?.close();
    this.faceLandmarker = null;
    this.videoElement = null;
    this.canvas = null;
    this.canvasCtx = null;
    console.log("[SmartMonitoring] Disposed");
  }

  // ─── Detection loop ────────────────────────────────────────────────────────

  private detectFrame(): void {
    if (!this.running || !this.videoElement || !this.faceLandmarker) return;

    // Skip if video not ready
    if (
      this.videoElement.readyState < 2 ||
      this.videoElement.videoWidth === 0
    ) {
      return;
    }

    const now = performance.now();

    try {
      // 1. Camera blocked heuristic (runs on pixel data — independent of MediaPipe)
      const isBlocked = this.checkCameraBlocked();

      // 2. FaceLandmarker detection
      const result = this.faceLandmarker.detectForVideo(this.videoElement, now);

      // 3. Evaluate all conditions
      this.evaluateConditions(result, isBlocked, now);
    } catch (err) {
      // Silent — one bad frame shouldn't kill the loop
      // (MediaPipe can occasionally throw on corrupted frames)
    }
  }

  // ─── Condition evaluation ──────────────────────────────────────────────────

  private evaluateConditions(
    result: FaceLandmarkerResult,
    isBlocked: boolean,
    now: number,
  ): void {
    const faceCount = result.faceLandmarks?.length ?? 0;

    // ── CameraBlocked ──
    this.updateCondition("CameraBlocked", isBlocked, now, {
      reason: "dark_or_covered_frame",
      detail:
        "Camera is dark or covered — low brightness and variance detected",
    });

    // If camera is blocked, skip face-based detections (no point)
    if (isBlocked) {
      this.clearCondition("FaceNotDetected");
      this.clearCondition("MultipleFacesDetected");
      this.clearCondition("FaceOutOfFrame");
      this.clearCondition("HeadTurnDetected");
      return;
    }

    // ── FaceNotDetected ──
    this.updateCondition("FaceNotDetected", faceCount === 0, now, {
      faceCount,
      detail:
        "No face detected in camera view — candidate may be away or hidden",
    });

    // ── MultipleFacesDetected ──
    this.updateCondition("MultipleFacesDetected", faceCount > 1, now, {
      faceCount,
      detail: `${faceCount} faces detected — only the candidate should be visible`,
    });

    // If no face, can't check position or head pose
    if (faceCount === 0) {
      this.clearCondition("FaceOutOfFrame");
      this.clearCondition("HeadTurnDetected");
      return;
    }

    // Use the first (primary) face for position/pose checks
    const landmarks = result.faceLandmarks[0];

    // ── FaceOutOfFrame ──
    const {
      outOfFrame: isOutOfFrame,
      faceCentreX,
      faceCentreY,
    } = this.checkFaceOutOfFrame(landmarks);
    const outOfFrameDir = isOutOfFrame
      ? this.describeDirection(faceCentreX, faceCentreY)
      : "";
    this.updateCondition("FaceOutOfFrame", isOutOfFrame, now, {
      faceCentreX: Math.round(faceCentreX * 100),
      faceCentreY: Math.round(faceCentreY * 100),
      direction: outOfFrameDir,
      detail: `Face moved too far ${outOfFrameDir} from the camera center`,
    });

    // ── HeadTurnDetected ──
    const headPose = this.estimateHeadPose(landmarks);
    const isTurned =
      Math.abs(headPose.yaw) > this.config.headYawThresholdDeg ||
      Math.abs(headPose.pitch) > this.config.headPitchThresholdDeg;
    const headDir = isTurned
      ? this.describeHeadTurn(headPose.yaw, headPose.pitch)
      : "";
    this.updateCondition("HeadTurnDetected", isTurned, now, {
      yaw: Math.round(headPose.yaw),
      pitch: Math.round(headPose.pitch),
      direction: headDir,
      detail: `Head turned ${headDir} (yaw ${Math.round(Math.abs(headPose.yaw))}°, pitch ${Math.round(Math.abs(headPose.pitch))}°)`,
    });
  }

  // ─── Condition state machine ──────────────────────────────────────────────

  /**
   * Update a violation condition.
   * If active → check if continuous threshold exceeded → fire if cooldown allows.
   * If not active → reset the start time.
   */
  private updateCondition(
    type: ViolationType,
    isActive: boolean,
    now: number,
    metadata: Record<string, unknown>,
  ): void {
    if (isActive) {
      // Start tracking if not already
      if (this.conditionStart[type] === null) {
        this.conditionStart[type] = now;
      }
      // Check if condition persisted long enough
      const elapsed = now - this.conditionStart[type]!;
      if (elapsed >= this.config.continuousThresholdMs) {
        // Check cooldown
        const sinceLast = now - this.lastFired[type];
        if (sinceLast >= this.config.cooldownMs) {
          this.lastFired[type] = now;
          this.conditionStart[type] = null; // reset so next occurrence needs fresh 2s
          this.callbacks.onViolation({
            type,
            message: MESSAGES[type],
            metadata: { ...metadata, continuousMs: elapsed },
          });
        }
      }
    } else {
      // Condition cleared — reset start time
      this.conditionStart[type] = null;
    }
  }

  private clearCondition(type: ViolationType): void {
    this.conditionStart[type] = null;
  }

  // ─── Direction helpers ────────────────────────────────────────────────────

  private describeDirection(cx: number, cy: number): string {
    const parts: string[] = [];
    if (cy < 0.5 - this.config.outOfFrameMargin) parts.push("up");
    else if (cy > 0.5 + this.config.outOfFrameMargin) parts.push("down");
    if (cx < 0.5 - this.config.outOfFrameMargin) parts.push("left");
    else if (cx > 0.5 + this.config.outOfFrameMargin) parts.push("right");
    return parts.join("-") || "off-center";
  }

  private describeHeadTurn(yaw: number, pitch: number): string {
    const parts: string[] = [];
    if (Math.abs(yaw) > this.config.headYawThresholdDeg) {
      parts.push(yaw > 0 ? "right" : "left");
    }
    if (Math.abs(pitch) > this.config.headPitchThresholdDeg) {
      parts.push(pitch > 0 ? "down" : "up");
    }
    return parts.join(" & ") || "away";
  }

  // ─── Camera blocked heuristic ─────────────────────────────────────────────

  private checkCameraBlocked(): boolean {
    if (!this.canvasCtx || !this.videoElement || !this.canvas) return false;

    try {
      this.canvasCtx.drawImage(
        this.videoElement,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      const imageData = this.canvasCtx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      const pixels = imageData.data;

      let sum = 0;
      let sumSq = 0;
      const pixelCount = this.canvas.width * this.canvas.height;

      // Sample every 4th pixel for speed (still plenty for brightness check)
      let sampled = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        // Luminance approximation: 0.299R + 0.587G + 0.114B
        const lum =
          0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        sum += lum;
        sumSq += lum * lum;
        sampled++;
      }

      if (sampled === 0) return false;

      const mean = sum / sampled;
      const variance = sumSq / sampled - mean * mean;

      return (
        mean < this.config.darkBrightnessThreshold &&
        variance < this.config.darkVarianceThreshold
      );
    } catch {
      return false;
    }
  }

  // ─── Face out of frame check ──────────────────────────────────────────────

  /**
   * Checks if the face bounding box centre is too far from the frame centre.
   * Landmarks are normalised [0, 1].
   */
  private checkFaceOutOfFrame(
    landmarks: { x: number; y: number; z: number }[],
  ): { outOfFrame: boolean; faceCentreX: number; faceCentreY: number } {
    if (!landmarks || landmarks.length === 0)
      return { outOfFrame: false, faceCentreX: 0.5, faceCentreY: 0.5 };

    // Compute bounding box of face landmarks
    let minX = 1,
      maxX = 0,
      minY = 1,
      maxY = 0;
    for (const lm of landmarks) {
      if (lm.x < minX) minX = lm.x;
      if (lm.x > maxX) maxX = lm.x;
      if (lm.y < minY) minY = lm.y;
      if (lm.y > maxY) maxY = lm.y;
    }

    const faceCentreX = (minX + maxX) / 2;
    const faceCentreY = (minY + maxY) / 2;

    // Frame centre is (0.5, 0.5). Check if face centre is beyond margin.
    const dx = Math.abs(faceCentreX - 0.5);
    const dy = Math.abs(faceCentreY - 0.5);

    return {
      outOfFrame:
        dx > this.config.outOfFrameMargin || dy > this.config.outOfFrameMargin,
      faceCentreX,
      faceCentreY,
    };
  }

  // ─── Head pose estimation ─────────────────────────────────────────────────

  /**
   * Estimate head yaw and pitch from nose tip vs. face edges.
   * Uses key landmark indices:
   *  - Nose tip: 1
   *  - Left ear tragion: 234
   *  - Right ear tragion: 454
   *  - Forehead: 10
   *  - Chin: 152
   *
   * Returns approximate angles in degrees.
   */
  private estimateHeadPose(landmarks: { x: number; y: number; z: number }[]): {
    yaw: number;
    pitch: number;
  } {
    if (landmarks.length < 468) return { yaw: 0, pitch: 0 };

    const nose = landmarks[1];
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];
    const forehead = landmarks[10];
    const chin = landmarks[152];

    // ── Yaw (horizontal rotation) ──
    // If nose is closer to left ear → looking right (positive yaw)
    // If nose is closer to right ear → looking left (negative yaw)
    const earMidX = (leftEar.x + rightEar.x) / 2;
    const earWidth = Math.abs(rightEar.x - leftEar.x);
    if (earWidth < 0.001) return { yaw: 0, pitch: 0 };

    const noseOffsetX = (nose.x - earMidX) / (earWidth / 2);
    // Map to degrees — empirically ~45° at full profile
    const yaw = noseOffsetX * 45;

    // ── Pitch (vertical rotation) ──
    const faceMidY = (forehead.y + chin.y) / 2;
    const faceHeight = Math.abs(chin.y - forehead.y);
    if (faceHeight < 0.001) return { yaw, pitch: 0 };

    const noseOffsetY = (nose.y - faceMidY) / (faceHeight / 2);
    const pitch = noseOffsetY * 40;

    return { yaw, pitch };
  }
}
