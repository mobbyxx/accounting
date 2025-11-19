import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import type { TransactionInput } from '../types';
import { Trash2, Plus, Scan, Paperclip, FileText, Camera, Search, Filter, X } from 'lucide-react';
import { parseReceipt } from '../services/ocrService';
import { CameraModal } from '../components/CameraModal';
import { CATEGORIES } from '../constants/categories';

export const Transactions: React.FC = () => {
    const { transactions, addTransaction, deleteTransaction, getSummary } = useTransactions();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [showCamera, setShowCamera] = useState<'ocr' | 'attachment' | null>(null);
    const [formData, setFormData] = useState<TransactionInput>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'expense',
        category: '',
        vatRate: 19,
        attachmentUrl: undefined
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.description.trim()) {
            setError('Bitte geben Sie eine Beschreibung ein.');
            return;
        }
        if (formData.amount <= 0) {
            setError('Der Betrag muss größer als 0 sein.');
            return;
        }
        if (!formData.category.trim()) {
            setError('Bitte geben Sie eine Kategorie ein.');
            return;
        }

        addTransaction(formData);

        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: 0,
            type: 'expense',
            category: '',
            vatRate: 19,
            attachmentUrl: undefined
        });
        setIsFormOpen(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, attachmentUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOCR = async (file: File) => {
        setIsScanning(true);
        try {
            const result = await parseReceipt(file);
            setFormData(prev => ({
                ...prev,
                date: result.date || prev.date,
                amount: result.amount || prev.amount,
                description: result.text.split('\n')[0].substring(0, 50) || prev.description
            }));
            setIsFormOpen(true);
        } catch (err) {
            console.error(err);
            setError('OCR fehlgeschlagen');
        } finally {
            setIsScanning(false);
        }
    };

    const handleCameraCapture = (file: File) => {
        if (showCamera === 'ocr') {
            handleOCR(file);
        } else if (showCamera === 'attachment') {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, attachmentUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
        setShowCamera(null);
    };

    const summary = getSummary();

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.05) 100%)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Einnahmen</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--success)' }}>{formatCurrency(summary.income)}</p>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ausgaben</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--danger)' }}>{formatCurrency(summary.expenses)}</p>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gewinn</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: summary.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {formatCurrency(summary.profit)}
                    </p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Geschätzte ESt (2025)</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {formatCurrency(summary.estimatedIncomeTax)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>*Prognose gem. § 32a EStG</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="header-title" style={{ marginBottom: 0 }}>Buchungen</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
                        {isFormOpen ? <X size={20} /> : <Plus size={20} />}
                        {isFormOpen ? 'Abbrechen' : 'Neue Buchung'}
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem', border: '1px solid var(--primary-light)', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem' }}>Neue Buchung erfassen</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                <Scan size={16} />
                                {isScanning ? 'Scanne...' : 'Beleg Scan'}
                                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleOCR(e.target.files[0])} style={{ display: 'none' }} disabled={isScanning} />
                            </label>
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowCamera('ocr')}
                                disabled={isScanning}
                                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                            >
                                <Camera size={16} />
                                Kamera
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--danger)',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Datum</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                            <label className="label">Beschreibung</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                placeholder="z.B. Bürobedarf"
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Betrag (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Typ</label>
                            <select
                                className="input"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                            >
                                <option value="income">Einnahme (+)</option>
                                <option value="expense">Ausgabe (-)</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Kategorie (DATEV/SKR03)</label>
                            <select
                                className="input"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                <option value="">Bitte wählen...</option>
                                {CATEGORIES.filter(c => c.type === formData.type).map((cat) => (
                                    <option key={cat.code} value={`${cat.label} (${cat.code})`}>
                                        {cat.label} ({cat.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Umsatzsteuer</label>
                            <select
                                className="input"
                                value={formData.vatRate}
                                onChange={(e) => setFormData({ ...formData, vatRate: parseInt(e.target.value) })}
                            >
                                <option value={19}>19%</option>
                                <option value={7}>7%</option>
                                <option value={0}>0%</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Beleg</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <label className="btn-outline" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                    <Paperclip size={16} />
                                    {formData.attachmentUrl ? 'Ändern' : 'Anhängen'}
                                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => setShowCamera('attachment')}
                                    style={{ padding: '0.5rem 1rem' }}
                                    title="Foto aufnehmen"
                                >
                                    <Camera size={16} />
                                </button>
                                {formData.attachmentUrl && (
                                    <div style={{ padding: '0.5rem', color: 'var(--success)', display: 'flex', alignItems: 'center' }}>
                                        <FileText size={20} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: 'span 2' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Buchung speichern</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card table-container">
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Beschreibung</th>
                            <th>Kategorie</th>
                            <th>Steuer</th>
                            <th style={{ textAlign: 'right' }}>Betrag</th>
                            <th style={{ width: '100px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((t) => (
                            <tr key={t.id} style={{ transition: 'background-color 0.2s' }}>
                                <td>{new Date(t.date).toLocaleDateString('de-DE')}</td>
                                <td style={{ fontWeight: '500' }}>{t.description}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        fontSize: '0.85rem',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {t.category}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.vatRate}%</span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </td>
                                <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    {t.attachmentUrl && (
                                        <a
                                            href={t.attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-ghost"
                                            style={{ padding: '0.5rem', color: 'var(--primary)' }}
                                            title="Beleg anzeigen"
                                        >
                                            <FileText size={18} />
                                        </a>
                                    )}
                                    <button
                                        className="btn-ghost"
                                        style={{ padding: '0.5rem', color: 'var(--danger)' }}
                                        onClick={() => deleteTransaction(t.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Search size={48} opacity={0.2} />
                                        <p>Keine Buchungen gefunden.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showCamera && (
                <CameraModal
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(null)}
                />
            )}
        </div>
    );
};
