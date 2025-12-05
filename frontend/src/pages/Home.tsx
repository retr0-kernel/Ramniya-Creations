import { useEffect, useState } from 'react';
import axios from 'axios';

interface HealthStatus {
  status: string;
}

function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await axios.get<HealthStatus>('/api/health');
        setHealth(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch health status');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '50px auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>🎨 Ramniya Creations</h1>
      <div style={{
        marginTop: '30px',
        padding: '20px',
        border: '2px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2>Backend Health Status</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {health && (
          <div style={{
            padding: '15px',
            backgroundColor: health.status === 'ok' ? '#d4edda' : '#f8d7da',
            border: `1px solid ${health.status === 'ok' ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            <strong>Status:</strong> {health.status}
            <br />
            <small style={{ color: '#666' }}>✓ Backend is running successfully</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
