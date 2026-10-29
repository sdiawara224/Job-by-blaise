import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Landing from './pages/Landing.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Entreprises from './pages/Entreprises.jsx';
import EntrepriseDetail from './pages/EntrepriseDetail.jsx';
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
  if (loading) return <div className="page-loader"><span className="dots" /></div>;
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><span className="dots" /></div>;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

/** Révèle au scroll les éléments `.reveal` (IntersectionObserver + MutationObserver). */
function useScrollReveal(pathname) {
  useEffect(() => {
    const collect = (root) => {
      const out = [];
      if (root.nodeType === 1 && root.matches?.('.reveal')) out.push(root);
      root.querySelectorAll?.('.reveal').forEach((el) => out.push(el));
      return out;
    };
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

    collect(document.body).forEach((el) => io.observe(el));

    // grilles rendues après fetch : on observe les nouveaux nœuds `.reveal`
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const node of m.addedNodes) collect(node).forEach((el) => io.observe(el));
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);
}

export default function App() {
  const location = useLocation();

  useScrollReveal(location.pathname);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  }, [location.pathname]);

  return (
    <Routes>
      {/* ---- Public ---- */}
      <Route path="/" element={<Landing />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/entreprises" element={<Entreprises />} />
      <Route path="/entreprises/:id" element={<EntrepriseDetail />} />
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
