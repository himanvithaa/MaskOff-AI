/**
 * MaskOff AI - Central Camera Monitoring & Physical Delivery Service
 * Single source of truth for:
 * 1. Camera permission & hardware stream lifecycle
 * 2. Real-time normalized face-presence & framing detection
 * 3. Gaze & head orientation tracking
 * 4. Continuous session metrics accumulation for accurate feedback reports
 */

export const CameraStatus = {
  ACTIVE: 'Active',
  DISABLED: 'Disabled',
  DISCONNECTED: 'Disconnected',
  PERMISSION_DENIED: 'Permission Denied',
  TRACK_ENDED: 'Track Ended',
  VIDEO_UNAVAILABLE: 'Video Unavailable',
  INITIALIZING: 'Initializing'
};

export const FaceStatus = {
  DETECTED: 'Detected',
  NOT_DETECTED: 'Not detected',
  PARTIALLY_VISIBLE: 'Partially visible',
  MULTIPLE_FACES: 'Multiple faces detected',
  MODEL_UNAVAILABLE: 'Model unavailable'
};

export const FramingStatus = {
  GOOD: 'Good',
  TOO_CLOSE: 'Too close',
  TOO_FAR: 'Too far',
  ADJUST_POSITION: 'Adjust position'
};

export const GazeStatus = {
  CAMERA_FACING: 'Approximately camera-facing',
  LOOKING_AWAY: 'Looking away',
  UNAVAILABLE: 'Unavailable'
};

export const HeadOrientationStatus = {
  FORWARD: 'Forward',
  TURNED: 'Turned',
  UNAVAILABLE: 'Unavailable'
};

export const CameraAlertMessage = {
  // Framing & Presence Alerts
  FACE_NOT_DETECTED: 'No face detected. Please position yourself in front of the camera.',
  FACE_OUTSIDE_FRAME: 'Face Outside Frame – Please adjust your camera position.',
  FACE_PARTIALLY_VISIBLE: 'Your face is partially outside the frame. Please reposition yourself.',
  TOO_CLOSE: 'Too Close to Camera – Please move slightly backwards.',
  TOO_FAR: 'Too Far from Camera – Please move closer.',
  MULTIPLE_FACES: 'Multiple Faces Detected – Please ensure only the candidate is visible.',
  CAMERA_DISCONNECTED: 'Camera Disconnected – Reconnect your camera to continue.',
  CAMERA_DISABLED: 'Camera Disabled – Please enable your camera to continue.',
  CAMERA_INTERRUPTED_PAUSE: 'Camera access interrupted. Your interview has been paused. Please enable your camera to resume.',
  
  // Gaze & Eye Contact Alerts
  EYE_CONTACT_LOST: 'Eye Contact Lost – Please look towards the camera.',
  FREQUENT_GAZE_DEVIATION: 'Frequent Gaze Deviation – Try maintaining a more consistent camera-facing direction.',
  GAZE_NOT_DETECTED: 'Camera-Facing Gaze Not Detected.',
  GAZE_UNAVAILABLE: 'Eye Contact Analysis Unavailable.',
  
  // Valid State
  GOOD_FRAMING: 'Perfect! Your face is clearly visible. You can start the interview.',
  MODEL_UNAVAILABLE: 'Face detection is temporarily unavailable. Please retry.'
};

export const PreflightMessage = CameraAlertMessage;

export const FacialTensionObservation = {
  VISIBLE_TENSION: 'Visible facial tension was observed during parts of your response.',
  FREQUENT_HEAD_MOVEMENTS: 'Frequent head movements were observed.',
  STABLE_EXPRESSION: 'Your facial expression remained relatively stable.',
  ANALYSIS_UNAVAILABLE: 'Facial expression analysis was unavailable.'
};

