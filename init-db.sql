-- Initialisierung der Datenbank
-- Dieses Skript wird beim ersten Start der Datenbank ausgeführt

-- Erstelle Schema für Accounting Tool
CREATE SCHEMA IF NOT EXISTS accounting;

-- Setze Search Path
SET search_path TO accounting, public;

-- Benutzer-Tabelle für Cloudflare Authentication (muss vor transactions erstellt werden)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cloudflare_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transaktionen-Tabelle mit User-Zuordnung
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100),
    vat_rate DECIMAL(5, 2) DEFAULT 0.00,
    vat_amount DECIMAL(12, 2) DEFAULT 0.00,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Funktion für automatisches Updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für auto-update
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant Permissions
GRANT ALL PRIVILEGES ON SCHEMA accounting TO accounting_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA accounting TO accounting_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA accounting TO accounting_user;
