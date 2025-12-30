import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SahayakAI from './pages/SahayakAI';
import RouteMap from './pages/RouteMap';
import Opportunities from './pages/Opportunities';
import PitchAnalyzer from './pages/PitchAnalyzer';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-[hsl(var(--background))]">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sahayak-ai" element={<SahayakAI />} />
            <Route path="/route-map" element={<RouteMap />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/pitch-analyzer" element={<PitchAnalyzer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
