import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

const ActivityContext = createContext(null);
export const useCandidateActivity = () => useContext(ActivityContext);

// Une source commune aux candidatures, compteurs, cloche et notifications.
// Actualisation toutes les 30 s, au retour sur l’onglet et après une mutation locale.
export function CandidateActivityProvider({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const next = await api('/activity');
      if (request !== generation.current) return;
      setData(next); setError('');
    } catch (e) {
      if (request === generation.current) setError(e.message);
    }
  }, [user?.id]);
  useEffect(() => {
    const visibleRefresh = () => { if (document.visibilityState !== 'hidden') refresh(); };
    refresh();
    const timer = setInterval(visibleRefresh, 30000);
    window.addEventListener('focus', visibleRefresh);
    window.addEventListener('candidate-activity-changed', visibleRefresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    return () => {
      ++generation.current;
      clearInterval(timer);
      window.removeEventListener('focus', visibleRefresh);
      window.removeEventListener('candidate-activity-changed', visibleRefresh);
      document.removeEventListener('visibilitychange', visibleRefresh);
    };
  }, [refresh, pathname]);
  return <ActivityContext.Provider value={{ data, error, refresh }}>{children}</ActivityContext.Provider>;
}
