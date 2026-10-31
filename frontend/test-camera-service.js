// Test runner for CameraMonitoringService logic
import { 
  CameraMonitoringService, 
  CameraStatus, 
  FaceStatus, 
  FramingStatus, 
  PreflightMessage 
} from './src/services/CameraMonitoringService.js';

console.log('--- TESTING CAMERA MONITORING SERVICE ---');

// Test 1: Empty metrics & Initial state
CameraMonitoringService.startSession('session-test-123');
console.log('✓ Session initialized');

// Mock a synthetic frame: Normal Face inside frame (centered, ~30% width)
function createMockCanvas(faceType) {
  const width = 160;
  const height = 120;
  const pixelCount = width * height;
  const data = new Uint8ClampedArray(pixelCount * 4);

  // Fill with neutral dark background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 20;
    data[i + 1] = 20;
    data[i + 2] = 25;
    data[i + 3] = 255;
  }

  if (faceType === 'normal') {
    // Face around x: 55 to 105 (width 50, ~31%), y: 25 to 75 (height 50)
    for (let y = 25; y < 75; y++) {
      for (let x = 55; x < 105; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 190;     // r
        data[idx + 1] = 130; // g
        data[idx + 2] = 100; // b
        data[idx + 3] = 255;
      }
    }
  } else if (faceType === 'too_close') {
    // Face covering nearly whole width: x: 10 to 150 (width 140, ~87%)
    for (let y = 5; y < 115; y++) {
      for (let x = 10; x < 150; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 190;
        data[idx + 1] = 130;
        data[idx + 2] = 100;
        data[idx + 3] = 255;
      }
    }
  } else if (faceType === 'too_far') {
    // Tiny face: x: 75 to 85 (width 10, ~6%), y: 55 to 65 (height 10)
    for (let y = 55; y < 65; y++) {
      for (let x = 75; x < 85; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 190;
        data[idx + 1] = 130;
        data[idx + 2] = 100;
        data[idx + 3] = 255;
      }
    }
  } else if (faceType === 'off_center') {
    // Face shifted to extreme right: x: 125 to 155
    for (let y = 30; y < 70; y++) {
      for (let x = 125; x < 155; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 190;
        data[idx + 1] = 130;
        data[idx + 2] = 100;
        data[idx + 3] = 255;
      }
    }
  }

  const canvas = {
    width,
    height,
    getContext: () => ({
      drawImage: () => {},
      getImageData: () => ({ data })
    })
  };

  const video = {
    readyState: 4,
    videoWidth: 640,
    videoHeight: 480
  };

  return { canvas, video };
}

// TEST 1: Normal face -> Should be detected with GOOD framing
const { canvas: normCanvas, video: normVideo } = createMockCanvas('normal');
CameraMonitoringService.setStream({ active: true, getVideoTracks: () => [{ readyState: 'live', enabled: true }] });

// Process several frames to test stability
let normalResult;
for (let i = 0; i < 20; i++) {
  normalResult = CameraMonitoringService.processFrame(normVideo, normCanvas);
}
console.log('TEST 1 (Normal face):', {
  face: normalResult.face,
  framing: normalResult.framing,
  message: normalResult.preflightMessage,
  isFramingAcceptable: normalResult.isFramingAcceptable,
  stabilityProgress: normalResult.stabilityProgress
});
if (normalResult.face === FaceStatus.DETECTED && normalResult.framing === FramingStatus.GOOD && normalResult.isFramingAcceptable) {
  console.log('✅ TEST 1 PASSED: Normal face within guide is accepted and verified!');
} else {
  console.error('❌ TEST 1 FAILED');
  process.exit(1);
}

