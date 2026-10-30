import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import OverviewPage from './pages/OverviewPage';
import SimulatorPage from './pages/SimulatorPage';
import ComparisonPage from './pages/ComparisonPage';
import AlgorithmLabPage from './pages/AlgorithmLabPage';
import DocsPage from './pages/DocsPage';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-background text-text-primary">
        {/* Left Fixed Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-background bg-grid">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/comparison" element={<ComparisonPage />} />
            <Route path="/lab" element={<AlgorithmLabPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
