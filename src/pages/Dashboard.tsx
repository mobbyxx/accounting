import React from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { getSummary, transactions } = useTransactions();
    const summary = getSummary();

    const data = [
        { name: 'Einnahmen', value: summary.income, color: '#22c55e' },
        { name: 'Ausgaben', value: summary.expenses, color: '#ef4444' },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
                <div>
                    <h1 className="header-title" style={{ marginBottom: '0.5rem' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Willkommen zurück! Hier ist Ihre Finanzübersicht.</p>
                </div>
                <div style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-card)',
                    borderRadius: '999px',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                }}>
                    {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '1.5rem', opacity: 0.1 }}>
                        <ArrowUpCircle size={100} color="var(--success)" />
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)' }}>
                                <ArrowUpCircle size={24} color="var(--success)" />
                            </div>
                            <span className="label" style={{ marginBottom: 0 }}>Einnahmen</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            {formatCurrency(summary.income)}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '1.5rem', opacity: 0.1 }}>
                        <ArrowDownCircle size={100} color="var(--danger)" />
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)' }}>
                                <ArrowDownCircle size={24} color="var(--danger)" />
                            </div>
                            <span className="label" style={{ marginBottom: 0 }}>Ausgaben</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            {formatCurrency(summary.expenses)}
                        </div>
                    </div>
                </div>

                <div className="card" style={{
                    background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.1) 100%)',
                    border: '1px solid var(--primary-light)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--primary-light)' }}>
                            <Wallet size={24} color="var(--primary)" />
                        </div>
                        <span className="label" style={{ marginBottom: 0 }}>Gewinn</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: summary.profit >= 0 ? 'var(--success)' : 'var(--danger)', letterSpacing: '-0.02em' }}>
                        {formatCurrency(summary.profit)}
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <TrendingUp size={16} />
                        <span>Aktueller Stand</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ minHeight: '400px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '2px' }} />
                        Finanzübersicht
                    </h2>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} barSize={60}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-secondary)"
                                    tick={{ fill: 'var(--text-secondary)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    tick={{ fill: 'var(--text-secondary)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `€${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--bg-card-hover)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text-primary)',
                                        borderRadius: '12px',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '4px', height: '24px', background: 'var(--warning)', borderRadius: '2px' }} />
                            Letzte Buchungen
                        </h2>
                    </div>

                    {transactions.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '200px',
                            color: 'var(--text-secondary)',
                            gap: '1rem'
                        }}>
                            <div style={{ padding: '1rem', borderRadius: '50%', background: 'var(--bg-app)' }}>
                                <Wallet size={32} opacity={0.5} />
                            </div>
                            <p>Keine Buchungen vorhanden.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {transactions.slice(0, 5).map((t) => (
                                <div key={t.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: 'var(--bg-app)',
                                    border: '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.transform = 'translateX(4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: t.type === 'income' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {t.type === 'income' ? <ArrowUpCircle size={20} color="var(--success)" /> : <ArrowDownCircle size={20} color="var(--danger)" />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{t.description}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {new Date(t.date).toLocaleDateString('de-DE')} • {t.category}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
