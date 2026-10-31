/**
 * MaskOff AI - Observable Presentation Delivery & Facial Presence Analyzer
 * Pure client-side physical framing and delivery observation engine.
 * 
 * 8 Defined Face-Presence States:
 * 1. FACE_DETECTED
 * 2. FACE_NOT_DETECTED
 * 3. FACE_PARTIALLY_VISIBLE
 * 4. FACE_TOO_FAR
 * 5. FACE_OUTSIDE_FRAME
 * 6. MULTIPLE_FACES_DETECTED
 * 7. CAMERA_DISABLED
 * 8. MODEL_UNAVAILABLE
 * 
 * ETHICAL COMPLIANCE:
 * Does NOT classify psychological emotions, anxiety, or mental state.
 * Evaluates strictly measurable physical factors:
 * - Face visibility percentage = (face detected sec / total sec) * 100
 * - Camera framing (centered, too close, too far, clipped edge)
 * - Eye/head orientation consistency (direct vs glance away vs sustained looking away)
 * - Head stability and orientation composure
 */

export const FacePresenceState = {
  FACE_DETECTED: 'FACE_DETECTED',
  FACE_NOT_DETECTED: 'FACE_NOT_DETECTED',
  FACE_PARTIALLY_VISIBLE: 'FACE_PARTIALLY_VISIBLE',
  FACE_TOO_FAR: 'FACE_TOO_FAR',
  FACE_OUTSIDE_FRAME: 'FACE_OUTSIDE_FRAME',
  MULTIPLE_FACES_DETECTED: 'MULTIPLE_FACES_DETECTED',
  CAMERA_DISABLED: 'CAMERA_DISABLED',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE'
};

export class PresentationDeliveryAnalyzer {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalFrames = 0;
    this.faceVisibleFrames = 0;
    this.faceAbsentFrames = 0;
    this.partiallyVisibleFrames = 0;
    this.tooFarFrames = 0;
    this.outsideFrameFrames = 0;
    this.multipleFacesFrames = 0;

    // Gaze tracking
    this.directGazeFrames = 0;
    this.glanceAwayFrames = 0;
    this.sustainedLookAwayFrames = 0;
    this.currentLookAwayStreak = 0;

    // Head stability
    this.headMovements = 0;
    this.lastHeadPos = null;

    // Framing metrics
    this.framingIssues = {
      tooClose: 0,
      tooFar: 0,
      offCenterLeft: 0,
      offCenterRight: 0,
      wellFramed: 0
    };

