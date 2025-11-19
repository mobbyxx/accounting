import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Download, ChevronDown } from 'lucide-react';
import { exportEURToCSV, exportEURToExcel, exportEURToPDF } from '../services/exportService';

export const EURReport: React.FC = () => {
    const { transactions, getSummary } = useTransactions();
    const summary = getSummary();
    const [showExportMenu, setShowExportMenu] = useState(false);

    const groupByCategory = (type: 'income' | 'expense') => {
        const filtered = transactions.filter(t => t.type === type);
        const grouped = filtered.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    };

    const incomeByCategory = groupByCategory('income');
    const expensesByCategory = groupByCategory('expense');

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
        const timestamp = new Date().toISOString().split('T')[0];
        switch (format) {
            case 'csv':
                exportEURToCSV(incomeByCategory, expensesByCategory, summary, `euer_bericht_${timestamp}.csv`);
                break;
            case 'excel':
                exportEURToExcel(incomeByCategory, expensesByCategory, summary, `euer_bericht_${timestamp}.xlsx`);
                break;
            case 'pdf':
                exportEURToPDF(incomeByCategory, expensesByCategory, summary, `euer_bericht_${timestamp}.pdf`);
                break;
        }
        setShowExportMenu(false);
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="header-title" style={{ marginBottom: '0.5rem' }}>Einnahmenüberschussrechnung</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Detaillierte Auswertung Ihrer geschäftlichen Finanzen.</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn btn-outline"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={transactions.length === 0}
                    >
                        <Download size={18} />
                        Exportieren
                        <ChevronDown size={16} />
                    </button>
                    {showExportMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            boxShadow: 'var(--shadow-lg)',
                            overflow: 'hidden',
                            zIndex: 1000,
                            minWidth: '160px'
                        }}>
                            <button
                                onClick={() => handleExport('csv')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                CSV exportieren
                            </button>
                            <button
                                onClick={() => handleExport('excel')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                Excel exportieren
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                PDF exportieren
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.05) 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)' }}>
                            <TrendingUp size={24} color="var(--success)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Betriebseinnahmen</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{formatCurrency(summary.income)}</div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)' }}>
                            <TrendingDown size={24} color="var(--danger)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Betriebsausgaben</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{formatCurrency(summary.expenses)}</div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ border: '1px solid var(--primary-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--primary-light)' }}>
                            <DollarSign size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Vorläufiger Gewinn</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: summary.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {formatCurrency(summary.profit)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* Einnahmen */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                        Einnahmen nach Kategorie
                    </h2>
                    <div style={{ height: '300px', marginBottom: '2rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={incomeByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {incomeByCategory.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text-primary)',
                                        borderRadius: '8px',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {incomeByCategory.map((item, index) => (
                            <div key={item.name} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                background: 'var(--bg-app)',
                                borderLeft: `4px solid ${COLORS[index % COLORS.length]}`
                            }}>
                                <span style={{ fontWeight: '500' }}>{item.name}</span>
                                <span style={{ fontWeight: 'bold' }}>{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ausgaben */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} />
                        Ausgaben nach Kategorie
                    </h2>
                    <div style={{ height: '300px', marginBottom: '2rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expensesByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {expensesByCategory.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text-primary)',
                                        borderRadius: '8px',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {expensesByCategory.map((item, index) => (
                            <div key={item.name} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                background: 'var(--bg-app)',
                                borderLeft: `4px solid ${COLORS[index % COLORS.length]}`
                            }}>
                                <span style={{ fontWeight: '500' }}>{item.name}</span>
                                <span style={{ fontWeight: 'bold' }}>{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
