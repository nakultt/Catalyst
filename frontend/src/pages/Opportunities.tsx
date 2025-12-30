import { useState, useEffect } from 'react';
import { Search, Filter, Award, ExternalLink, Clock, Loader2, AlertCircle } from 'lucide-react';

interface Opportunity {
  id: string;
  name: string;
  organizer: string;
  type: string;
  deadline: string;
  prize: string;
  benefits: string[];
  sector: string;
  link?: string;
}

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSector, setSelectedSector] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/opportunities');
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setOpportunities(result.data || []);
        setAiInsight(result.ai_insight || null);
      } catch (err) {
        setError('Unable to load opportunities.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedType !== 'All' && opp.type !== selectedType) return false;
    if (selectedSector !== 'All' && opp.sector !== selectedSector && opp.sector !== 'All Sectors') return false;
    if (searchTerm && !opp.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getUrgencyColor = (deadline: string) => {
    if (!deadline || deadline === 'Rolling') return 'text-slate-400';
    const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) return 'text-red-500';
    if (daysLeft <= 15) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Hackathon: 'bg-purple-50 text-purple-700 border-purple-100',
      Grant: 'bg-green-50 text-green-700 border-green-100',
      Challenge: 'bg-blue-50 text-blue-700 border-blue-100',
      Accelerator: 'bg-orange-50 text-orange-700 border-orange-100',
    };
    return colors[type] || 'bg-slate-50 text-slate-600 border-slate-100';
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-2xl text-center shadow-lg border border-slate-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const uniqueTypes = ['All', ...new Set(opportunities.map(o => o.type).filter(Boolean))];
  const uniqueSectors = ['All', ...new Set(opportunities.map(o => o.sector).filter(Boolean))];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Opportunities Radar</h1>
        <p className="text-slate-500">Discover hackathons, grants, internships & accelerators</p>
      </div>

      {aiInsight && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">🤖</span>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wider">AI Recommendation</p>
              <p className="text-slate-700">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            >
              {uniqueTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            >
              {uniqueSectors.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredOpportunities.map((opp) => (
          <div
            key={opp.id}
            className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(opp.type)}`}>
                    {opp.type}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                  {opp.name}
                </h3>
                <p className="text-sm text-slate-500">{opp.organizer}</p>
              </div>
              <Award className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>

            <div className={`flex items-center gap-2 mb-4 ${getUrgencyColor(opp.deadline)}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {!opp.deadline || opp.deadline === 'Rolling' ? 'Rolling Deadline' : `Deadline: ${opp.deadline}`}
              </span>
            </div>

            {opp.prize && (
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Prize</p>
                <p className="text-sm text-slate-700 font-medium">{opp.prize}</p>
              </div>
            )}

            {opp.benefits && opp.benefits.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Benefits</p>
                <div className="flex flex-wrap gap-2">
                  {opp.benefits.map((benefit, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => opp.link && window.open(opp.link, '_blank')}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-md hover:shadow-blue-200 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2"
            >
              Apply Now
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="bg-white rounded-xl p-16 text-center border border-slate-100 shadow-sm">
          <Filter className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No opportunities found matching your filters</p>
        </div>
      )}
    </div>
  );
}