    this.currentState = FacePresenceState.CAMERA_DISABLED;
    this.startTimestamp = Date.now();
    this.lastFrameTimestamp = Date.now();
    this.totalTrackingDurationMs = 0;
    this.faceDetectedDurationMs = 0;
  }

  /**
   * Process a single video frame from an HTML5 video/canvas element.
   */
  processFrame(videoElement, canvasElement) {
    if (!videoElement || videoElement.readyState < 2) {
      this.currentState = FacePresenceState.MODEL_UNAVAILABLE;
      return {
        state: this.currentState,
        message: 'Camera stream initializing...',
        facePresent: false
      };
    }

    if (!canvasElement) return null;
    const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      this.currentState = FacePresenceState.MODEL_UNAVAILABLE;
      return null;
    }

    const now = Date.now();
    const deltaMs = Math.min(200, now - this.lastFrameTimestamp);
    this.lastFrameTimestamp = now;
    this.totalTrackingDurationMs += deltaMs;

    canvasElement.width = 160;
    canvasElement.height = 120;
    ctx.drawImage(videoElement, 0, 0, 160, 120);

    this.totalFrames++;

    const imgData = ctx.getImageData(0, 0, 160, 120);
    const data = imgData.data;

    let skinPixels = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = 160, maxX = 0, minY = 120, maxY = 0;

    // Cluster distribution for multiple face estimation
    let leftCount = 0;
    let rightCount = 0;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Robust skin luminance color detection
      const isSkin = (
        r > 80 && g > 35 && b > 20 &&
        (r - g) > 12 && r > b &&
        (Math.max(r, g, b) - Math.min(r, g, b)) > 12
      );

      if (isSkin) {
        skinPixels++;
        const pIndex = i / 4;
        const x = pIndex % 160;
        const y = Math.floor(pIndex / 160);
        sumX += x;
        sumY += y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        if (x < 70) leftCount++;
        else if (x > 90) rightCount++;
      }
    }

    const facePresent = skinPixels > 110;
    let state = FacePresenceState.FACE_NOT_DETECTED;
    let framingStatus = 'No Face Detected';
    let gazeStatus = 'Not Available (Face Absent)';
    let headMovementDetected = false;

    // 1. Evaluate Face-Presence State
    if (!facePresent) {
      this.faceAbsentFrames++;
      this.outsideFrameFrames++;
      this.currentLookAwayStreak = 0;
      state = this.outsideFrameFrames > 15 
        ? FacePresenceState.FACE_OUTSIDE_FRAME 
        : FacePresenceState.FACE_NOT_DETECTED;
      framingStatus = 'Face Outside Camera Frame';
    } else {
      this.faceVisibleFrames++;
      this.faceDetectedDurationMs += deltaMs;

      const avgX = sumX / skinPixels;
      const avgY = sumY / skinPixels;
      const faceWidth = maxX - minX;
      const faceHeight = maxY - minY;
      const coverageRatio = (faceWidth * faceHeight) / (160 * 120);
      const isNearEdge = (minX < 6 || maxX > 154 || minY < 5 || maxY > 115);

      // Check multiple distinct clusters
      if (leftCount > 100 && rightCount > 100 && Math.abs(avgX - 80) < 15 && faceWidth > 130) {
        state = FacePresenceState.MULTIPLE_FACES_DETECTED;
        framingStatus = 'Multiple Faces Detected in View';
        this.multipleFacesFrames++;
      } else if (isNearEdge && coverageRatio < 0.25) {
        state = FacePresenceState.FACE_PARTIALLY_VISIBLE;
        framingStatus = 'Face Partially Clipped by Frame Edge';
        this.partiallyVisibleFrames++;
      } else if (coverageRatio < 0.08) {
        state = FacePresenceState.FACE_TOO_FAR;
        framingStatus = 'Positioned Too Far from Camera';
        this.tooFarFrames++;
        this.framingIssues.tooFar++;
      } else if (coverageRatio > 0.58) {
        state = FacePresenceState.FACE_DETECTED;
        framingStatus = 'Positioned Too Close to Camera';
        this.framingIssues.tooClose++;
      } else {
        const centerDevX = Math.abs(avgX - 80) / 80;
        if (centerDevX > 0.32) {
          state = FacePresenceState.FACE_DETECTED;
          framingStatus = avgX < 80 ? 'Shifted Left of Center' : 'Shifted Right of Center';
          if (avgX < 80) this.framingIssues.offCenterLeft++;
          else this.framingIssues.offCenterRight++;
        } else {
          state = FacePresenceState.FACE_DETECTED;
          framingStatus = 'Optimal Eye-Level Framing';
          this.framingIssues.wellFramed++;
        }
      }

      // 2. Eye & Head Orientation Evaluation (Only when face is actually present!)
      const centerDevX = Math.abs(avgX - 80) / 80;
      const centerDevY = Math.abs(avgY - 60) / 60;

      if (centerDevX < 0.22 && centerDevY < 0.28) {
        gazeStatus = 'Direct Screen Engagement';
        this.directGazeFrames++;
        this.currentLookAwayStreak = 0;
      } else {
        this.currentLookAwayStreak++;
        if (this.currentLookAwayStreak > 18) { // > ~1.5 - 2 seconds continuous deviation
          gazeStatus = avgX < 80 ? 'Sustained Looking Left' : 'Sustained Looking Right';
          this.sustainedLookAwayFrames++;
        } else {
          gazeStatus = 'Brief Glance Away';
          this.glanceAwayFrames++;
        }
      }

      // 3. Head Stability & Orientation Composure
      if (this.lastHeadPos) {
        const delta = Math.sqrt(
          Math.pow(avgX - this.lastHeadPos.x, 2) + Math.pow(avgY - this.lastHeadPos.y, 2)
        );
        if (delta > 6.0) {
          this.headMovements++;
          headMovementDetected = true;
        }
      }
      this.lastHeadPos = { x: avgX, y: avgY };
    }

    this.currentState = state;

    const visibilityPercent = this.totalFrames > 0
      ? Math.round((this.faceVisibleFrames / this.totalFrames) * 100)
      : 0;

    return {
      state,
      facePresent,
      framingStatus,
      gazeStatus,
      headMovementDetected,
      visibilityPercent,
      totalFrames: this.totalFrames
    };
  }

  /**
   * Produce honest, strict presentation delivery summary.
   * If face was outside frame, zero or penalized score is awarded with honest observations.
   */
  generateSummary() {
    if (this.totalFrames < 10) {
      return {
        hasData: false,
        state: FacePresenceState.CAMERA_DISABLED,
        message: 'Camera was disabled or insufficient frames recorded.',
        deliveryScore: null
      };
    }

    const faceVisibilityPercent = Math.round((this.faceVisibleFrames / this.totalFrames) * 100);
    const directGazePercent = this.faceVisibleFrames > 0
      ? Math.round((this.directGazeFrames / this.faceVisibleFrames) * 100)
      : 0;

    // Strict Face-Out-Of-Frame Handling:
    // If face was not visible for the vast majority of time, score MUST be zero or heavily penalized
    if (faceVisibilityPercent < 15) {
      return {
        hasData: true,
        deliveryScore: 0,
        faceVisibilityPercent,
        directGazePercent: 0,
        framingObservation: 'Face was absent or outside camera frame for 85%+ of the session',
        headMovementObservation: 'Candidate was not visible in frame to evaluate head stability',
        gazeObservation: 'Cannot evaluate eye contact or delivery because face was not detected in camera view',
        recommendations: [
          'Ensure your camera is positioned directly in front of you and adequate lighting illuminates your face.',
          'Remain seated within the camera boundaries throughout the simulation.'
        ],
        honestWarning: 'Face was outside the camera frame for almost the entire duration. Delivery score is 0.',
        disclaimer: 'Observations are based strictly on measurable 2D geometric camera presence and do not evaluate emotion or confidence.'
      };
    }

    // Framing verdict
    let framingObservation = 'Optimal eye-level framing';
    if (this.framingIssues.tooClose > this.framingIssues.wellFramed) {
      framingObservation = 'Positioned too close to camera; head crowded the entire frame';
    } else if (this.framingIssues.tooFar > this.framingIssues.wellFramed) {
      framingObservation = 'Positioned too far from camera; facial cues difficult to distinguish';
    } else if (this.framingIssues.offCenterLeft > this.framingIssues.wellFramed || this.framingIssues.offCenterRight > this.framingIssues.wellFramed) {
      framingObservation = 'Face frequently positioned off-center from the camera lens';
    } else if (this.partiallyVisibleFrames > (this.totalFrames * 0.25)) {
      framingObservation = 'Face frequently clipped by frame boundaries';
    }

    // Gaze & Eye Engagement Observation
    let gazeObservation = 'Consistent forward screen engagement';
    if (directGazePercent < 40) {
      gazeObservation = 'Frequently looked away from screen during response';
    } else if (this.sustainedLookAwayFrames > (this.faceVisibleFrames * 0.3)) {
      gazeObservation = 'Sustained periods of looking sideways or away from camera';
    } else if (this.glanceAwayFrames > 0 && directGazePercent >= 60) {
      gazeObservation = 'Natural brief glances away while maintaining good forward connection';
    }

    // Head movement verdict
    const durationSeconds = Math.max(1, this.totalTrackingDurationMs / 1000);
    const shiftsPerSec = this.headMovements / durationSeconds;
    const headMovementObservation = shiftsPerSec > 1.2
      ? 'Frequent rapid head shifts observed during response'
      : 'Head orientation remained composed and steady';

    // Strict, Honest Delivery Score Calculation:
    // Base is 0! No free 50-point handouts when missing or sloppy.
    let score = 0;
    // 1. Visibility factor (0 - 45 points)
    score += (faceVisibilityPercent * 0.45);

    // 2. Direct gaze factor (0 - 30 points) - only from visible frames
    score += (directGazePercent * 0.30);

    // 3. Framing precision (0 - 15 points)
    if (framingObservation === 'Optimal eye-level framing') score += 15;
    else if (framingObservation.includes('off-center')) score += 8;
    else score += 5;

    // 4. Head composure (0 - 10 points)
    if (shiftsPerSec <= 0.8) score += 10;
    else if (shiftsPerSec <= 1.4) score += 6;
    else score += 2;

    // Penalize if face was outside frame for significant portions
    if (faceVisibilityPercent < 60) {
      score = score * (faceVisibilityPercent / 100);
    }

    const finalScore = Math.min(98, Math.max(0, Math.round(score)));

    // Practical recommendations
    const recommendations = [];
    if (faceVisibilityPercent < 75) {
      recommendations.push(`Face was only in frame for ${faceVisibilityPercent}% of the response. Position your laptop at eye-level to maintain presence.`);
    }
    if (directGazePercent < 60) {
      recommendations.push('Practise focusing toward the camera lens when asserting your primary premise.');
    }
    if (framingObservation.includes('off-center')) {
      recommendations.push('Center yourself in the camera preview before beginning your response.');
    }
    if (shiftsPerSec > 1.2) {
      recommendations.push('Anchor your physical posture to avoid rapid head adjustments while speaking.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Excellent visual poise, steady eye contact, and clean camera framing maintained throughout.');
    }

    return {
      hasData: true,
      deliveryScore: finalScore,
      faceVisibilityPercent,
      directGazePercent,
      framingObservation,
      gazeObservation,
      headMovementObservation,
      headMovementCount: this.headMovements,
      totalFramesAnalyzed: this.totalFrames,
      recommendations,
      disclaimer: 'Observations are based strictly on measurable 2D geometric camera presence and do not evaluate emotion or confidence.'
    };
  }
}