// TEST 2: Too close face -> Should detect TOO_CLOSE
const { canvas: closeCanvas, video: closeVideo } = createMockCanvas('too_close');
const closeResult = CameraMonitoringService.processFrame(closeVideo, closeCanvas);
console.log('TEST 2 (Too close face):', {
  framing: closeResult.framing,
  message: closeResult.preflightMessage
});
if (closeResult.framing === FramingStatus.TOO_CLOSE && closeResult.preflightMessage === PreflightMessage.TOO_CLOSE) {
  console.log('✅ TEST 2 PASSED: Genuinely huge face triggers TOO_CLOSE warning accurately!');
} else {
  console.error('❌ TEST 2 FAILED');
  process.exit(1);
}

// TEST 3: Too far face -> Should detect TOO_FAR
const { canvas: farCanvas, video: farVideo } = createMockCanvas('too_far');
const farResult = CameraMonitoringService.processFrame(farVideo, farCanvas);
console.log('TEST 3 (Too far face):', {
  framing: farResult.framing,
  message: farResult.preflightMessage
});
if (farResult.framing === FramingStatus.TOO_FAR && farResult.preflightMessage === PreflightMessage.TOO_FAR) {
  console.log('✅ TEST 3 PASSED: Distant face triggers TOO_FAR warning accurately!');
} else {
  console.error('❌ TEST 3 FAILED');
  process.exit(1);
}

// TEST 4: Off-center face -> Should detect ADJUST_POSITION / FACE_OUTSIDE_FRAME
const { canvas: offCanvas, video: offVideo } = createMockCanvas('off_center');
const offResult = CameraMonitoringService.processFrame(offVideo, offCanvas);
console.log('TEST 4 (Off-center face):', {
  framing: offResult.framing,
  message: offResult.preflightMessage
});
if (offResult.framing === FramingStatus.ADJUST_POSITION && offResult.preflightMessage === PreflightMessage.FACE_OUTSIDE_FRAME) {
  console.log('✅ TEST 4 PASSED: Off-center face asks candidate to adjust position!');
} else {
  console.error('❌ TEST 4 FAILED');
  process.exit(1);
}

// TEST 5: No face detected -> Should report FACE_NOT_DETECTED, but Camera is still ACTIVE!
const { canvas: blankCanvas, video: blankVideo } = createMockCanvas('none');
const blankResult = CameraMonitoringService.processFrame(blankVideo, blankCanvas);
console.log('TEST 5 (No face):', {
  camera: blankResult.camera,
  face: blankResult.face,
  message: blankResult.preflightMessage
});
if (blankResult.camera === CameraStatus.ACTIVE && blankResult.face === FaceStatus.NOT_DETECTED) {
  console.log('✅ TEST 5 PASSED: Missing face does NOT falsely mark camera as disabled!');
} else {
  console.error('❌ TEST 5 FAILED');
  process.exit(1);
}

// TEST 6: Session completion report -> Camera was active, verify final report
const finalReport = CameraMonitoringService.completeSession('session-test-123');
console.log('TEST 6 (Final session report):', {
  cameraStatus: finalReport.cameraStatus,
  cameraStatusLabel: finalReport.cameraStatusLabel,
  faceVisibilityPercent: finalReport.faceVisibilityPercent,
  deliveryScore: finalReport.deliveryScore,
  framing: finalReport.cameraFraming,
  gaze: finalReport.directGazePercent
});
if (finalReport.cameraStatus === 'ENABLED_AND_WORKING' && finalReport.cameraStatusLabel === 'Active' && finalReport.deliveryScore > 0) {
  console.log('✅ TEST 6 PASSED: Final feedback report reports Camera Active with calculated scores (no false "Disabled")!');
} else {
  console.error('❌ TEST 6 FAILED');
  process.exit(1);
}

