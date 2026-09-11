import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './store';
import Layout from './components/Layout';
import Notification from './components/Notification';
import InstallPrompt from './components/InstallPrompt';
import Dashboard from './pages/Dashboard';
import ImageStudio from './pages/ImageStudio';
import VideoEngine from './pages/VideoEngine';
import Billing from './pages/Billing';
import Rewards from './pages/Rewards';
import AuthGate from './pages/AuthGate';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AuthGate onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <StoreProvider>
      <BrowserRouter>
        <Notification />
        <InstallPrompt />
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/image-studio" element={<ImageStudio />} />
            <Route path="/video-engine" element={<VideoEngine />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
