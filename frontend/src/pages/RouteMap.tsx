/**
 * Route Map Page - Visual Funding Navigator
 * React Flow-based dynamic funding roadmap generator
 */
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Map, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { generateRouteMap } from '../lib/api';

const STAGES = ['Idea', 'Prototype', 'MVP', 'Revenue', 'Growth'];
const SECTORS = ['AgriTech', 'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'DeepTech', 'CleanTech', 'Consumer'];
const LOCATIONS = ['Coimbatore', 'Chennai', 'Bangalore', 'Mumbai', 'Jaipur', 'Pune', 'Hyderabad', 'Delhi'];

export function RouteMap() {
  const [stage, setStage] = useState('Idea');
  const [sector, setSector] = useState('AgriTech');
  const [location, setLocation] = useState('Coimbatore');
  const [isLoading, setIsLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [summary, setSummary] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await generateRouteMap(stage, sector, location);
      setNodes(result.nodes as Node[]);
      setEdges(result.edges as Edge[]);
      setSummary(result.summary);
      setGenerated(true);
    } catch (error) {
      console.error('Failed to generate route map:', error);
    } finally {
      setIsLoading(false);
    }
  }, [stage, sector, location, setNodes, setEdges]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center">
          <Map className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Funding Route Map</h1>
          <p className="text-dark-400 text-sm">Generate your personalized step-by-step funding roadmap</p>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="input-dark w-full"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="input-dark w-full"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-dark w-full"
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="btn-gradient w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Route</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="glass-card overflow-hidden" style={{ height: '500px' }}>
        {!generated ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
                <Map className="w-10 h-10 text-dark-500" />
              </div>
              <h3 className="text-lg font-semibold text-dark-300">No Route Generated Yet</h3>
              <p className="text-dark-500 mt-2 max-w-md">
                Select your startup stage, sector, and location, then click "Generate Route" to see your personalized funding roadmap.
              </p>
              <div className="flex items-center justify-center gap-2 mt-6 text-dark-400">
                <span>Start</span>
                <ArrowRight className="w-4 h-4" />
                <span>DPIIT</span>
                <ArrowRight className="w-4 h-4" />
                <span>Scheme</span>
                <ArrowRight className="w-4 h-4" />
                <span>Investor</span>
                <ArrowRight className="w-4 h-4" />
                <span>Funded!</span>
              </div>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#4B5563" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor="#6366F1"
              maskColor="rgba(0, 0, 0, 0.8)"
              style={{ backgroundColor: '#1F2937' }}
            />
          </ReactFlow>
        )}
      </div>

      {/* Summary */}
      {generated && summary && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-success-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-success-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Route Summary</h4>
              <p className="text-dark-400 mt-1">{summary}</p>
              <p className="text-dark-500 text-sm mt-2">
                Click and drag nodes to rearrange. Use scroll to zoom, and drag the canvas to pan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteMap;
