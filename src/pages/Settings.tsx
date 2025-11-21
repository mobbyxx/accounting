import React, { useState, useEffect } from 'react';
import { Server, Clock, Bell, Send, Check, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EmailSettings {
    smtp_host: string;
    smtp_port: number;
    smtp_secure: boolean;
    smtp_user: string;
    smtp_password?: string;
    notification_enabled: boolean;
    notification_day: number;
    notification_hour: number;
    notification_minute: number;
}

const WEEKDAYS = [
    { value: 0, label: 'Sonntag' },
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' },
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
];

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<EmailSettings>({
        smtp_host: '',
        smtp_port: 587,
        smtp_secure: false,
        smtp_user: '',
        smtp_password: '',
        notification_enabled: false,
        notification_day: 0,
        notification_hour: 12,
        notification_minute: 0,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Lade Einstellungen beim Laden der Seite
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/settings', {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSettings({ ...data, smtp_password: '' }); // Passwort nicht anzeigen
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setErrorMessage('');

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save settings');
            }

            // Erfolgreich gespeichert
            alert('✅ Einstellungen erfolgreich gespeichert!');
        } catch (error: any) {
            console.error('Failed to save settings:', error);
            setErrorMessage(error.message || 'Fehler beim Speichern');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        setTestEmailStatus('sending');
        setErrorMessage('');

        try {
            const response = await fetch('/api/settings/test-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    smtp_host: settings.smtp_host,
                    smtp_port: settings.smtp_port,
                    smtp_secure: settings.smtp_secure,
                    smtp_user: settings.smtp_user,
                    smtp_password: settings.smtp_password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send test email');
            }

            setTestEmailStatus('success');
            setTimeout(() => setTestEmailStatus('idle'), 3000);
        } catch (error: any) {
            console.error('Failed to send test email:', error);
            setErrorMessage(error.message || 'Fehler beim Versenden der Test-E-Mail');
            setTestEmailStatus('error');
            setTimeout(() => setTestEmailStatus('idle'), 3000);
        }
    };

    const getNextNotification = () => {
        if (!settings.notification_enabled) return null;

        const now = new Date();
        const targetDay = settings.notification_day;
        const targetHour = settings.notification_hour;
        const targetMinute = settings.notification_minute;

        // Berechne nächsten Termin
        const next = new Date(now);
        next.setHours(targetHour, targetMinute, 0, 0);

        // Finde nächsten Wochentag
        const currentDay = now.getDay();
        let daysUntilNext = (targetDay - currentDay + 7) % 7;

        if (daysUntilNext === 0 && now > next) {
            daysUntilNext = 7; // Nächste Woche
        }

        next.setDate(now.getDate() + daysUntilNext);

        return next;
    };

    const nextNotification = getNextNotification();

    if (loading) {
        return (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Lade Einstellungen...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="header-title" style={{ marginBottom: '0.5rem' }}>Einstellungen</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Konfiguriere E-Mail-Benachrichtigungen für regelmäßige Erinnerungen
                </p>
            </div>

            {errorMessage && (
                <div className="card" style={{
                    marginBottom: '1.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                        <AlertCircle size={20} color="var(--danger)" />
                        <div>
                            <div style={{ fontWeight: '600', color: 'var(--danger)', marginBottom: '0.25rem' }}>
                                Fehler
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {errorMessage}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SMTP Konfiguration */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Server size={24} />
                    E-Mail Server (SMTP)
                </h2>

                <div className="card" style={{
                    marginBottom: '1.5rem',
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                        <Info size={20} color="var(--primary)" />
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Die E-Mails werden über Ihren SMTP-Server versendet (z.B. Gmail, Outlook, eigener Server).
                            Benachrichtigungen werden an <strong>{user?.email}</strong> gesendet.
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label className="label">SMTP Host</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="smtp.gmail.com"
                            value={settings.smtp_host}
                            onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="label">SMTP Port</label>
                        <input
                            type="number"
                            className="input"
                            placeholder="587"
                            value={settings.smtp_port}
                            onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.smtp_secure}
                            onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.checked })}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span className="label" style={{ marginBottom: 0 }}>Sichere Verbindung (SSL/TLS für Port 465)</span>
                    </label>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <label className="label">SMTP Benutzername / E-Mail</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="your-email@gmail.com"
                        value={settings.smtp_user}
                        onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                    />
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <label className="label">SMTP Passwort</label>
                    <input
                        type="password"
                        className="input"
                        placeholder="Passwort (leer lassen um nicht zu ändern)"
                        value={settings.smtp_password}
                        onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                    />
                </div>

                <button
                    onClick={handleTestEmail}
                    disabled={testEmailStatus === 'sending'}
                    className="btn btn-secondary"
                    style={{ marginTop: '1rem' }}
                >
                    {testEmailStatus === 'sending' && <Send size={18} className="spinning" />}
                    {testEmailStatus === 'success' && <Check size={18} />}
                    {testEmailStatus === 'error' && <AlertCircle size={18} />}
                    {testEmailStatus === 'idle' && <Send size={18} />}
                    <span>
                        {testEmailStatus === 'sending' && 'Sendet...'}
                        {testEmailStatus === 'success' && 'Test-E-Mail versendet!'}
                        {testEmailStatus === 'error' && 'Fehler beim Versenden'}
                        {testEmailStatus === 'idle' && 'Test-E-Mail senden'}
                    </span>
                </button>
            </div>

            {/* Benachrichtigungsplan */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={24} />
                    Benachrichtigungen
                </h2>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.notification_enabled}
                            onChange={(e) => setSettings({ ...settings, notification_enabled: e.target.checked })}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span className="label" style={{ marginBottom: 0 }}>E-Mail-Erinnerungen aktivieren</span>
                    </label>
                </div>

                {settings.notification_enabled && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label className="label">Wochentag</label>
                                <select
                                    className="input"
                                    value={settings.notification_day}
                                    onChange={(e) => setSettings({ ...settings, notification_day: parseInt(e.target.value) })}
                                >
                                    {WEEKDAYS.map(day => (
                                        <option key={day.value} value={day.value}>{day.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Uhrzeit</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="Stunde"
                                        min="0"
                                        max="23"
                                        value={settings.notification_hour}
                                        onChange={(e) => setSettings({ ...settings, notification_hour: parseInt(e.target.value) || 0 })}
                                    />
                                    <span>:</span>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="Minute"
                                        min="0"
                                        max="59"
                                        value={settings.notification_minute}
                                        onChange={(e) => setSettings({ ...settings, notification_minute: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>

                        {nextNotification && (
                            <div className="card" style={{
                                marginTop: '1rem',
                                background: 'rgba(34, 197, 94, 0.05)',
                                border: '1px solid rgba(34, 197, 94, 0.2)'
                            }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <Clock size={20} color="var(--success)" />
                                    <div>
                                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                            Nächste Benachrichtigung
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {nextNotification.toLocaleString('de-DE', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Speichern Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%' }}
            >
                {saving ? (
                    <>
                        <div className="spinning" style={{
                            width: '18px',
                            height: '18px',
                            border: '2px solid white',
                            borderTopColor: 'transparent',
                            borderRadius: '50%'
                        }} />
                        <span>Speichert...</span>
                    </>
                ) : (
                    <>
                        <Check size={18} />
                        <span>Einstellungen speichern</span>
                    </>
                )}
            </button>
        </div>
    );
};
