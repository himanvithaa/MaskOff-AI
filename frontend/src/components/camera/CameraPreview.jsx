import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  ShieldCheck, 
  Eye, 
  Compass, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  RotateCcw,
  RefreshCw,
  Video
} from 'lucide-react';
import { 
  CameraMonitoringService, 
  CameraStatus, 
  FaceStatus, 
  FramingStatus, 
  GazeStatus, 
  HeadOrientationStatus 
} from '../../services/CameraMonitoringService';
import { CameraState, CAMERA_MESSAGES, mapGetUserMediaError } from './CameraStateMachine';

/**
 * CameraPreview
 * Interview webcam viewport and continuous Live Delivery & Presence Coach.
 * Integrates directly with the central CameraMonitoringService.
 */
export default function CameraPreview({
  isCameraActive,
  setIsCameraActive,
  onDeliveryUpdate,
  existingStream = null,
  onCameraStateChange = null,
  onStreamReacquired = null,
  className = ''
}) {
  const [stream, setStream] = useState(existingStream);
  const [cameraState, setCameraState] = useState(existingStream ? CameraState.CAMERA_ACTIVE : CameraState.CAMERA_DISABLED);
  const [stateMessage, setStateMessage] = useState(CAMERA_MESSAGES[CameraState.CAMERA_ACTIVE]);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Live 5-factor delivery coach metrics
  const [liveState, setLiveState] = useState({
    camera: existingStream ? CameraStatus.ACTIVE : CameraStatus.DISABLED,
    face: FaceStatus.NOT_DETECTED,
    framing: FramingStatus.ADJUST_POSITION,
    gaze: GazeStatus.UNAVAILABLE,
    headOrientation: HeadOrientationStatus.UNAVAILABLE
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(stream);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // Subscribe to central CameraMonitoringService
  useEffect(() => {
    const unsubscribe = CameraMonitoringService.subscribe((state) => {
      setLiveState({
        camera: state.camera,
        face: state.face,
        framing: state.framing,
        gaze: state.gaze,
        headOrientation: state.headOrientation,
        liveAlert: state.liveAlert,
        gazeAlert: state.gazeAlert
      });
    });
    return unsubscribe;
  }, []);

  // Sync existing stream from preflight
  useEffect(() => {
    if (existingStream) {
      setStream(existingStream);
      streamRef.current = existingStream;
      setIsCameraActive(true);
      setCameraState(CameraState.CAMERA_ACTIVE);
      setStateMessage(CAMERA_MESSAGES[CameraState.CAMERA_ACTIVE]);
      CameraMonitoringService.setStream(existingStream);
    }
  }, [existingStream, setIsCameraActive]);

  // Enumerate video devices for camera switching
  const refreshDevices = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (e) {
        console.warn('Failed to enumerate video devices:', e);
      }
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Update camera state and notify parent
  const updateState = useCallback((newState) => {
    setCameraState(newState);
    const msg = CAMERA_MESSAGES[newState] || 'Camera status updated.';
    setStateMessage(msg);
    if (onCameraStateChange) {
      onCameraStateChange(newState, msg);
    }
  }, [onCameraStateChange]);

  // Start or reconnect camera
  const startCamera = async (deviceIdToUse = null) => {
    setIsReconnecting(true);
    updateState(CameraState.REQUESTING_PERMISSION);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          deviceId: deviceIdToUse || (selectedDeviceId ? { exact: selectedDeviceId } : undefined),
          facingMode: deviceIdToUse || selectedDeviceId ? undefined : 'user'
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      updateState(CameraState.CAMERA_ACTIVE);
      CameraMonitoringService.setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.warn);
      }

      if (onStreamReacquired) {
        onStreamReacquired(mediaStream);
      }
      refreshDevices();
    } catch (err) {
      console.error('Camera acquisition error:', err);
      const mapped = mapGetUserMediaError(err);
      setIsCameraActive(false);
      updateState(mapped);
    } finally {
      setIsReconnecting(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setStream(null);
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsCameraActive(false);
    CameraMonitoringService.setStream(null);
    updateState(CameraState.CAMERA_CLOSED);
  };

  // Bind video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.warn);
    }
  }, [stream]);

  // Continuous frame processing loop for live presence coach metrics
  useEffect(() => {
    if (!isCameraActive || !stream) return;

    let isRunning = true;
    const processLoop = () => {
      if (!isRunning) return;
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        CameraMonitoringService.processFrame(videoRef.current, canvasRef.current);
        if (onDeliveryUpdate) {
          onDeliveryUpdate(liveState);
        }
      }
      animationFrameRef.current = requestAnimationFrame(processLoop);
    };

    animationFrameRef.current = requestAnimationFrame(processLoop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, stream, onDeliveryUpdate, liveState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const isErrorState =
    cameraState === CameraState.CAMERA_CLOSED ||
    cameraState === CameraState.CAMERA_DISCONNECTED ||
    cameraState === CameraState.CAMERA_TRACK_ENDED ||
    cameraState === CameraState.PERMISSION_DENIED ||
    cameraState === CameraState.NO_CAMERA_FOUND ||
    cameraState === CameraState.CAMERA_IN_USE ||
    cameraState === CameraState.CAMERA_MUTED ||
    cameraState === CameraState.VIDEO_NOT_RENDERING ||
    cameraState === CameraState.CAMERA_ERROR;

  return (
    <div className={`clean-card p-4 flex flex-col space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-primary-600" />
          <h3 className="text-xs font-bold text-text-main">Live Delivery & Presence Coach</h3>
        </div>

        <button
          type="button"
          onClick={isCameraActive ? stopCamera : () => startCamera()}
          className={`py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
            isCameraActive
              ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
              : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
          }`}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-3.5 h-3.5" />
              <span>Turn Off</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>Enable</span>
            </>
          )}
        </button>
      </div>

      {/* Device Switcher (If multiple cameras present) */}
      {availableDevices.length > 1 && (
        <div className="flex items-center space-x-2 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Video className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="text-text-muted font-semibold">Camera:</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => {
              setSelectedDeviceId(e.target.value);
              startCamera(e.target.value);
            }}
            className="flex-1 bg-white text-xs border border-slate-200 rounded-lg p-1 text-text-main"
          >
            {availableDevices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Camera Alert Banner (Only when actual hardware error occurs) */}
      {isErrorState && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <span className="font-bold text-rose-950 block">Camera Alert</span>
            <p className="text-[11px] leading-relaxed font-medium">{stateMessage}</p>
            <button
              type="button"
              onClick={() => startCamera()}
              disabled={isReconnecting}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
              <span>{isReconnecting ? 'Reconnecting...' : 'Reconnect Camera to Resume'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Video Viewport */}
      <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-border">
        {isCameraActive && !isErrorState ? (
          <>
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Live Coaching Alert Pill */}
            {liveState.liveAlert && (
              <div className="absolute top-2.5 left-2 right-2 z-20 pointer-events-none flex justify-center">
                <div className="px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500/80 text-rose-100 text-[11px] font-bold shadow-lg flex items-center space-x-1.5 backdrop-blur-md">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 animate-pulse" />
                  <span className="truncate max-w-[280px]">{liveState.liveAlert}</span>
                </div>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 pointer-events-none p-2.5 flex flex-col justify-between pt-8">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${
                  liveState.face === FaceStatus.DETECTED
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{liveState.face}</span>
                </span>
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Camera Active</span>
                </div>
              </div>

              {/* Real-time Framing Guide Box */}
              <div className={`self-center w-36 h-36 border-2 border-dashed rounded-2xl flex items-center justify-center transition-colors ${
                liveState.framing === FramingStatus.GOOD
                  ? 'border-emerald-400/70 bg-emerald-500/5'
                  : 'border-amber-400/70 bg-amber-500/5'
              }`}>
                <span className="text-[10px] text-white/80 font-medium px-2 py-0.5 rounded bg-black/40">
                  {liveState.framing === FramingStatus.GOOD ? 'Framing Aligned' : liveState.framing}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white">
                <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm">
                  {liveState.gaze}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm">
                  Head: {liveState.headOrientation}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-slate-400 space-y-2">
            <CameraOff className="w-8 h-8 mx-auto text-slate-500 stroke-[1.5]" />
            <p className="text-xs font-semibold text-slate-200">
              {isErrorState ? 'Camera Stalled or Turned Off' : 'Camera is Currently Disabled'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              {stateMessage}
            </p>
          </div>
        )}
      </div>

      {/* 5 Real-Time Observable Delivery Values */}
      {isCameraActive && !isErrorState && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {/* 1. Camera Status */}
            <div className="p-2 rounded-lg bg-slate-50 border border-border flex items-center justify-between">
              <span className="text-[10px] text-text-muted flex items-center space-x-1">
                <Camera className="w-3 h-3 text-emerald-600" />
                <span>Camera:</span>
              </span>
              <span className="font-bold text-emerald-700 text-[11px]">
                {liveState.camera}
              </span>
            </div>

            {/* 2. Face Detection */}
            <div className="p-2 rounded-lg bg-slate-50 border border-border flex items-center justify-between">
              <span className="text-[10px] text-text-muted flex items-center space-x-1">
                <User className="w-3 h-3 text-primary-600" />
                <span>Face:</span>
              </span>
              <span className={`font-semibold text-[11px] truncate max-w-[90px] ${
                liveState.face === FaceStatus.DETECTED ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {liveState.face}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {/* 3. Framing */}
            <div className="p-2 rounded-lg bg-slate-50 border border-border flex flex-col justify-between">
              <span className="text-[10px] text-text-muted flex items-center space-x-1">
                <Compass className="w-3 h-3 text-cyan-600" />
                <span>Framing</span>
              </span>
              <span className={`font-semibold text-[11px] truncate mt-0.5 ${
                liveState.framing === FramingStatus.GOOD ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {liveState.framing}
              </span>
            </div>

            {/* 4. Gaze */}
            <div className="p-2 rounded-lg bg-slate-50 border border-border flex flex-col justify-between">
              <span className="text-[10px] text-text-muted flex items-center space-x-1">
                <Eye className="w-3 h-3 text-primary-600" />
                <span>Gaze</span>
              </span>
              <span className="font-semibold text-text-main text-[11px] truncate mt-0.5">
                {liveState.gaze === GazeStatus.CAMERA_FACING ? 'Facing Lens' : 'Glance Away'}
              </span>
            </div>

            {/* 5. Head Orientation */}
            <div className="p-2 rounded-lg bg-slate-50 border border-border flex flex-col justify-between">
              <span className="text-[10px] text-text-muted flex items-center space-x-1">
                <RotateCcw className="w-3 h-3 text-violet-600" />
                <span>Head</span>
              </span>
              <span className="font-semibold text-text-main text-[11px] truncate mt-0.5">
                {liveState.headOrientation}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="flex items-start space-x-1.5 text-[10px] text-text-subtle pt-1 border-t border-border">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <span>100% On-Device Processing. No video leaves your browser.</span>
      </div>
    </div>
  );
}
