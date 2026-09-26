import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
export function useApi(path) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: null, error: null, loading: true, path });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    api(path, { signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false, path }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, error, loading: false, path });
      });
    return () => controller.abort();
  }, [path, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...(state.path === path ? state : { data: null, error: null, loading: true }), reload };
}
