/**
 * Pitch Analyzer Page - Computer Vision Confidence Analysis
 * Webcam-based pitch recording and AI analysis
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Video, Camera, Loader2, Eye, AlertCircle, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import { analyzePitch, type PitchAnalysisResult } from '../lib/api';

export function PitchAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PitchAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsRecording(true);
    setCountdown(3);

    // Countdown
    for (let i = 3; i > 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(i - 1);
    }

    setCountdown(null);
    setIsAnalyzing(true);

    // Capture frame
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      try {
        const analysisResult = await analyzePitch(imageData);
        setResult(analysisResult);
      } catch (err) {
        setError('Failed to analyze pitch. Please try again.');
        console.error('Analysis error:', err);
      }
    }

    setIsRecording(false);
    setIsAnalyzing(false);
  }, []);

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="w-5 h-5 text-success-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning-400" />;
      case 'suggestion':
        return <TrendingUp className="w-5 h-5 text-primary-400" />;
      case 'summary':
        return <Eye className="w-5 h-5 text-accent-400" />;
      default:
        return <Info className="w-5 h-5 text-dark-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-400';
    if (score >= 60) return 'text-warning-400';
    return 'text-error-400';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-error-500 to-warning-500 flex items-center justify-center">
          <Video className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Pitch Analyzer</h1>
          <p className="text-dark-400 text-sm">AI-powered confidence analysis using computer vision</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Camera Section */}
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary-400" />
            Live Camera Feed
          </h3>
          
          <div className="relative aspect-[4/3] bg-dark-900 rounded-xl overflow-hidden mb-4">
            {stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {countdown !== null && countdown > 0 && (
                  <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center">
                    <span className="text-7xl font-bold text-white animate-pulse">{countdown}</span>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-dark-900/80 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                    <p className="text-white mt-4">Analyzing pitch...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-dark-500">
                <Video className="w-16 h-16 mb-4" />
                <p>Camera not started</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-3">
            {!stream ? (
              <button onClick={startCamera} className="btn-gradient flex-1">
                <span className="flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  Start Camera
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={captureAndAnalyze}
                  disabled={isRecording || isAnalyzing}
                  className="btn-gradient flex-1 disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    Analyze Pitch
                  </span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-xl text-dark-300 transition-colors"
                >
                  Stop
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-error-500/10 border border-error-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="glass-card p-6 animate-slide-up stagger-1">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success-400" />
            Analysis Results
          </h3>

          {result ? (
            <div className="space-y-6">
              {/* Main Score */}
              <div className="text-center py-6">
                <p className="text-dark-400 text-sm mb-2">Confidence Score</p>
                <p className={`text-6xl font-bold font-display ${getScoreColor(result.confidence_score)}`}>
                  {result.confidence_score}%
                </p>
                {result.simulated && (
                  <p className="text-xs text-dark-500 mt-2">(Simulated - MediaPipe not available)</p>
                )}
              </div>

              {/* Detailed Scores */}
              {result.eye_contact_score !== undefined && result.head_position_score !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-800 rounded-xl p-4 text-center">
                    <Eye className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                    <p className="text-sm text-dark-400">Eye Contact</p>
                    <p className={`text-2xl font-bold ${getScoreColor(result.eye_contact_score)}`}>
                      {result.eye_contact_score}%
                    </p>
                  </div>
                  <div className="bg-dark-800 rounded-xl p-4 text-center">
                    <Camera className="w-6 h-6 text-accent-400 mx-auto mb-2" />
                    <p className="text-sm text-dark-400">Head Position</p>
                    <p className={`text-2xl font-bold ${getScoreColor(result.head_position_score)}`}>
                      {result.head_position_score}%
                    </p>
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div className="space-y-3">
                <h4 className="font-medium text-dark-300">Feedback</h4>
                {result.feedback.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-dark-800 rounded-xl"
                  >
                    {getFeedbackIcon(item.type)}
                    <p className="text-dark-200 text-sm">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-10 h-10 text-dark-500" />
              </div>
              <h4 className="text-lg font-semibold text-dark-300">No Analysis Yet</h4>
              <p className="text-dark-500 mt-2 max-w-sm mx-auto">
                Start your camera and click "Analyze Pitch" to get AI-powered feedback on your presentation style.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card p-6 animate-slide-up stagger-2">
        <h3 className="font-semibold text-white mb-4">Tips for a Great Pitch</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h5 className="font-medium text-white">Eye Contact</h5>
              <p className="text-sm text-dark-400">Look directly at the camera to build trust with your audience.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-success-500/20 flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 h-4 text-success-400" />
            </div>
            <div>
              <h5 className="font-medium text-white">Good Lighting</h5>
              <p className="text-sm text-dark-400">Ensure your face is well-lit from the front for best analysis.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning-500/20 flex items-center justify-center flex-shrink-0">
              <Video className="w-4 h-4 text-warning-400" />
            </div>
            <div>
              <h5 className="font-medium text-white">Steady Posture</h5>
              <p className="text-sm text-dark-400">Keep your head level and face the camera directly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PitchAnalyzer;
