/**
 * Client-side chunk recorder using MediaRecorder API.
 * Records webcam in ~3 second WebM chunks and uploads them to the backend.
 * Implements retry with exponential backoff for reliability.
 */

const CHUNK_DURATION_MS = 3000; // 3 seconds per chunk
const MAX_UPLOAD_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

export interface ChunkRecorderCallbacks {
  onChunkUploaded?: (chunkIndex: number) => void;
  onChunkFailed?: (chunkIndex: number, error: string) => void;
  onRecordingStarted?: () => void;
  onRecordingStopped?: () => void;
  onError?: (error: string) => void;
}

export class ChunkRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private attemptId: number;
  private callbacks: ChunkRecorderCallbacks;
  private chunkIndex = 0;
  private isRecording = false;
  private disposed = false;
  private uploadQueue: Array<{ blob: Blob; index: number; retries: number }> =
    [];
  private uploading = false;
  private recordingStartTime: number = 0;

  constructor(attemptId: number, callbacks: ChunkRecorderCallbacks = {}) {
    this.attemptId = attemptId;
    this.callbacks = callbacks;
  }

  /**
   * Start recording from the given stream.
   * @param existingStream - The webcam MediaStream to record from
   */
  start(existingStream: MediaStream): void {
    if (this.disposed || this.isRecording) return;

    this.stream = existingStream;
    this.chunkIndex = 0;
    this.recordingStartTime = Date.now();

    // Choose best supported codec
    const mimeType = this.getSupportedMimeType();
    if (!mimeType) {
      this.callbacks.onError?.("No supported recording format available");
      return;
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: 500000, // 500kbps — small file sizes
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.enqueueChunk(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: Event) => {
        const error =
          (event as ErrorEvent).error?.message || "MediaRecorder error";
        console.error("[ChunkRecorder] Error:", error);
        this.callbacks.onError?.(error);
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.callbacks.onRecordingStopped?.();
      };

      // Request data every CHUNK_DURATION_MS
      this.mediaRecorder.start(CHUNK_DURATION_MS);
      this.isRecording = true;
      this.callbacks.onRecordingStarted?.();
      console.log(`[ChunkRecorder] Started recording (${mimeType})`);
    } catch (error: any) {
      console.error("[ChunkRecorder] Failed to start:", error);
      this.callbacks.onError?.(error?.message || "Failed to start recording");
    }
  }

  private getSupportedMimeType(): string | null {
    const types = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return null;
  }

  private enqueueChunk(blob: Blob): void {
    const index = this.chunkIndex++;
    this.uploadQueue.push({ blob, index, retries: 0 });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.uploading || this.uploadQueue.length === 0) return;

    this.uploading = true;

    while (this.uploadQueue.length > 0) {
      const item = this.uploadQueue[0];
      const success = await this.uploadChunk(item.blob, item.index);

      if (success) {
        this.uploadQueue.shift();
        this.callbacks.onChunkUploaded?.(item.index);
      } else {
        item.retries++;
        if (item.retries >= MAX_UPLOAD_RETRIES) {
          console.error(
            `[ChunkRecorder] Chunk ${item.index} failed after ${MAX_UPLOAD_RETRIES} retries`,
          );
          this.callbacks.onChunkFailed?.(item.index, "Max retries exceeded");
          this.uploadQueue.shift(); // Drop it and move on
        } else {
          // Exponential backoff
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, item.retries - 1);
          console.warn(
            `[ChunkRecorder] Chunk ${item.index} retry ${item.retries} in ${delay}ms`,
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    this.uploading = false;
  }

  private async uploadChunk(blob: Blob, chunkIndex: number): Promise<boolean> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      const formData = new FormData();
      formData.append("chunk", blob, `chunk_${chunkIndex}.webm`);
      formData.append("chunkIndex", String(chunkIndex));
      formData.append("timestamp", String(Date.now()));

      const response = await fetch(
        `/api/proxy/Proctor/video-chunk/${this.attemptId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          `[ChunkRecorder] Upload chunk ${chunkIndex} failed:`,
          response.status,
          errorData,
        );
        return false;
      }

      console.log(
        `[ChunkRecorder] Chunk ${chunkIndex} uploaded (${(blob.size / 1024).toFixed(1)}KB)`,
      );
      return true;
    } catch (error) {
      console.error(`[ChunkRecorder] Upload chunk ${chunkIndex} error:`, error);
      return false;
    }
  }

  /**
   * Stop recording and flush remaining chunks.
   * Returns a promise that resolves when all pending chunks are uploaded.
   */
  async stop(): Promise<void> {
    if (!this.isRecording || !this.mediaRecorder) return;

    return new Promise<void>((resolve) => {
      // MediaRecorder.onstop fires after final ondataavailable
      const origOnStop = this.mediaRecorder!.onstop;
      this.mediaRecorder!.onstop = async (event) => {
        if (origOnStop && typeof origOnStop === "function") {
          origOnStop.call(this.mediaRecorder!, event);
        }
        // Wait for upload queue to drain
        await this.waitForUploads();
        resolve();
      };

      this.mediaRecorder!.stop();
      console.log("[ChunkRecorder] Stop requested, flushing chunks...");
    });
  }

  private async waitForUploads(timeoutMs = 15000): Promise<void> {
    const start = Date.now();
    while (this.uploadQueue.length > 0 && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (this.uploadQueue.length > 0) {
      console.warn(
        `[ChunkRecorder] ${this.uploadQueue.length} chunks still pending after timeout`,
      );
    }
  }

  get totalChunks(): number {
    return this.chunkIndex;
  }

  get recording(): boolean {
    return this.isRecording;
  }

  get durationSeconds(): number {
    if (!this.recordingStartTime) return 0;
    return Math.floor((Date.now() - this.recordingStartTime) / 1000);
  }

  dispose(): void {
    this.disposed = true;
    if (this.isRecording && this.mediaRecorder) {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    this.mediaRecorder = null;
    this.uploadQueue = [];
  }
}
