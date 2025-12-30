import { useState, useRef, useCallback } from 'react';
import { Camera, Eye, Smile, AlertCircle, CheckCircle2, TrendingUp, Loader2, X, FileText, Shield, Building2, LucideIcon } from 'lucide-react';

interface PitchResult {
  success: boolean;
  confidence_score: number;
  eye_contact_score?: number;
  head_position_score?: number;
  feedback: Array<{ type: string; message: string }>;
  simulated?: boolean;
  error?: string;
}

interface SchemeResult {
  eligible: boolean;
  scheme_name: string;
  reason: string;
  confidence_score: number;
  details: string[];
}

export default function PitchAnalyzer() {
  const [activeTab, setActiveTab] = useState<'camera' | 'document'>('camera');
  const [analysisResult, setAnalysisResult] = useState<PitchResult | null>(null);
  const [schemeResult, setSchemeResult] = useState<SchemeResult | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // File states
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [incorpFile, setIncorpFile] = useState<File | null>(null);

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

  const handleSchemeCheck = async () => {
    if (!panFile || !aadhaarFile || !incorpFile) {
      alert("Please upload all required documents");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('pan', panFile);
      formData.append('aadhaar', aadhaarFile);
      formData.append('incorporation', incorpFile);

      const response = await fetch('/api/check-eligibility', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Verification failed');
      const data = await response.json();
      setSchemeResult(data);
    } catch (err) {
      console.error('Scheme check error:', err);
      alert('Failed to verify documents. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setSchemeResult(null);
    setPanFile(null);
    setAadhaarFile(null);
    setIncorpFile(null);
    stopCamera();
  };

  const FileUploadBox = ({ 
    label, 
    file, 
    setFile, 
    icon: Icon 
  }: { 
    label: string, 
    file: File | null, 
    setFile: (f: File | null) => void, 
    icon: LucideIcon 
  }) => (
    <div className="relative group">
      <input
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) setFile(e.target.files[0]);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        accept=".pdf,.jpg,.jpeg,.png"
      />
      <div className={`border-2 border-dashed rounded-xl p-6 transition-all ${
        file ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'
      }`}>
        <div className="flex flex-col items-center justify-center text-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            file ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
          }`}>
            {file ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
          </div>
          <div>
            <p className={`font-medium ${file ? 'text-green-800' : 'text-slate-700'}`}>
              {file ? file.name : label}
            </p>
            {!file && <p className="text-xs text-slate-400">Click to upload (PDF/JPG)</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Pitch Analyzer & Validator</h1>
        <p className="text-slate-500"> AI-powered pitch coaching and scheme eligibility scanner</p>
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
              <FileText className="w-5 h-5" />
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
            <div className="space-y-8">
              {!schemeResult ? (
                <>
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Check Scheme Eligibility</h3>
                    <p className="text-slate-500">Upload your business documents to verify eligibility for government schemes</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FileUploadBox 
                      label="Upload PAN Card"
                      file={panFile}
                      setFile={setPanFile}
                      icon={Shield}
                    />
                    <FileUploadBox 
                      label="Upload Aadhaar"
                      file={aadhaarFile}
                      setFile={setAadhaarFile}
                      icon={Shield}
                    />
                    <FileUploadBox 
                      label="Upload Incorporation Cert"
                      file={incorpFile}
                      setFile={setIncorpFile}
                      icon={Building2}
                    />
                  </div>

                  <button
                    onClick={handleSchemeCheck}
                    disabled={isAnalyzing || !panFile || !aadhaarFile || !incorpFile}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-200 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying Documents...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Verify Eligibility
                      </>
                    )}
                  </button>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>Your documents are processed securely and only used for eligibility verification.</p>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-8 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">You are Eligible!</h3>
                    <p className="text-slate-600 mb-6">Based on the uploaded documents, your startup applies for:</p>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm inline-block border border-emerald-100 mb-6">
                      <span className="text-lg font-semibold text-emerald-700">{schemeResult.scheme_name}</span>
                    </div>

                    <div className="flex justify-center gap-8 text-center">
                       <div>
                         <p className="text-3xl font-bold text-emerald-600">{schemeResult.confidence_score}%</p>
                         <p className="text-sm text-slate-500 font-medium">Confidence</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Verification Details</h4>
                    <div className="space-y-3">
                      {schemeResult.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span className="text-slate-700">{detail}</span>
                        </div>
                      ))}
                    </div>
                    {schemeResult.reason && (
                       <p className="mt-4 text-sm text-slate-500 italic border-t pt-4">
                         Note: {schemeResult.reason}
                       </p>
                    )}
                  </div>

                  <button
                    onClick={resetAnalysis}
                    className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium"
                  >
                    Check Another Startup
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

