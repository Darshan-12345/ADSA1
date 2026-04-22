import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppDataProvider } from './context/AppDataContext';
import AppLayout from './layout/AppLayout';
import OverviewPage from './pages/OverviewPage';
import SearchPage from './pages/SearchPage';
import FileExplorerPage from './pages/FileExplorerPage';
import StructurePage from './pages/StructurePage';
import InsightsPage from './pages/InsightsPage';
import TemporaryPage from './pages/TemporaryPage';
import RelationshipsPage from './pages/RelationshipsPage';
import BackupPage from './pages/BackupPage';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true }}>
      <AppDataProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="explorer" element={<FileExplorerPage />} />
            <Route path="structure" element={<StructurePage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="temporary" element={<TemporaryPage />} />
            <Route path="relationships" element={<RelationshipsPage />} />
            <Route path="backup" element={<BackupPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppDataProvider>
    </BrowserRouter>
  );
}