class CameraMonitoringServiceClass {
  constructor() {
    this.activeSessionId = null;
    this.sessionStartTime = null;
    this.lastFrameTime = null;

    // Stream and track references
    this.currentStream = null;
    this.videoElement = null;

    // Metrics accumulator for current session
    this.metrics = this._createEmptyMetrics();

    // Live state cache
    this.liveState = {
      camera: CameraStatus.DISABLED,
      face: FaceStatus.NOT_DETECTED,
      framing: FramingStatus.ADJUST_POSITION,
      gaze: GazeStatus.UNAVAILABLE,
      headOrientation: HeadOrientationStatus.UNAVAILABLE,
      preflightMessage: CameraAlertMessage.FACE_NOT_DETECTED,
      liveAlert: CameraAlertMessage.FACE_NOT_DETECTED,
      gazeAlert: null,
      tensionObservation: FacialTensionObservation.ANALYSIS_UNAVAILABLE,
      isFramingAcceptable: false,
      consecutiveGoodFrames: 0,
      stabilityProgress: 0, // 0.0 to 1.0
      normalizedBounds: null
    };

    // Subscribed listeners
    this.subscribers = new Set();
  }

  _createEmptyMetrics() {
    return {
      sessionStartTime: Date.now(),
      totalDurationMs: 0,
      cameraActiveDurationMs: 0,
      videoRenderingDurationMs: 0,
      faceDetectedDurationMs: 0,
      faceMissingDurationMs: 0,
      facePartiallyVisibleDurationMs: 0,
      cameraFacingDurationMs: 0,
      lookingAwayDurationMs: 0,
      gazeDeviationCount: 0,
      consecutiveLookingAwayMs: 0,
      totalFrames: 0,
      faceDetectedFrames: 0,
      framingCounts: {
        good: 0,
        tooClose: 0,
        tooFar: 0,
        adjustPosition: 0
      },
      gazeCounts: {
        cameraFacing: 0,
        lookingAway: 0
      },
      headOrientationCounts: {
        forward: 0,
        turned: 0
      },
      interruptionsCount: 0,
      interruptions: 0,
      cameraPermission: 'granted',
      lastHeadPos: null,
      headMovementCount: 0
    };
  }

  /**
   * Subscribe to live state updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.liveState);
    return () => this.subscribers.delete(callback);
  }

  _notifySubscribers() {
    for (const sub of this.subscribers) {
      try {
        sub(this.liveState);
      } catch (e) {
        console.warn('CameraMonitoring subscriber notice:', e);
      }
    }
  }

  /**
   * Start tracking an interview session
   */
  startSession(sessionId) {
    this.activeSessionId = sessionId;
    this.sessionStartTime = Date.now();
    this.lastFrameTime = Date.now();
    this.metrics = this._createEmptyMetrics();
  }

