import { useEffect, useMemo, useState } from 'react';
import CaseCard from './components/CaseCard.jsx';

function useApiBaseUrl() {
  return useMemo(() => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
      return envUrl;
    }
    const { protocol, hostname } = window.location;
    const port = import.meta.env.DEV ? 5000 : window.location.port;
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }, []);
}

export default function App() {
  const apiBaseUrl = useApiBaseUrl();
  const [cases, setCases] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/cases`);
        if (!response.ok) {
          throw new Error(`Unable to load cases (status ${response.status})`);
        }
        const payload = await response.json();
        setCases(payload.data ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadCases();
  }, [apiBaseUrl]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Packly.gg Cases</h1>
        <p>Discover curated virtual card experiences backed by a modern API.</p>
      </header>

      <main className="app-main">
        {isLoading && <p className="status">Loading cases…</p>}
        {error && <p className="status error">{error}</p>}
        {!isLoading && !error && (
          <section className="case-grid" aria-live="polite">
            {cases.map((item) => (
              <CaseCard key={item.id} data={item} />
            ))}
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Backend base URL: <code>{apiBaseUrl}</code>
        </p>
        <p>
          Update <code>VITE_API_BASE_URL</code> in <code>.env</code> if you deploy the API to a different host.
        </p>
      </footer>
    </div>
  );
}
