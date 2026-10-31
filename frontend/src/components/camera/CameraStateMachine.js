/**
 * Camera State Machine and Lifecycle Evaluator
 * 
 * Defines 15 explicit camera states with exact user-facing error messages
 * and continuous multi-factor stream health evaluation (track state, enabled state,
 * muted state, video rendering, pixel luminance shutter detection, and facial presence).
 */

export const CameraState = {
  NOT_REQUESTED: 'NOT_REQUESTED',
  REQUESTING_PERMISSION: 'REQUESTING_PERMISSION',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  CAMERA_ACTIVE: 'CAMERA_ACTIVE',
  CAMERA_DISABLED: 'CAMERA_DISABLED',
  CAMERA_CLOSED: 'CAMERA_CLOSED',
  CAMERA_DISCONNECTED: 'CAMERA_DISCONNECTED',
  CAMERA_TRACK_ENDED: 'CAMERA_TRACK_ENDED',
  NO_CAMERA_FOUND: 'NO_CAMERA_FOUND',
  CAMERA_IN_USE: 'CAMERA_IN_USE',
  CAMERA_MUTED: 'CAMERA_MUTED',
  VIDEO_NOT_RENDERING: 'VIDEO_NOT_RENDERING',
  FACE_NOT_DETECTED: 'FACE_NOT_DETECTED',
  FACE_PARTIALLY_VISIBLE: 'FACE_PARTIALLY_VISIBLE',
  MULTIPLE_FACES: 'MULTIPLE_FACES',
  CAMERA_ERROR: 'CAMERA_ERROR'
};

export const CAMERA_MESSAGES = {
  [CameraState.NOT_REQUESTED]: 'Camera access has not been requested yet.',
  [CameraState.REQUESTING_PERMISSION]: 'Requesting camera access from your browser...',
  [CameraState.CAMERA_DISABLED]: 'Your camera is not enabled. Please enable your camera to continue.',
  [CameraState.PERMISSION_DENIED]: 'Camera permission has been denied. Allow camera access in your browser settings and try again.',
  [CameraState.CAMERA_CLOSED]: 'Your camera has been turned off. Please turn it on again to continue the interview.',
  [CameraState.CAMERA_DISCONNECTED]: 'Your camera has been disconnected. Reconnect your camera to resume.',
  [CameraState.CAMERA_TRACK_ENDED]: 'Camera access has ended. Please reconnect your camera.',
  [CameraState.NO_CAMERA_FOUND]: 'No camera was detected on your device.',
  [CameraState.CAMERA_IN_USE]: 'Your camera may be in use by another application. Close other applications using the camera and try again.',
  [CameraState.CAMERA_MUTED]: 'Your camera stream is temporarily unavailable. Check your camera settings.',
  [CameraState.VIDEO_NOT_RENDERING]: 'Camera access is available, but the video preview is not working. Please retry.',
  [CameraState.FACE_NOT_DETECTED]: 'No face detected. Please position yourself in front of the camera.',
  [CameraState.FACE_PARTIALLY_VISIBLE]: 'Your face is partially outside the frame. Adjust your camera position.',
  [CameraState.MULTIPLE_FACES]: 'Multiple faces detected. Please ensure that only the interview candidate is visible.',
  [CameraState.CAMERA_ACTIVE]: 'Camera is active and functioning properly.',
  [CameraState.CAMERA_ERROR]: 'An unexpected camera error occurred. Please reconnect your device.'
};

/**
 * Maps standard DOMException errors from navigator.mediaDevices.getUserMedia()
 */
export function mapGetUserMediaError(error) {
  if (!error) return CameraState.CAMERA_ERROR;
  const name = error.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return CameraState.PERMISSION_DENIED;
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return CameraState.NO_CAMERA_FOUND;
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return CameraState.CAMERA_IN_USE;
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return CameraState.VIDEO_NOT_RENDERING;
  }
  return CameraState.CAMERA_ERROR;
}

/**
 * Continuous multi-factor stream health evaluator.
 * Evaluates:
 * 1. Stream existence & active state
 * 2. Video track readyState ('ended' vs 'live')
 * 3. Track enabled property (explicitly detects when camera is turned off)
 * 4. Track muted property (detects hardware interruption / shutter)
 * 5. HTML5 Video rendering dimensions (videoWidth / videoHeight)
 * 6. Pixel luminance inspection (detects blacked-out hardware shutter / OS privacy blanking)
 * 7. Facial landmark results (face presence, centering, multiple persons)
 */
export function evaluateCameraStream({
  stream = null,
  videoElement = null,
  canvasElement = null,
  faceEvaluation = null,
  isExplicitlyDisabled = false
} = {}) {
  if (isExplicitlyDisabled) {
    return CameraState.CAMERA_DISABLED;
  }

  if (!stream) {
    return CameraState.CAMERA_DISABLED;
  }

  // 1. Stream activity check
  if (!stream.active) {
    const tracks = stream.getVideoTracks();
    if (tracks.length > 0 && tracks.every((t) => t.readyState === 'ended')) {
      return CameraState.CAMERA_TRACK_ENDED;
    }
    return CameraState.CAMERA_DISCONNECTED;
  }

  // 2. Video track validation
  const tracks = stream.getVideoTracks();
  if (!tracks || tracks.length === 0) {
    return CameraState.CAMERA_DISCONNECTED;
  }

  const track = tracks[0];

  // 3. Track ended
  if (track.readyState === 'ended') {
    return CameraState.CAMERA_TRACK_ENDED;
  }

  // 4. Track disabled (camera explicitly turned off by user or application)
  if (!track.enabled) {
    return CameraState.CAMERA_CLOSED;
  }

  // 5. Track muted (camera stream temporarily suspended by OS / browser)
  if (track.muted) {
    return CameraState.CAMERA_MUTED;
  }

  // 6. Video element dimensions & rendering check
  if (videoElement) {
    if (
      videoElement.readyState >= 2 &&
      (videoElement.videoWidth === 0 || videoElement.videoHeight === 0)
    ) {
      return CameraState.VIDEO_NOT_RENDERING;
    }
  }

  // 7. Physical Shutter / Blanking Detection via Canvas Pixel Luminance
  if (canvasElement && videoElement && videoElement.readyState >= 2) {
    try {
      const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvasElement.width = 32;
        canvasElement.height = 24;
        ctx.drawImage(videoElement, 0, 0, 32, 24);
        const imgData = ctx.getImageData(0, 0, 32, 24).data;

        let totalLuminance = 0;
        let isSolidBlack = true;
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;
          if (r > 3 || g > 3 || b > 3) {
            isSolidBlack = false;
          }
        }

        // If video stream is delivering pitch black (luminance ~ 0 for all pixels), shutter is closed
        if (isSolidBlack) {
          return CameraState.CAMERA_CLOSED;
        }
      }
    } catch (e) {
      // Ignore canvas read error
    }
  }

  // 8. Facial Landmark Observation
  if (faceEvaluation) {
    if (faceEvaluation.multipleFaces) {
      return CameraState.MULTIPLE_FACES;
    }
    if (faceEvaluation.partiallyVisible) {
      return CameraState.FACE_PARTIALLY_VISIBLE;
    }
    if (!faceEvaluation.facePresent) {
      return CameraState.FACE_NOT_DETECTED;
    }
  }

  return CameraState.CAMERA_ACTIVE;
}

