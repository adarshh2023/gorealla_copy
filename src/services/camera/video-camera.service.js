// src/services/camera/video-camera.service.js
import { Capacitor } from "@capacitor/core";
import { showError } from "src/utils/notification";

class VideoCameraService {
  constructor() {
    this.isAvailable = false;
    this.permissionsGranted = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.isPaused = false;
    this.recordingStartTime = null;
    this.flags = [];
    this.previewFlags = [];
  }

  /**
   * Initialize video camera service
   */
  async initialize() {
    try {
      this.isAvailable =
        Capacitor.isNativePlatform() || this.isWebRTCSupported();

      if (this.isAvailable) {
        await this.checkPermissions();
      }

      return this.isAvailable;
    } catch (error) {
      console.error("Video camera service initialization failed:", error);
      return false;
    }
  }

  /**
   * Check if WebRTC is supported (for web fallback)
   */
  isWebRTCSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }

  /**
   * Check camera and microphone permissions
   */
  async checkPermissions() {
    try {
      if (!this.isAvailable) return false;

      // Check permissions by trying to get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Stop the test stream
      stream.getTracks().forEach((track) => track.stop());

      this.permissionsGranted = true;
      return true;
    } catch (error) {
      console.error("Permission check failed:", error);
      this.permissionsGranted = false;
      return false;
    }
  }

  /**
   * Start video recording with rear camera
   */
  async startVideoRecording(options = {}) {
    try {
      if (!this.isAvailable) {
        throw new Error("Video recording not available on this platform");
      }

      // Check if already recording and stop if needed
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        console.log("Previous recording detected, cleaning up first");
        await this.cleanup();
      }

      const {
        width = 1920,
        height = 1080,
        facingMode = "environment", // 'environment' for rear, 'user' for front
        videoBitsPerSecond = 2500000, // 2.5 Mbps
        audioBitsPerSecond = 128000, // 128 kbps
      } = options;

      // Get media stream with constraints
      const constraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: { ideal: facingMode },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      console.log("Requesting media with constraints:", constraints);
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Media stream obtained:", this.stream);

      // Check MediaRecorder support and configure for MP4
      const mimeTypes = [
        'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
        'video/mp4;codecs="avc1.424028,mp4a.40.2"',
        "video/mp4",
        'video/webm;codecs="vp8,opus"',
        "video/webm",
      ];

      let selectedMimeType = null;
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log("Selected MIME type:", selectedMimeType);
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error("No supported video format found");
      }

      // Initialize MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond,
        audioBitsPerSecond,
      });

      // Reset recording data
      this.recordedChunks = [];
      this.flags = [...this.previewFlags]; // Include preview flags
      this.recordingStartTime = Date.now();
      this.isRecording = false;
      this.isPaused = false;

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size, "bytes");
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        console.log("MediaRecorder started, state:", this.mediaRecorder.state);
        this.isRecording = true;
        this.isPaused = false;
      };

      this.mediaRecorder.onstop = () => {
        console.log(
          "MediaRecorder stopped, chunks:",
          this.recordedChunks.length
        );
        this.isRecording = false;
        this.isPaused = false;
      };

      this.mediaRecorder.onpause = () => {
        console.log("MediaRecorder paused");
        this.isPaused = true;
      };

      this.mediaRecorder.onresume = () => {
        console.log("MediaRecorder resumed");
        this.isPaused = false;
      };

      this.mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        showError("Recording error occurred");
        this.isRecording = false;
        this.isPaused = false;
      };

      // Start recording
      console.log(
        "Starting MediaRecorder, current state:",
        this.mediaRecorder.state
      );
      this.mediaRecorder.start(250); // Capture data every 250ms

      return {
        success: true,
        stream: this.stream,
        mimeType: selectedMimeType,
      };
    } catch (error) {
      console.error("Failed to start video recording:", error);

      // Clean up on error
      this.cleanup();

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Stop video recording
   */
  async stopVideoRecording() {
    try {
      console.log("Stop recording called. Current state:", {
        hasMediaRecorder: !!this.mediaRecorder,
        mediaRecorderState: this.mediaRecorder?.state,
        isRecording: this.isRecording,
        chunksCount: this.recordedChunks.length,
      });

      // Check if we have an active recording
      if (!this.mediaRecorder) {
        throw new Error("No MediaRecorder instance found");
      }

      if (this.mediaRecorder.state === "inactive") {
        throw new Error("MediaRecorder is already inactive");
      }

      if (
        this.mediaRecorder.state !== "recording" &&
        this.mediaRecorder.state !== "paused"
      ) {
        throw new Error(
          `Cannot stop recording from state: ${this.mediaRecorder.state}`
        );
      }

      return new Promise((resolve, reject) => {
        // Set a timeout to prevent infinite waiting
        const timeout = setTimeout(() => {
          console.error("Recording stop timeout");
          this.cleanup();
          reject(
            new Error(
              "Recording stop timeout - MediaRecorder did not stop properly"
            )
          );
        }, 10000); // 10 second timeout

        // Override the onstop handler for this specific stop operation
        this.mediaRecorder.onstop = async () => {
          clearTimeout(timeout);

          try {
            console.log("MediaRecorder stopped event fired");
            console.log("Recorded chunks:", this.recordedChunks.length);

            // Check if we have recorded chunks
            if (!this.recordedChunks || this.recordedChunks.length === 0) {
              throw new Error("No video data recorded");
            }

            const totalSize = this.recordedChunks.reduce(
              (acc, chunk) => acc + chunk.size,
              0
            );
            console.log("Total recorded size:", totalSize, "bytes");

            if (totalSize === 0) {
              throw new Error("Video recording resulted in empty data");
            }

            // Create blob with proper MIME type
            const mimeType = this.mediaRecorder.mimeType || "video/mp4";
            const videoBlob = new Blob(this.recordedChunks, { type: mimeType });

            console.log(
              "Created blob size:",
              videoBlob.size,
              "type:",
              videoBlob.type
            );

            // Check if blob is empty
            if (videoBlob.size === 0) {
              throw new Error("Video recording resulted in empty file");
            }

            const timestamp = new Date()
              .toISOString()
              .replace(/[:.]/g, "-")
              .replace("T", "_")
              .split(".")[0];
            const filename = `video_${timestamp}.mp4`;

            // Create file with correct MIME type
            const videoFile = new File([videoBlob], filename, {
              type: "video/mp4",
              lastModified: Date.now(),
            });

            console.log("Created file:", {
              name: videoFile.name,
              size: videoFile.size,
              type: videoFile.type,
              lastModified: videoFile.lastModified,
            });

            // Get video metadata
            const videoMetadata = await this.getVideoMetadata(videoBlob);
            console.log("Video metadata:", videoMetadata);

            const result = {
              success: true,
              videoFile,
              videoBlob,
              duration: this.getRecordingDuration(),
              flags: this.flags,
              metadata: {
                mediaType: "video",
                duration: videoMetadata.duration,
                dimensions: videoMetadata.dimensions,
                flags: this.flags.map((flag) => ({
                  id: flag.id,
                  timestamp: flag.timestamp,
                  coordinates: {
                    x: (flag.coordinates.x / flag.dimensions.width) * 100,
                    y: (flag.coordinates.y / flag.dimensions.height) * 100,
                  },
                  type: flag.type,
                  dimensions: flag.dimensions,
                })),
              },
            };

            console.log("Recording completed successfully:", {
              fileSize: result.videoFile.size,
              duration: result.duration,
              flagCount: result.flags.length,
            });

            this.cleanup();
            resolve(result);
          } catch (error) {
            console.error("Error processing recorded video:", error);
            this.cleanup();
            resolve({
              success: false,
              error: error.message,
            });
          }
        };

        this.mediaRecorder.onerror = (event) => {
          clearTimeout(timeout);
          console.error("MediaRecorder error during stop:", event.error);
          this.cleanup();
          reject(new Error("MediaRecorder error: " + event.error));
        };

        // Stop the recorder
        console.log(
          "Calling MediaRecorder.stop(), current state:",
          this.mediaRecorder.state
        );
        this.mediaRecorder.stop();

        // Update our flags immediately
        this.isRecording = false;
        this.isPaused = false;
      });
    } catch (error) {
      console.error("Failed to stop video recording:", error);
      this.cleanup();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Pause video recording
   */
  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
      this.isPaused = true;
      return true;
    }
    return false;
  }

  /**
   * Resume video recording
   */
  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
      this.isPaused = false;
      return true;
    }
    return false;
  }

  /**
   * Add flag during recording or preview
   */
  addFlag(coordinates, type, dimensions, isPreview = false) {
    const flag = {
      id: this.generateFlagId(),
      coordinates: { ...coordinates },
      type,
      dimensions: { ...dimensions },
      timestamp: isPreview ? null : this.getCurrentTimestamp(),
    };

    if (isPreview) {
      this.previewFlags.push(flag);
      console.log("Added preview flag:", flag);
    } else {
      this.flags.push(flag);
      console.log("Added recording flag:", flag);
    }

    return flag;
  }

  /**
   * Add flag during recording with percentage coordinates
   */
  addFlagWithPercentage(x, y, type, containerWidth, containerHeight) {
    const flag = {
      id: this.generateFlagId(),
      coordinates: {
        x: (x / containerWidth) * 100,
        y: (y / containerHeight) * 100,
      },
      type,
      dimensions: {
        width: containerWidth,
        height: containerHeight,
      },
      timestamp: this.getCurrentTimestamp(),
    };

    this.flags.push(flag);
    console.log("Added percentage flag:", flag);
    return flag;
  }

  /**
   * Get current recording timestamp
   */
  getCurrentTimestamp() {
    if (!this.recordingStartTime) return 0;
    return Date.now() - this.recordingStartTime;
  }

  /**
   * Get total recording duration
   */
  getRecordingDuration() {
    if (!this.recordingStartTime) return 0;
    return Date.now() - this.recordingStartTime;
  }

  /**
   * Generate unique flag ID
   */
  generateFlagId() {
    return `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(videoBlob) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(videoBlob);

      video.addEventListener("loadedmetadata", () => {
        const metadata = {
          duration: video.duration * 1000, // Convert to milliseconds
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight,
          },
        };
        URL.revokeObjectURL(url);
        console.log("Extracted video metadata:", metadata);
        resolve(metadata);
      });

      video.addEventListener("error", (error) => {
        console.error("Error loading video metadata:", error);
        URL.revokeObjectURL(url);
        resolve({
          duration: 0,
          dimensions: { width: 1920, height: 1080 },
        });
      });

      video.src = url;
    });
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log("Cleaning up video recording service");

    if (this.mediaRecorder) {
      if (
        this.mediaRecorder.state === "recording" ||
        this.mediaRecorder.state === "paused"
      ) {
        console.log("Stopping active MediaRecorder");
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      this.stream = null;
    }

    this.recordedChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.recordingStartTime = null;
    this.flags = [];
    this.previewFlags = [];

    console.log("Cleanup completed");
  }

  /**
   * Get current recording state
   */
  getRecordingState() {
    return {
      isRecording: this.mediaRecorder
        ? this.mediaRecorder.state === "recording"
        : false,
      isPaused: this.mediaRecorder
        ? this.mediaRecorder.state === "paused"
        : false,
      mediaRecorderState: this.mediaRecorder?.state || "none",
      duration: this.getRecordingDuration(),
      flagCount: this.flags.length + this.previewFlags.length,
      chunksCount: this.recordedChunks.length,
      hasStream: !!this.stream,
    };
  }

  /**
   * Check if device supports video recording
   */
  async checkVideoRecordingSupport() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream.getTracks().forEach((track) => track.stop());

      return {
        supported: true,
        mediaRecorder: !!window.MediaRecorder,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
      };
    } catch (error) {
      return {
        supported: false,
        error: error.message,
      };
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: this.isAvailable,
      platform: Capacitor.getPlatform(),
      permissions: this.permissionsGranted,
      isNative: Capacitor.isNativePlatform(),
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      webRTCSupported: this.isWebRTCSupported(),
      currentState: this.getRecordingState(),
    };
  }
}

export default new VideoCameraService();
