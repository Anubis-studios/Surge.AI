// ============================================================
// Surge.AI — Backend Entry Page
// ============================================================
// Simple landing page for the backend API
// ============================================================

export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif',
      background: '#050509',
      color: '#e5e5e5',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '2rem'
    }}>
      <h1 style={{ 
        fontSize: '3rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '1rem'
      }}>
        Surge.AI API
      </h1>
      <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
        Backend API server is running
      </p>
      <div style={{ marginTop: '2rem', fontFamily: 'monospace', fontSize: '0.9rem', color: '#9ca3af' }}>
        <p>✅ API Status: Healthy</p>
        <p>📡 Endpoints: /api/*</p>
        <p>🏥 Health: /api/health</p>
      </div>
    </div>
  );
}
