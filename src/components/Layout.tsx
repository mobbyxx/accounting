import React from 'react';
import { LayoutDashboard, Receipt, PieChart, Settings, Wallet } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Buchungen', icon: Receipt },
    { path: '/eur-report', label: 'EÜR Bericht', icon: PieChart },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar glass-panel">
        <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)'
          }}>
            <Wallet size={24} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', display: 'block', lineHeight: '1' }}>Finance</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Manager Pro</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)'
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <Link to="/settings" className="nav-item">
            <Settings size={20} />
            <span>Einstellungen</span>
          </Link>
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'var(--bg-app)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Pro Plan</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gültig bis 31.12.2025</div>
          </div>
        </div>
      </aside>
      <main className="main-content animate-fade-in">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
};