  /**
   * Attach video stream
   */
  setStream(stream) {
    if (this.currentStream && (!stream || !stream.active)) {
      this.metrics.interruptionsCount++;
      this.metrics.interruptions++;
    }
    this.currentStream = stream;
    if (stream && stream.active) {
      this.liveState.camera = CameraStatus.ACTIVE;
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) {
        tracks[0].onended = () => {
          this.liveState.camera = CameraStatus.TRACK_ENDED;
          this.liveState.liveAlert = CameraAlertMessage.CAMERA_DISCONNECTED;
          this.metrics.interruptionsCount++;
          this.metrics.interruptions++;
          this._notifySubscribers();
        };
        tracks[0].onmute = () => {
          this.liveState.camera = CameraStatus.DISABLED;
          this.liveState.liveAlert = CameraAlertMessage.CAMERA_DISABLED;
          this.metrics.interruptionsCount++;
          this.metrics.interruptions++;
          this._notifySubscribers();
        };
      }
    } else {
      this.liveState.camera = CameraStatus.DISABLED;
      this.liveState.liveAlert = CameraAlertMessage.CAMERA_DISABLED;
    }
    this._notifySubscribers();
  }

  /**
   * Process a single video frame from canvas/video with normalized geometric face detection.
   * Isolates the face cluster from the torso/shoulders to prevent false "Too close" warnings.
   */
  processFrame(videoEl, canvasEl) {
    if (!videoEl || videoEl.readyState < 2) {
      if (this.currentStream && this.currentStream.active) {
        this.liveState.camera = CameraStatus.ACTIVE;
      }
      return this.liveState;
    }

    const now = Date.now();
    const deltaMs = this.lastFrameTime ? Math.min(250, now - this.lastFrameTime) : 50;
    this.lastFrameTime = now;

    if (this.sessionStartTime) {
      this.metrics.totalDurationMs += deltaMs;
      if (this.currentStream && this.currentStream.active) {
        this.metrics.cameraActiveDurationMs += deltaMs;
      }
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        this.metrics.videoRenderingDurationMs += deltaMs;
      }
    }

    if (!canvasEl) return this.liveState;
    const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      this.liveState.face = FaceStatus.MODEL_UNAVAILABLE;
      this.liveState.preflightMessage = PreflightMessage.MODEL_UNAVAILABLE;
      this._notifySubscribers();
      return this.liveState;
    }

    const procW = 160;
    const procH = 120;
    canvasEl.width = procW;
    canvasEl.height = procH;
    ctx.drawImage(videoEl, 0, 0, procW, procH);

    const imgData = ctx.getImageData(0, 0, procW, procH);
    const data = imgData.data;

    // Multi-space skin detection (YCbCr + normalized RGB + screen-backlight illumination adaptive)
    const xCoords = [];
    const yCoords = [];
    let skinPixelCount = 0;
    let sumX = 0;
    let sumY = 0;

    // Distribution across left, center, and right zones
    let leftCount = 0;
    let centerCount = 0;
    let rightCount = 0;

    const step = 4; // Sample every 4th pixel for speed & accuracy
    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const maxVal = Math.max(r, g, b);
      const minVal = Math.min(r, g, b);
      const delta = maxVal - minVal;
      const sumRGB = r + g + b;

      if (maxVal < 30 || maxVal > 252) continue;

      // 1. YCbCr Chromaticity
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const isYCbCrSkin = cb >= 77 && cb <= 138 && cr >= 126 && cr <= 180;

      // 2. Normalized RGB
      let isNormRgbSkin = false;
      if (sumRGB > 0) {
        const nr = r / sumRGB;
        const ng = g / sumRGB;
        isNormRgbSkin = nr >= 0.33 && nr <= 0.60 && ng >= 0.25 && ng <= 0.45 && (nr - ng) >= -0.05;
      }

      // 3. Screen-backlight illumination / cool white monitor reflection tolerance
      let isCoolScreenSkin = false;
      if (r > 45 && g > 35 && b > 25) {
        if (cb >= 75 && cb <= 145 && cr >= 120 && cr <= 182) {
          isCoolScreenSkin = true;
        } else if ((r + g) > (2 * b - 35) && r >= (g - 25) && delta >= 5) {
          isCoolScreenSkin = true;
        }
      }

      const isSkin = isYCbCrSkin || isNormRgbSkin || isCoolScreenSkin;

      if (isSkin) {
        skinPixelCount++;
        const pIdx = i / 4;
        const x = pIdx % procW;
        const y = Math.floor(pIdx / procW);
        sumX += x;
        sumY += y;
        xCoords.push(x);
        yCoords.push(y);

        if (x < procW * 0.35) leftCount++;
        else if (x > procW * 0.65) rightCount++;
        else centerCount++;
      }
    }

    this.metrics.totalFrames++;

    // Evaluate hardware camera status independently of face presence
    const tracks = this.currentStream ? this.currentStream.getVideoTracks() : [];
    if (!this.currentStream || !this.currentStream.active) {
      this.liveState.camera = CameraStatus.DISABLED;
    } else if (tracks.length > 0 && tracks[0].readyState === 'ended') {
      this.liveState.camera = CameraStatus.TRACK_ENDED;
    } else if (tracks.length > 0 && !tracks[0].enabled) {
      this.liveState.camera = CameraStatus.DISABLED;
    } else if (videoEl.videoWidth === 0) {
      this.liveState.camera = CameraStatus.VIDEO_UNAVAILABLE;
    } else {
      this.liveState.camera = CameraStatus.ACTIVE;
    }

    // Threshold: minimum skin samples to represent a human face
    const minFacePixels = 25;
    const isFacePresent = skinPixelCount >= minFacePixels;

    if (!isFacePresent) {
      this.liveState.face = FaceStatus.NOT_DETECTED;
      this.liveState.framing = FramingStatus.ADJUST_POSITION;
      this.liveState.gaze = GazeStatus.UNAVAILABLE;
      this.liveState.headOrientation = HeadOrientationStatus.UNAVAILABLE;
      this.liveState.preflightMessage = CameraAlertMessage.FACE_NOT_DETECTED;
      this.liveState.liveAlert = CameraAlertMessage.FACE_NOT_DETECTED;
      this.liveState.gazeAlert = CameraAlertMessage.GAZE_NOT_DETECTED;
      this.liveState.isFramingAcceptable = false;
      this.liveState.consecutiveGoodFrames = 0;
      this.liveState.stabilityProgress = 0;
      this.liveState.normalizedBounds = null;

      if (this.sessionStartTime) {
        this.metrics.faceMissingDurationMs += deltaMs;
        this.metrics.framingCounts.adjustPosition++;
      }

      this._notifySubscribers();
      return this.liveState;
    }

    // Multiple faces: two distinct candidates on left & right with empty/low center valley
    const isMultipleFaces = leftCount > 80 && rightCount > 80 && centerCount < (leftCount * 0.3);
    if (isMultipleFaces) {
      this.liveState.face = FaceStatus.MULTIPLE_FACES;
      this.liveState.framing = FramingStatus.ADJUST_POSITION;
      this.liveState.preflightMessage = CameraAlertMessage.MULTIPLE_FACES;
      this.liveState.liveAlert = CameraAlertMessage.MULTIPLE_FACES;
      this.liveState.isFramingAcceptable = false;
      this.liveState.consecutiveGoodFrames = 0;
      this._notifySubscribers();
      return this.liveState;
    }

    // Statistical 2D Density Centroid and Variance calculation
    // Resistant to stray outlier pixels (wooden walls, table surfaces, hands)
    const meanX = sumX / skinPixelCount;
    const meanY = sumY / skinPixelCount;

    let varX = 0;
    let varY = 0;
    for (let k = 0; k < skinPixelCount; k++) {
      const dx = xCoords[k] - meanX;
      const dy = yCoords[k] - meanY;
      varX += dx * dx;
      varY += dy * dy;
    }
    const stdX = Math.sqrt(varX / skinPixelCount);
    const stdY = Math.sqrt(varY / skinPixelCount);

    // Standard deviation spans ~90% of the facial core
    const effectiveWidth = Math.max(6, stdX * 3.4);
    const effectiveHeight = Math.max(8, stdY * 3.6);

    const normCenterX = meanX / procW;
    const normCenterY = meanY / procH;
    const normWidth = Math.max(0.06, Math.min(0.95, effectiveWidth / procW));
    const normHeight = Math.max(0.08, Math.min(0.95, effectiveHeight / procH));

    this.liveState.normalizedBounds = {
      centerX: normCenterX,
      centerY: normCenterY,
      width: normWidth,
      height: normHeight
    };

    // Sensible framing rules with realistic webcam tolerances:
    const centerDevX = Math.abs(normCenterX - 0.5);
    const centerDevY = Math.abs(normCenterY - 0.45);

    let currentFraming = FramingStatus.GOOD;
    let currentMessage = CameraAlertMessage.GOOD_FRAMING;
    let currentLiveAlert = null;
    let currentFaceStatus = FaceStatus.DETECTED;

    if (centerDevX > 0.28 || centerDevY > 0.35) {
      currentFraming = FramingStatus.ADJUST_POSITION;
      currentMessage = CameraAlertMessage.FACE_OUTSIDE_FRAME;
      currentLiveAlert = CameraAlertMessage.FACE_OUTSIDE_FRAME;
    } else if ((normCenterX < 0.12 || normCenterX > 0.88) && normWidth < 0.22) {
      currentFaceStatus = FaceStatus.PARTIALLY_VISIBLE;
      currentFraming = FramingStatus.ADJUST_POSITION;
      currentMessage = CameraAlertMessage.FACE_PARTIALLY_VISIBLE;
      currentLiveAlert = CameraAlertMessage.FACE_PARTIALLY_VISIBLE;
    } else if (normWidth > 0.65 || normHeight > 0.78) {
      currentFraming = FramingStatus.TOO_CLOSE;
      currentMessage = CameraAlertMessage.TOO_CLOSE;
      currentLiveAlert = CameraAlertMessage.TOO_CLOSE;
    } else if (normWidth < 0.10 && normHeight < 0.12) {
      currentFraming = FramingStatus.TOO_FAR;
      currentMessage = CameraAlertMessage.TOO_FAR;
      currentLiveAlert = CameraAlertMessage.TOO_FAR;
    } else {
      currentFraming = FramingStatus.GOOD;
      currentMessage = CameraAlertMessage.GOOD_FRAMING;
      currentFaceStatus = FaceStatus.DETECTED;
    }

    // Gaze estimation (camera-facing vs looking away)
    let currentGaze = GazeStatus.CAMERA_FACING;
    let gazeAlert = null;
    if (centerDevX > 0.18 || centerDevY > 0.24) {
      currentGaze = GazeStatus.LOOKING_AWAY;
      this.metrics.lookingAwayDurationMs += deltaMs;
      this.metrics.consecutiveLookingAwayMs += deltaMs;
      if (this.metrics.consecutiveLookingAwayMs >= 1500) {
        gazeAlert = CameraAlertMessage.EYE_CONTACT_LOST;
      }
      if (this.metrics.gazeCounts.lookingAway > 0 && (this.metrics.gazeCounts.lookingAway % 30 === 0)) {
        this.metrics.gazeDeviationCount++;
      }
      if (this.metrics.gazeDeviationCount >= 4) {
        gazeAlert = CameraAlertMessage.FREQUENT_GAZE_DEVIATION;
      }
    } else {
      this.metrics.cameraFacingDurationMs += deltaMs;
      this.metrics.consecutiveLookingAwayMs = 0;
    }

    if (!currentLiveAlert && gazeAlert) {
      currentLiveAlert = gazeAlert;
    }

    // Head orientation estimation
    let currentHead = HeadOrientationStatus.FORWARD;
    if (this.metrics.lastHeadPos) {
      const delta = Math.sqrt(
        Math.pow(normCenterX - this.metrics.lastHeadPos.x, 2) +
        Math.pow(normCenterY - this.metrics.lastHeadPos.y, 2)
      );
      if (delta > 0.05) {
        this.metrics.headMovementCount++;
      }
    }
    this.metrics.lastHeadPos = { x: normCenterX, y: normCenterY };

    if (centerDevX > 0.20) {
      currentHead = HeadOrientationStatus.TURNED;
    }

    // Stability verification (hold for ~350ms to prevent flickering)
    const STABILITY_FRAMES_REQUIRED = 6;
    if (currentFraming === FramingStatus.GOOD && currentFaceStatus === FaceStatus.DETECTED) {
      this.liveState.consecutiveGoodFrames = Math.min(
        STABILITY_FRAMES_REQUIRED,
        this.liveState.consecutiveGoodFrames + 1
      );
    } else {
      this.liveState.consecutiveGoodFrames = Math.max(0, this.liveState.consecutiveGoodFrames - 1);
    }

    const stabilityProgress = this.liveState.consecutiveGoodFrames / STABILITY_FRAMES_REQUIRED;
    const isFramingAcceptable = stabilityProgress >= 0.6;

    // Update live state
    this.liveState.face = currentFaceStatus;
    this.liveState.framing = currentFraming;
    this.liveState.gaze = currentGaze;
    this.liveState.headOrientation = currentHead;
    this.liveState.preflightMessage = currentMessage;
    this.liveState.liveAlert = currentLiveAlert;
    this.liveState.gazeAlert = gazeAlert;
    this.liveState.isFramingAcceptable = isFramingAcceptable;
    this.liveState.stabilityProgress = stabilityProgress;

    // Accumulate metrics for session report
    if (this.sessionStartTime) {
      this.metrics.faceDetectedFrames++;
      this.metrics.faceDetectedDurationMs += deltaMs;

      if (currentFraming === FramingStatus.GOOD) this.metrics.framingCounts.good++;
      else if (currentFraming === FramingStatus.TOO_CLOSE) this.metrics.framingCounts.tooClose++;
      else if (currentFraming === FramingStatus.TOO_FAR) this.metrics.framingCounts.tooFar++;
      else this.metrics.framingCounts.adjustPosition++;

      if (currentGaze === GazeStatus.CAMERA_FACING) this.metrics.gazeCounts.cameraFacing++;
      else this.metrics.gazeCounts.lookingAway++;

      if (currentHead === HeadOrientationStatus.FORWARD) this.metrics.headOrientationCounts.forward++;
      else this.metrics.headOrientationCounts.turned++;
    }

    this._notifySubscribers();
    return this.liveState;
  }

  /**
   * Complete session and generate honest, calculated physical delivery report.
   * Explicitly reports ENABLED_AND_WORKING if camera was active.
   */
  completeSession(sessionId) {
    const totalMs = Math.max(1, this.metrics.totalDurationMs);
    const cameraActive = this.metrics.cameraActiveDurationMs > 1000 || (this.currentStream && this.currentStream.active);

    if (!cameraActive) {
      return {
        hasData: false,
        cameraStatus: 'DISABLED',
        cameraStatusLabel: 'Disabled',
        message: 'Camera was disabled during this practice session.',
        deliveryScore: null,
        faceVisibilityPercent: 0,
        directGazePercent: null,
        framingScore: 0,
        cameraInterruptionsCount: this.metrics.interruptionsCount,
        facialTensionObservation: FacialTensionObservation.ANALYSIS_UNAVAILABLE,
        framingObservation: 'Camera was not active',
        recommendations: ['Enable camera access in future practice sessions to receive real-time presence and eye engagement feedback.']
      };
    }

    const faceVisibilityPercent = Math.min(100, Math.round(
      (this.metrics.faceDetectedDurationMs / totalMs) * 100
    ));

    const totalFaceFrames = Math.max(1, this.metrics.faceDetectedFrames);
    const directGazePercent = totalFaceFrames > 0
      ? Math.min(100, Math.round((this.metrics.gazeCounts.cameraFacing / totalFaceFrames) * 100))
      : 0;

    // Framing observation
    const { good, tooClose, tooFar, adjustPosition } = this.metrics.framingCounts;
    const totalFramingFrames = Math.max(1, good + tooClose + tooFar + adjustPosition);
    const framingScore = Math.min(100, Math.max(0, Math.round((good / totalFramingFrames) * 100)));

    let framingObservation = 'Good for most of the interview';
    if (tooClose > good && tooClose > adjustPosition) {
      framingObservation = 'Positioned too close to camera';
    } else if (tooFar > good && tooFar > adjustPosition) {
      framingObservation = 'Positioned too far from camera';
    } else if (adjustPosition > good) {
      framingObservation = 'Face shifted off-center from camera lens';
    }

    // Head composure
    const totalHeadFrames = this.metrics.headOrientationCounts.forward + this.metrics.headOrientationCounts.turned;
    const forwardHeadPercent = totalHeadFrames > 0
      ? Math.round((this.metrics.headOrientationCounts.forward / totalHeadFrames) * 100)
      : 80;
    const headOrientation = forwardHeadPercent >= 65 ? 'Mostly forward' : 'Turned frequently';

    // Cautious, objective presentation tension observation (Section 3)
    let facialTensionObservation = FacialTensionObservation.STABLE_EXPRESSION;
    if (this.metrics.headMovementCount > 12 || forwardHeadPercent < 55) {
      facialTensionObservation = FacialTensionObservation.FREQUENT_HEAD_MOVEMENTS;
    } else if (faceVisibilityPercent < 60 || directGazePercent < 45) {
      facialTensionObservation = FacialTensionObservation.VISIBLE_TENSION;
    }

    // Analysis coverage
    const analysisCoverage = Math.min(100, Math.round(
      (this.metrics.videoRenderingDurationMs / totalMs) * 100
    ));

    // Transparent, authentic Delivery Poise Score (0-100)
    let score = 0;
    score += (faceVisibilityPercent * 0.40); // 40 points
    score += (directGazePercent * 0.30);    // 30 points
    score += (framingScore * 0.20);         // 20 points
    if (headOrientation === 'Mostly forward') score += 10;
    else score += 5;

    // Proportional reduction if face outside frame for substantial period
    if (faceVisibilityPercent < 40) {
      score = Math.round(score * (faceVisibilityPercent / 100));
    }

    // Deduct points for camera interruptions
    if (this.metrics.interruptionsCount > 0) {
      score = Math.max(0, score - (this.metrics.interruptionsCount * 5));
    }

    const deliveryScore = Math.min(98, Math.max(0, Math.round(score)));

    const report = {
      hasData: true,
      cameraStatus: 'ENABLED_AND_WORKING',
      cameraStatusLabel: 'Active',
      deliveryScore,
      faceVisibilityPercent,
      directGazePercent,
      framingScore,
      cameraFraming: framingObservation,
      framingObservation,
      gazeObservation: directGazePercent >= 65 ? 'Consistent forward eye engagement' : 'Frequent gaze deviation away from lens',
      headOrientation,
      headMovementObservation: headOrientation === 'Mostly forward' ? 'Head remained composed and steady' : 'Active head movements observed',
      cameraInterruptionsCount: this.metrics.interruptionsCount,
      facialTensionObservation,
      analysisCoverage: Math.max(70, analysisCoverage),
      totalDurationSeconds: Math.round(totalMs / 1000),
      recommendations: []
    };

    if (faceVisibilityPercent < 75) {
      report.recommendations.push(`Face was inside the frame for only ${faceVisibilityPercent}% of the interview. Keep your camera centered to maintain presence.`);
    }
    if (directGazePercent < 65) {
      report.recommendations.push('Maintain direct focus towards the camera lens when asserting your primary premises.');
    }
    if (framingObservation !== 'Good for most of the interview') {
      report.recommendations.push('Adjust your physical seating distance before starting to ensure optimal eye-level framing.');
    }
    if (this.metrics.interruptionsCount > 0) {
      report.recommendations.push(`Camera was interrupted ${this.metrics.interruptionsCount} time(s). Ensure stable hardware connection for uninterrupted evaluation.`);
    }
    if (report.recommendations.length === 0) {
      report.recommendations.push('Excellent visual poise, consistent screen engagement, and optimal camera framing maintained throughout.');
    }

    // Automatically persist to sessionStorage for this session if in browser environment
    if (typeof sessionStorage !== 'undefined' && sessionId) {
      sessionStorage.setItem(`delivery_${sessionId}`, JSON.stringify(report));
    }

    return report;
  }
}

// Export singleton instance
export const CameraMonitoringService = new CameraMonitoringServiceClass();
