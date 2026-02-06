import { HashRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentViewer from './pages/DocumentViewer';
import SearchPage from './pages/SearchPage';
import ClauseLibrary from './pages/ClauseLibrary';
import Chat from './pages/Chat';
import ResearchPage from './pages/ResearchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SystemPage from './pages/SystemPage';

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/:id" element={<DocumentViewer />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/clauses" element={<ClauseLibrary />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/system" element={<SystemPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