// Helper for custom colored face patch
function createCustomFaceCanvas(r, g, b, withOutliers = false) {
  const width = 160;
  const height = 120;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 20; data[i + 1] = 20; data[i + 2] = 25; data[i + 3] = 255;
  }
  for (let y = 25; y < 75; y++) {
    for (let x = 55; x < 105; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
    }
  }
  if (withOutliers) {
    const outliers = [[2, 5], [158, 115], [3, 110], [157, 10]];
    for (const [ox, oy] of outliers) {
      const idx = (oy * width + ox) * 4;
      data[idx] = 190; data[idx + 1] = 130; data[idx + 2] = 100; data[idx + 3] = 255;
    }
  }
  return {
    canvas: { width, height, getContext: () => ({ drawImage: () => {}, getImageData: () => ({ data }) }) },
    video: { readyState: 4, videoWidth: 640, videoHeight: 480 }
  };
}

// TEST 7: Cool Laptop Monitor Backlight illumination (120, 125, 130)
const { canvas: coolCanvas, video: coolVideo } = createCustomFaceCanvas(120, 125, 130);
const coolResult = CameraMonitoringService.processFrame(coolVideo, coolCanvas);
console.log('TEST 7 (Cool Screen Light):', {
  face: coolResult.face,
  framing: coolResult.framing,
  message: coolResult.preflightMessage
});
if (coolResult.face === FaceStatus.DETECTED && coolResult.framing === FramingStatus.GOOD) {
  console.log('✅ TEST 7 PASSED: Face illuminated by cool laptop monitor light is reliably detected!');
} else {
  console.error('❌ TEST 7 FAILED: Cool screen illumination rejected');
  process.exit(1);
}

// TEST 8: Olive / Dim Room Face (95, 92, 78)
const { canvas: oliveCanvas, video: oliveVideo } = createCustomFaceCanvas(95, 92, 78);
const oliveResult = CameraMonitoringService.processFrame(oliveVideo, oliveCanvas);
console.log('TEST 8 (Olive / Dim Light):', {
  face: oliveResult.face,
  framing: oliveResult.framing,
  message: oliveResult.preflightMessage
});
if (oliveResult.face === FaceStatus.DETECTED && oliveResult.framing === FramingStatus.GOOD) {
  console.log('✅ TEST 8 PASSED: Olive / dim light face is accurately recognized!');
} else {
  console.error('❌ TEST 8 FAILED: Olive skin rejected');
  process.exit(1);
}

// TEST 9: Deep Melanin Tone (70, 50, 40)
const { canvas: deepCanvas, video: deepVideo } = createCustomFaceCanvas(70, 50, 40);
const deepResult = CameraMonitoringService.processFrame(deepVideo, deepCanvas);
console.log('TEST 9 (Deep Melanin Tone):', {
  face: deepResult.face,
  framing: deepResult.framing,
  message: deepResult.preflightMessage
});
if (deepResult.face === FaceStatus.DETECTED && deepResult.framing === FramingStatus.GOOD) {
  console.log('✅ TEST 9 PASSED: Deep melanin tone face is accurately recognized!');
} else {
  console.error('❌ TEST 9 FAILED: Deep melanin tone rejected');
  process.exit(1);
}

// TEST 10: Stray outlier pixels in room (wooden objects / edge noise)
const { canvas: outlierCanvas, video: outlierVideo } = createCustomFaceCanvas(190, 130, 100, true);
const outlierResult = CameraMonitoringService.processFrame(outlierVideo, outlierCanvas);
console.log('TEST 10 (Outlier Noise Resistance):', {
  framing: outlierResult.framing,
  normWidth: outlierResult.normalizedBounds.width.toFixed(2),
  message: outlierResult.preflightMessage
});
if (outlierResult.framing === FramingStatus.GOOD && outlierResult.normalizedBounds.width < 0.55) {
  console.log('✅ TEST 10 PASSED: Statistical centroid prevents false "Too Close" error from stray room pixels!');
} else {
  console.error('❌ TEST 10 FAILED: Stray pixels caused false framing error');
  process.exit(1);
}

console.log('ALL 10 CAMERA SERVICE TESTS PASSED SUCCESSFULLY! 🎉');

