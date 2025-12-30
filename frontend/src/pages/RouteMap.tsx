import { useState } from 'react';
import { MapPin, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface RouteNode {
  id: string;
  data: { label: string; description?: string };
  position: { x: number; y: number };
  type?: string;
}

interface RouteEdge {
  id: string;
  source: string;
  target: string;
}

interface RouteMapData {
  nodes: RouteNode[];
  edges: RouteEdge[];
  summary: string;
  ai_powered?: boolean;
}

export default function RouteMap() {
  const [stage, setStage] = useState('');
  const [sector, setSector] = useState('');
  const [location, setLocation] = useState('');
  const [routeData, setRouteData] = useState<RouteMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!stage || !sector || !location) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/route-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, sector, location }),
      });

      if (!response.ok) throw new Error('Failed to generate route');
      const data = await response.json();
      setRouteData(data);
    } catch (err) {
      console.error('Route generation error:', err);
      setError('Failed to generate route map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedNodes = routeData?.nodes
    ?.slice()
    .sort((a, b) => a.position.y - b.position.y) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Funding Route Map</h1>
        <p className="text-slate-500">Get personalized step-by-step funding guidance</p>
      </div>

      <div className="glass-card rounded-xl p-8 border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Tell us about your startup</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Startup Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            >
              <option value="">Select stage</option>
              <option value="Idea">Idea Stage</option>
              <option value="MVP">MVP Ready</option>
              <option value="Revenue">Revenue Stage</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            >
              <option value="">Select sector</option>
              <option value="HealthTech">HealthTech</option>
              <option value="FinTech">FinTech</option>
              <option value="EdTech">EdTech</option>
              <option value="AgriTech">AgriTech</option>
              <option value="SaaS">SaaS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            >
              <option value="">Select location</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi">Delhi NCR</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-200 text-white rounded-xl transition-all font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          {isLoading ? 'Generating...' : 'Generate Route Map'}
        </button>
      </div>

      {routeData ? (
        <div className="glass-card rounded-xl p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-800">Your Personalized Route</h2>
            {routeData.ai_powered && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">
                <Sparkles className="w-3 h-3" />
                AI Powered
              </span>
            )}
          </div>
          <p className="text-slate-600 mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100">{routeData.summary}</p>

          <div className="relative">
            {sortedNodes.map((node, index) => (
              <div key={node.id} className="relative">
                {index < sortedNodes.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-[calc(100%-1rem)] bg-gradient-to-b from-blue-500 to-indigo-500" />
                )}
                <div className="flex gap-6 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                      {index + 1}
                    </div>
                    {index === 0 && (
                      <div className="absolute -inset-1 rounded-full border-2 border-blue-400 animate-ping opacity-50" />
                    )}
                  </div>
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-slate-800">{node.data.label}</h3>
                      <MapPin className="w-5 h-5 text-blue-500" />
                    </div>
                    {node.data.description && (
                      <p className="text-sm text-slate-500">{node.data.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-16 text-center border border-slate-100">
          <MapPin className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Fill in your details above to generate your personalized funding route</p>
        </div>
      )}
    </div>
  );
}
