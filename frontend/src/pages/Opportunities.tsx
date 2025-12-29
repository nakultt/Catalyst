/**
 * Opportunities Page - Opportunity Radar
 * Lists active grants, hackathons, accelerators with apply functionality
 */
import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Trophy, 
  ExternalLink, 
  X, 
  Loader2,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { getOpportunities, getUserProfile, submitApplication, type Opportunity, type UserProfile } from '../lib/api';

interface ApplyModalProps {
  opportunity: Opportunity;
  userProfile: UserProfile;
  onClose: () => void;
  onSuccess: (applicationId: string) => void;
}

function ApplyModal({ opportunity, userProfile, onClose, onSuccess }: ApplyModalProps) {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [startupName, setStartupName] = useState(userProfile.startup_name);
  const [pitch, setPitch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await submitApplication(
        opportunity.id,
        name,
        email,
        startupName,
        pitch
      );
      onSuccess(response.application_id);
    } catch (error) {
      console.error('Application error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-dark-600">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Apply for {opportunity.name}</h3>
              <p className="text-dark-400 text-sm mt-1">Organized by {opportunity.organizer}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-dark w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Startup Name</label>
            <input
              type="text"
              value={startupName}
              onChange={(e) => setStartupName(e.target.value)}
              className="input-dark w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Why should you be selected?</label>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              className="input-dark w-full h-32 resize-none"
              placeholder="Tell us about your startup and why you're a good fit..."
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-dark-700 hover:bg-dark-600 rounded-xl text-white transition-colors flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gradient flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SuccessModal({ applicationId, onClose }: { applicationId: string; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Application Submitted!</h3>
          <p className="text-dark-400 mt-2">Your application ID is:</p>
          <p className="text-primary-400 font-mono text-lg mt-1">{applicationId}</p>
          <p className="text-dark-500 text-sm mt-4">You will receive a confirmation email shortly.</p>
          <button onClick={onClose} className="btn-gradient w-full mt-6">
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  onApply: (opp: Opportunity) => void;
}

function OpportunityCard({ opportunity, onApply }: OpportunityCardProps) {
  const daysLeft = Math.ceil(
    (new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isUrgent = daysLeft <= 7;

  return (
    <div className="glass-card p-6 hover:translate-y-[-2px] transition-transform animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className={`badge ${opportunity.type === 'Hackathon' ? 'badge-primary' : opportunity.type === 'Grant' ? 'badge-success' : 'badge-warning'}`}>
              {opportunity.type}
            </span>
          </div>
        </div>
        {isUrgent && (
          <span className="badge badge-error animate-pulse">
            {daysLeft} days left!
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{opportunity.name}</h3>
      <p className="text-dark-400 text-sm mb-4">by {opportunity.organizer}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-warning-400" />
          <span className="text-dark-300">{opportunity.prize}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary-400" />
          <span className="text-dark-300">Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {opportunity.benefits.slice(0, 3).map((benefit, idx) => (
          <span key={idx} className="px-2 py-1 bg-dark-800 rounded-lg text-xs text-dark-300">
            {benefit}
          </span>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onApply(opportunity)}
          className="btn-gradient flex-1"
        >
          <span>Apply Now</span>
        </button>
        <a
          href={opportunity.link}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-xl text-dark-300 transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [successApplicationId, setSuccessApplicationId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [opps, profile] = await Promise.all([
          getOpportunities(),
          getUserProfile()
        ]);
        setOpportunities(opps);
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load opportunities:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredOpportunities = filter === 'all' 
    ? opportunities 
    : opportunities.filter(o => o.type.toLowerCase() === filter);

  const handleApplySuccess = (applicationId: string) => {
    setSelectedOpportunity(null);
    setSuccessApplicationId(applicationId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="text-dark-400 mt-4">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-500 to-error-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Opportunity Radar</h1>
            <p className="text-dark-400 text-sm">Active grants, hackathons, and accelerators</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-dark py-2"
          >
            <option value="all">All Types</option>
            <option value="hackathon">Hackathons</option>
            <option value="grant">Grants</option>
            <option value="accelerator">Accelerators</option>
            <option value="competition">Competitions</option>
          </select>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOpportunities.map((opp, index) => (
          <div key={opp.id} className={`stagger-${(index % 5) + 1}`}>
            <OpportunityCard
              opportunity={opp}
              onApply={setSelectedOpportunity}
            />
          </div>
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-300">No opportunities found</h3>
          <p className="text-dark-500 mt-2">Try changing the filter or check back later.</p>
        </div>
      )}

      {/* Apply Modal */}
      {selectedOpportunity && userProfile && (
        <ApplyModal
          opportunity={selectedOpportunity}
          userProfile={userProfile}
          onClose={() => setSelectedOpportunity(null)}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* Success Modal */}
      {successApplicationId && (
        <SuccessModal
          applicationId={successApplicationId}
          onClose={() => setSuccessApplicationId(null)}
        />
      )}
    </div>
  );
}

export default Opportunities;
