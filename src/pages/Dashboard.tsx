import { useState, useEffect } from 'react';
import { TrendingUp, Users, Target, DollarSign, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface DashboardData {
  funding_probability: number;
  matching_investors: number;
  applicable_schemes: number;
  active_opportunities: number;
  recommended_actions: Array<{
    title: string;
    priority: string;
    impact: string;
  }>;
  user_profile: {
    name: string;
    sector: string;
    stage: string;
    state: string;
    dpiit_registered: boolean;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError('Unable to load dashboard data. Please try again.');
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">{error || 'Something went wrong'}</p>
        </div>
      </div>
    );
  }

  const probability = data.funding_probability;
  const stats = [
    { label: 'Matching Investors', value: data.matching_investors.toString(), icon: Users, color: 'blue' },
    { label: 'Eligible Schemes', value: data.applicable_schemes.toString(), icon: Target, color: 'green' },
    { label: 'Active Opportunities', value: data.active_opportunities.toString(), icon: TrendingUp, color: 'purple' },
    { label: 'Funding Readiness', value: `${probability}%`, icon: DollarSign, color: 'orange' },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Funding Overview</h1>
        <p className="text-slate-500">Track your funding readiness and opportunities</p>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-xl shadow-blue-500/20">
        <h2 className="text-white/90 text-lg font-medium mb-6">Funding Probability</h2>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="white"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(probability / 100) * 439.82} 439.82`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-bold text-white">{probability}%</span>
            </div>
          </div>
        </div>
        <p className="text-white/70 text-center mt-6 text-sm">Based on profile, traction, and investor match</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${colorMap[stat.color].bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${colorMap[stat.color].text}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-5">Recommended Actions</h3>
          <div className="space-y-3">
            {data.recommended_actions.map((action, index) => (
              <div
                key={index}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl p-4 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4 className="text-slate-800 font-medium">{action.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          action.priority === 'high'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : action.priority === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {action.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{action.impact}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors ml-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-5">Startup Profile</h3>
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Sector</p>
              <p className="text-slate-800 font-medium">{data.user_profile.sector}</p>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Stage</p>
              <p className="text-slate-800 font-medium">{data.user_profile.stage}</p>
            </div>
            <div className="border-b border-slate-100 pb-4">
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Location</p>
              <p className="text-slate-800 font-medium">{data.user_profile.state}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">DPIIT Status</p>
              <div className="flex items-center gap-2">
                {data.user_profile.dpiit_registered ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <p className={`font-medium ${data.user_profile.dpiit_registered ? 'text-green-600' : 'text-yellow-600'}`}>
                  {data.user_profile.dpiit_registered ? 'Registered' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
