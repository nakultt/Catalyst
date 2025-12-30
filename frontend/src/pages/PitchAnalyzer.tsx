import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Eye, Smile, AlertCircle, CheckCircle2, TrendingUp, Loader2, X } from 'lucide-react';

interface PitchResult {
  success: boolean;
  confidence_score: number;
  eye_contact_score?: number;
  head_position_score?: number;
  feedback: Array<{ type: string; message: string }>;
  simulated?: boolean;
  error?: string;
}

export default function PitchAnalyzer() {
  const [activeTab, setActiveTab] = useState<'camera' | 'document'>('camera');
  const [analysisResult, setAnalysisResult] = useState<PitchResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const base64Image = imageData.split(',')[1];

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setAnalysisResult(data);
      stopCamera();
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisResult({
        success: false,
        confidence_score: 0,
        feedback: [{ type: 'error', message: 'Analysis failed. Please try again.' }],
        error: 'Failed to analyze pitch',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const resetAnalysis = () => {
    setAnalysisResult(null);
    stopCamera();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Pitch Analyzer</h1>
        <p className="text-slate-500">Improve your pitch with AI-powered analysis</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-100">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setActiveTab('camera'); resetAnalysis(); }}
            className={`flex-1 px-6 py-4 font-medium transition-all ${
              activeTab === 'camera'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <Camera className="w-5 h-5" />
              Camera-Based Pitch Analysis
            </div>
          </button>
          <button
            onClick={() => { setActiveTab('document'); resetAnalysis(); }}
            className={`flex-1 px-6 py-4 font-medium transition-all ${
              activeTab === 'document'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <Upload className="w-5 h-5" />
              Startup Scheme Scanner
            </div>
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'camera' ? (
            <div className="space-y-6">
              {!analysisResult ? (
                <>
                  {!isCameraActive ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                      <Camera className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">Record Your Pitch</h3>
                      <p className="text-slate-500 mb-6">We'll analyze your eye contact, confidence, and delivery</p>
                      <button
                        onClick={startCamera}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-200 text-white rounded-xl transition-all font-medium inline-flex items-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Start Camera
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <button
                          onClick={stopCamera}
                          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                      <button
                        onClick={captureAndAnalyze}
                        disabled={isAnalyzing}
                        className="w-full px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-200 text-white rounded-xl transition-all font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                        {isAnalyzing ? 'Analyzing...' : 'Capture & Analyze'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center">
                      <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 font-medium">Eye Contact</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center">
                      <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 font-medium">Confidence</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center">
                      <Smile className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 font-medium">Expression</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Analysis Results</h3>
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="relative inline-flex mb-3">
                          <svg className="transform -rotate-90 w-20 h-20">
                            <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                            <circle
                              cx="40" cy="40" r="32"
                              stroke="#3b82f6"
                              strokeWidth="6"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${((analysisResult.eye_contact_score || 0) / 100) * 201} 201`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-slate-800">{analysisResult.eye_contact_score || 0}%</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">Eye Contact</p>
                      </div>
                      <div className="text-center">
                        <div className="relative inline-flex mb-3">
                          <svg className="transform -rotate-90 w-20 h-20">
                            <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                            <circle
                              cx="40" cy="40" r="32"
                              stroke="#10b981"
                              strokeWidth="6"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${(analysisResult.confidence_score / 100) * 201} 201`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-slate-800">{analysisResult.confidence_score}%</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">Confidence</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-purple-50 border-4 border-purple-400 flex items-center justify-center mx-auto mb-3">
                          <Smile className="w-10 h-10 text-purple-500" />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">Expression</p>
                      </div>
                    </div>
                    {analysisResult.simulated && (
                      <p className="text-xs text-center text-slate-400">Note: This is a simulated result for demonstration</p>
                    )}
                  </div>

                  <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Feedback</h4>
                    <div className="space-y-3">
                      {analysisResult.feedback.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-4">
                          {item.type === 'error' ? (
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          )}
                          <p className="text-sm text-slate-600">{item.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={resetAnalysis}
                    className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium"
                  >
                    Analyze Again
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
              <Upload className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Upload Scheme Documents</h3>
              <p className="text-slate-500 mb-6">Upload PAN, Aadhaar, Incorporation Certificate to check eligibility</p>
              <p className="text-sm text-slate-400">Feature coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
