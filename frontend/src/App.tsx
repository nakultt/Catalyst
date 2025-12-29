/**
 * Validator - AI-Powered Startup Funding Assistant
 * Main Application Entry
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout';
import { Dashboard, Chatbot, RouteMap, PitchAnalyzer, Opportunities } from './pages';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="chat" element={<Chatbot />} />
          <Route path="route-map" element={<RouteMap />} />
          <Route path="pitch" element={<PitchAnalyzer />} />
          <Route path="opportunities" element={<Opportunities />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
