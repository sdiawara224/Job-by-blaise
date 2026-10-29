import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Landing from './pages/Landing.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Advice from './pages/Advice.jsx';
import AdviceDetail from './pages/AdviceDetail.jsx';
import AppLayout from './pages/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Applications from './pages/Applications.jsx';
import Alerts from './pages/Alerts.jsx';
import AppJobs from './pages/AppJobs.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Chargement…</div>;
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Chargement…</div>;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ---- Public ---- */}
      <Route path="/" element={<Landing />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/conseils" element={<Advice />} />
      <Route path="/conseils/:id" element={<AdviceDetail />} />
      <Route path="/connexion" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/inscription" element={<GuestOnly><Register /></GuestOnly>} />

      {/* ---- Espace candidat ---- */}
      <Route path="/app" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="offres" element={<AppJobs />} />
        <Route path="offres/:id" element={<JobDetail inApp />} />
        <Route path="profil" element={<Profile />} />
        <Route path="candidatures" element={<Applications />} />
        <Route path="alertes" element={<Alerts />} />
        <Route path="conseils" element={<Advice inApp />} />
        <Route path="conseils/:id" element={<AdviceDetail inApp />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
