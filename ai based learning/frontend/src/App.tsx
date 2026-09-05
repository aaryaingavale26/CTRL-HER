import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LearningStudio } from './pages/LearningStudio';
import { IGOTLearning } from './pages/IGOTLearning';

import { getHealthStatus } from './api/ai';
import { HealthResponse } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('studio');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);

  useEffect(() => {
    const fetchHealth = async () => {
      setIsLoadingHealth(true);

      try {
        const res = await getHealthStatus();
        setHealth(res);
      } catch (err) {
        console.warn('Backend API connection check failed:', err);
        setHealth(null);
      } finally {
        setIsLoadingHealth(false);
      }
    };

    fetchHealth();

    const interval = setInterval(fetchHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50">

        <Header
          health={health}
          isLoadingHealth={isLoadingHealth}
        />

        <div className="flex flex-1">

          <Sidebar
            currentTab={currentTab}
            onTabChange={setCurrentTab}
          />

          <main className="flex-1 p-6 overflow-y-auto">

            <Routes>

              <Route
                path="/"
                element={<LearningStudio />}
              />

              <Route
                path="/studio"
                element={<LearningStudio />}
              />

              <Route
                path="/igot-learning"
                element={<IGOTLearning />}
              />

              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />

            </Routes>

          </main>

        </div>

      </div>
    </Router>
  );
};

export default App;