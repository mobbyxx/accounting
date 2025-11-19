import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, ChevronRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
    const { hasPin, login, setupPin } = useAuth();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!hasPin) {
            // Setup mode
            if (pin.length < 4) {
                setError('PIN muss mindestens 4 Zeichen lang sein.');
                return;
            }
            if (pin !== confirmPin) {
                setError('PINs stimmen nicht überein.');
                return;
            }
            setupPin(pin);
            navigate('/');
        } else {
            // Login mode
            const success = login(pin);
            if (success) {
                navigate('/');
            } else {
                setError('Falscher PIN.');
                setPin('');
            }
        }
    };

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
                width: '100%',
                maxWidth: '420px',
                textAlign: 'center',
                padding: '2.5rem',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
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
                    {hasPin ? <Lock size={40} strokeWidth={1.5} /> : <ShieldCheck size={40} strokeWidth={1.5} />}
                </div>

                <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', fontWeight: '800' }}>
                    {hasPin ? 'Willkommen zurück' : 'Setup'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                    {hasPin
                        ? 'Bitte authentifizieren Sie sich.'
                        : 'Sichern Sie Ihren Zugang mit einem PIN.'}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="password"
                            className="input"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder={hasPin ? "PIN eingeben" : "Neuer PIN"}
                            autoFocus
                            style={{
                                textAlign: 'center',
                                letterSpacing: '0.75rem',
                                fontSize: '1.5rem',
                                padding: '1rem',
                                fontWeight: '700'
                            }}
                        />
                    </div>

                    {!hasPin && (
                        <div className="input-group animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <input
                                type="password"
                                className="input"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                placeholder="PIN bestätigen"
                                style={{
                                    textAlign: 'center',
                                    letterSpacing: '0.75rem',
                                    fontSize: '1.5rem',
                                    padding: '1rem',
                                    fontWeight: '700'
                                }}
                            />
                        </div>
                    )}

                    {error && (
                        <div style={{
                            color: 'var(--danger)',
                            marginBottom: '1.5rem',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '0.75rem',
                            borderRadius: '8px'
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            justifyContent: 'center'
                        }}
                    >
                        {hasPin ? 'Entsperren' : 'Speichern'}
                        <ChevronRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};
