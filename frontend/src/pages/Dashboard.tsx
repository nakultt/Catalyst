/**
 * Dashboard Page - Intelligence Dashboard
 * Shows funding probability, recommended actions, and key metrics
 */
import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { getDashboard, type DashboardData } from '../lib/api';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
}

function StatCard({ icon, label, value, trend, color }: StatCardProps) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <span className="badge badge-success text-xs">{trend}</span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-dark-400 text-sm">{label}</p>
        <p className="text-3xl font-bold font-display text-white mt-1">{value}</p>
      </div>
    </div>
  );
}

interface ActionItemProps {
  title: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  index: number;
}

function ActionItem({ title, priority, impact, index }: ActionItemProps) {
  const priorityColors = {
    high: 'text-error-400 bg-error-400/10',
    medium: 'text-warning-400 bg-warning-400/10',
    low: 'text-success-400 bg-success-400/10',
  };

  const priorityIcons = {
    high: <AlertCircle className="w-4 h-4" />,
    medium: <Clock className="w-4 h-4" />,
    low: <CheckCircle2 className="w-4 h-4" />,
  };

  return (
    <div 
      className={`glass-card p-5 flex items-center gap-4 hover:translate-x-1 transition-transform cursor-pointer animate-slide-up stagger-${index + 1}`}
    >
      <div className={`w-10 h-10 rounded-xl ${priorityColors[priority]} flex items-center justify-center`}>
        {priorityIcons[priority]}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-sm text-dark-400">{impact}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-dark-500" />
    </div>
  );
}

function FundingGauge({ probability }: { probability: number }) {
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (probability / 100) * circumference;

  return (
    <div className="relative w-48 h-48">
      <svg className="w-full h-full progress-ring" viewBox="0 0 160 160">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="rgba(99, 102, 241, 0.1)"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <circle
          className="progress-ring__circle"
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold font-display gradient-text">{probability}%</span>
        <span className="text-dark-400 text-sm mt-1">Funding Ready</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const dashboardData = await getDashboard();
        setData(dashboardData);
      } catch (err) {
        setError('Failed to load dashboard. Make sure the backend is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="text-dark-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center glass-card p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-error-400 mx-auto" />
          <h3 className="text-xl font-semibold mt-4">Connection Error</h3>
          <p className="text-dark-400 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-gradient mt-6"
          >
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold text-white">
          Welcome back, <span className="gradient-text">{data.user_profile.name}</span>
        </h1>
        <p className="text-dark-400 mt-2">
          Here's your startup funding intelligence for {data.user_profile.startup_name}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Funding Probability Card */}
        <div className="col-span-12 lg:col-span-4">
          <div className="glass-card p-8 flex flex-col items-center justify-center h-full">
            <h3 className="text-lg font-semibold text-dark-300 mb-6">Funding Probability</h3>
            <FundingGauge probability={data.funding_probability} />
            <p className="text-dark-400 text-sm mt-6 text-center">
              Based on your profile, market conditions, and investor matches
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4">
          <StatCard
            icon={<Users className="w-6 h-6 text-white" />}
            label="Matching Investors"
            value={data.matching_investors}
            trend="+2 new"
            color="from-primary-500 to-primary-600"
          />
          <StatCard
            icon={<FileText className="w-6 h-6 text-white" />}
            label="Eligible Schemes"
            value={data.applicable_schemes}
            color="from-accent-500 to-accent-600"
          />
          <StatCard
            icon={<Sparkles className="w-6 h-6 text-white" />}
            label="Active Opportunities"
            value={data.active_opportunities}
            trend="5 closing soon"
            color="from-success-500 to-success-600"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            label="Monthly Revenue"
            value={`₹${(data.user_profile.monthly_revenue / 1000).toFixed(0)}K`}
            color="from-warning-500 to-warning-600"
          />
        </div>
      </div>

      {/* Recommended Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-white">
            Recommended Actions
          </h2>
          <span className="text-sm text-dark-400">{data.recommended_actions.length} actions pending</span>
        </div>
        <div className="grid gap-4">
          {data.recommended_actions.map((action, index) => (
            <ActionItem
              key={index}
              title={action.title}
              priority={action.priority}
              impact={action.impact}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Profile Summary */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Your Startup Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-dark-400">Sector</p>
            <p className="font-medium text-white">{data.user_profile.sector}</p>
          </div>
          <div>
            <p className="text-sm text-dark-400">Stage</p>
            <p className="font-medium text-white">{data.user_profile.stage}</p>
          </div>
          <div>
            <p className="text-sm text-dark-400">Location</p>
            <p className="font-medium text-white">{data.user_profile.location}, {data.user_profile.state}</p>
          </div>
          <div>
            <p className="text-sm text-dark-400">DPIIT Status</p>
            <p className={`font-medium ${data.user_profile.dpiit_registered ? 'text-success-400' : 'text-warning-400'}`}>
              {data.user_profile.dpiit_registered ? 'Registered ✓' : 'Not Registered'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
