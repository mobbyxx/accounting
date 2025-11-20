import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
    const { isAuthenticated, loading, checkAuth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        // Retry authentication check after a delay if not authenticated
        if (!loading && !isAuthenticated) {
            const timer = setTimeout(() => {
                checkAuth();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [loading, isAuthenticated, checkAuth]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)',
            padding: '1rem'
        }}>
            <div className="card glass-panel animate-fade-in" style={{
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center',
                padding: '2rem',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                margin: '1rem'
            }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '1.25rem',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
                    color: 'var(--primary)',
                    marginBottom: '2rem',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.1)'
                }}>
                    <ShieldCheck size={40} strokeWidth={1.5} />
                </div>

                <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', fontWeight: '800' }}>
                    Authentifizierung
                </h1>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                    {loading ? 'Prüfe Cloudflare Access...' : 'Authentifizierung wird durchgeführt...'}
                </p>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '2rem'
                }}>
                    <Loader2
                        size={24}
                        style={{
                            animation: 'spin 1s linear infinite',
                            color: 'var(--primary)'
                        }}
                    />
                </div>

                {!loading && !isAuthenticated && (
                    <div style={{
                        color: 'var(--warning)',
                        marginTop: '2rem',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: 'rgba(251, 191, 36, 0.1)',
                        padding: '0.75rem',
                        borderRadius: '8px'
                    }}>
                        <span>⚠️</span>
                        <span>Bitte stellen Sie sicher, dass Sie über Cloudflare Access zugreifen.</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
