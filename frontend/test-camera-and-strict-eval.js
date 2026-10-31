import { 
  CameraMonitoringService, 
  CameraAlertMessage, 
  FacialTensionObservation, 
  CameraStatus, 
  FaceStatus, 
  FramingStatus, 
  GazeStatus 
} from './src/services/CameraMonitoringService.js';
import { formatInterviewerText, getInterviewer } from './src/config/interviewers.js';

console.log('--- TESTING CAMERA MONITORING & STRICT EVALUATION CONFIGURATION ---');

// 1. Verify CameraAlertMessage constants match requirements exactly
const expectedAlerts = {
  FACE_NOT_DETECTED: 'No face detected. Please position yourself in front of the camera.',
  FACE_OUTSIDE_FRAME: 'Face Outside Frame – Please adjust your camera position.',
  FACE_PARTIALLY_VISIBLE: 'Your face is partially outside the frame. Please reposition yourself.',
  TOO_CLOSE: 'Too Close to Camera – Please move slightly backwards.',
  TOO_FAR: 'Too Far from Camera – Please move closer.',
  MULTIPLE_FACES: 'Multiple Faces Detected – Please ensure only the candidate is visible.',
  CAMERA_DISCONNECTED: 'Camera Disconnected – Reconnect your camera to continue.',
  CAMERA_DISABLED: 'Camera Disabled – Please enable your camera to continue.',
  CAMERA_INTERRUPTED_PAUSE: 'Camera access interrupted. Your interview has been paused. Please enable your camera to resume.',
  EYE_CONTACT_LOST: 'Eye Contact Lost – Please look towards the camera.',
  FREQUENT_GAZE_DEVIATION: 'Frequent Gaze Deviation – Try maintaining a more consistent camera-facing direction.',
  GAZE_NOT_DETECTED: 'Camera-Facing Gaze Not Detected.',
  GAZE_UNAVAILABLE: 'Eye Contact Analysis Unavailable.'
};

for (const [key, expectedStr] of Object.entries(expectedAlerts)) {
  if (CameraAlertMessage[key] !== expectedStr) {
    console.error(`❌ Mismatch for alert [${key}]: Expected "${expectedStr}", got "${CameraAlertMessage[key]}"`);
    process.exit(1);
  }
}
console.log('✅ ALL 13 Camera Alert Messages matched exact specification strings.');

// 2. Verify Facial Tension Observations match cautious descriptions
const expectedTension = {
  VISIBLE_TENSION: 'Visible facial tension was observed during parts of your response.',
  FREQUENT_HEAD_MOVEMENTS: 'Frequent head movements were observed.',
  STABLE_EXPRESSION: 'Your facial expression remained relatively stable.',
  ANALYSIS_UNAVAILABLE: 'Facial expression analysis was unavailable.'
};

for (const [key, expectedStr] of Object.entries(expectedTension)) {
  if (FacialTensionObservation[key] !== expectedStr) {
    console.error(`❌ Mismatch for tension [${key}]: Expected "${expectedStr}", got "${FacialTensionObservation[key]}"`);
    process.exit(1);
  }
}
console.log('✅ ALL 4 Facial Tension Observations matched cautious descriptions.');

// 3. Test CameraMonitoringService session start & report generation
CameraMonitoringService.startSession('test-session-123');

// Mock an active camera stream with 20 seconds of metrics
CameraMonitoringService.metrics.totalDurationMs = 20000;
CameraMonitoringService.metrics.cameraActiveDurationMs = 20000;
CameraMonitoringService.metrics.faceDetectedDurationMs = 18000; // 90% visibility
CameraMonitoringService.metrics.faceDetectedFrames = 100;
CameraMonitoringService.metrics.gazeCounts.cameraFacing = 80;   // 80% direct gaze
CameraMonitoringService.metrics.gazeCounts.lookingAway = 20;
CameraMonitoringService.metrics.framingCounts.good = 85;
CameraMonitoringService.metrics.framingCounts.tooClose = 5;
CameraMonitoringService.metrics.framingCounts.tooFar = 5;
CameraMonitoringService.metrics.framingCounts.adjustPosition = 5;
CameraMonitoringService.metrics.headOrientationCounts.forward = 80;
CameraMonitoringService.metrics.headOrientationCounts.turned = 20;
CameraMonitoringService.metrics.interruptionsCount = 0;

const report = CameraMonitoringService.completeSession('test-session-123');

console.log('Generated Session Report:', JSON.stringify({
  deliveryScore: report.deliveryScore,
  faceVisibilityPercent: report.faceVisibilityPercent,
  directGazePercent: report.directGazePercent,
  framingScore: report.framingScore,
  headOrientation: report.headOrientation,
  cameraInterruptionsCount: report.cameraInterruptionsCount,
  facialTensionObservation: report.facialTensionObservation
}, null, 2));

if (
  report.faceVisibilityPercent === 90 &&
  report.directGazePercent === 80 &&
  report.framingScore === 85 &&
  report.headOrientation === 'Mostly forward' &&
  report.facialTensionObservation === FacialTensionObservation.STABLE_EXPRESSION &&
  report.deliveryScore > 75
) {
  console.log('✅ TEST 3 PASSED: Session delivery metrics report computed accurately!');
} else {
  console.error('❌ TEST 3 FAILED: Delivery metrics did not match expected calculations.');
  process.exit(1);
}

// 4. Test Low Face Visibility Penalty & Cautious Tension Observation
CameraMonitoringService.startSession('test-low-visibility');
CameraMonitoringService.metrics.totalDurationMs = 20000;
CameraMonitoringService.metrics.cameraActiveDurationMs = 20000;
CameraMonitoringService.metrics.faceDetectedDurationMs = 6000; // 30% visibility
CameraMonitoringService.metrics.faceDetectedFrames = 30;
CameraMonitoringService.metrics.gazeCounts.cameraFacing = 10;
CameraMonitoringService.metrics.gazeCounts.lookingAway = 20;
CameraMonitoringService.metrics.framingCounts.good = 10;
CameraMonitoringService.metrics.framingCounts.adjustPosition = 20;
CameraMonitoringService.metrics.headMovementCount = 15;
CameraMonitoringService.metrics.interruptionsCount = 2;

const lowReport = CameraMonitoringService.completeSession('test-low-visibility');

console.log('Low Visibility Report:', JSON.stringify({
  deliveryScore: lowReport.deliveryScore,
  faceVisibilityPercent: lowReport.faceVisibilityPercent,
  directGazePercent: lowReport.directGazePercent,
  cameraInterruptionsCount: lowReport.cameraInterruptionsCount,
  facialTensionObservation: lowReport.facialTensionObservation
}, null, 2));

if (
  lowReport.faceVisibilityPercent === 30 &&
  lowReport.deliveryScore < 40 &&
  lowReport.cameraInterruptionsCount === 2 &&
  lowReport.facialTensionObservation === FacialTensionObservation.FREQUENT_HEAD_MOVEMENTS
) {
  console.log('✅ TEST 4 PASSED: Proportional penalty for low face visibility and interruption tracking verified!');
} else {
  console.error('❌ TEST 4 FAILED: Low visibility penalty not applied correctly.');
  process.exit(1);
}

console.log('\n======================================================');
console.log('ALL CAMERA & EVALUATION MONITORING TESTS COMPLETED! 🎉');
console.log('======================================================');

