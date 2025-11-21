-- Migration 002: E-Mail Benachrichtigungen Einstellungen
-- Erstellt eine Tabelle für User-spezifische E-Mail-Einstellungen und Benachrichtigungsplan

SET search_path TO accounting, public;

-- User Settings Tabelle
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    
    -- SMTP Konfiguration
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT false,
    smtp_user VARCHAR(255),
    smtp_password TEXT, -- Wird verschlüsselt gespeichert
    
    -- Benachrichtigungseinstellungen
    notification_enabled BOOLEAN DEFAULT false,
    notification_day INTEGER DEFAULT 0, -- 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
    notification_hour INTEGER DEFAULT 12,
    notification_minute INTEGER DEFAULT 0,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_notifications ON user_settings(notification_enabled) WHERE notification_enabled = true;

-- Trigger für auto-update
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant Permissions
GRANT ALL PRIVILEGES ON TABLE user_settings TO accounting_user;
