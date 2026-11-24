import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

// Une réponse appartient à une URL, une session/profil et une tentative précise.
// Les réponses d'une ancienne navigation ne doivent jamais remplacer l'écran courant.
export default function useApiResource(path, identity = null) {
  const [revision, setRevision] = useState(0);
  const key = useMemo(() => ({ path, identity, revision }), [path, identity, revision]);
  const [result, setResult] = useState({ key: null, data: null, error: '' });
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    let active = true;
    api(path).then(
      data => { if (active) setResult({ key, data, error: '' }); },
      error => { if (active) setResult({ key, data: null, error: error.message }); },
    );
    return () => { active = false; };
  }, [key]);

  const current = result.key === key;
  return {
    data: current ? result.data : null,
    error: current ? result.error : '',
    loading: !current,
    reload,
  };
}
