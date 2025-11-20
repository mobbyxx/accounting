-- Migration Script für Production-Datenbank
-- Führt user_id Spalte zu bestehenden transactions hinzu
-- 
-- WICHTIG: Dieses Skript sollte manuell auf dem VPS ausgeführt werden
-- BEVOR docker-compose mit der neuen Version gestartet wird

SET search_path TO accounting, public;

-- 1. Benutzer-Tabelle aktualisieren (falls noch alte Version)
ALTER TABLE users 
    DROP COLUMN IF EXISTS password_hash,
    ADD COLUMN IF NOT EXISTS cloudflare_sub VARCHAR(255) UNIQUE;

-- 2. user_id zu transactions hinzufügen (falls noch nicht vorhanden)
ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS user_id UUID;

-- 3. Index erstellen
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 4. Foreign Key Constraint hinzufügen (nur wenn user_id nicht NULL sein kann)
-- HINWEIS: Dies wird fehlschlagen, wenn bereits Transaktionen ohne user_id existieren
-- In diesem Fall müssen diese zuerst einem User zugeordnet werden
-- ALTER TABLE transactions 
--     ADD CONSTRAINT fk_transactions_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. Für bestehende Transaktionen ohne user_id:
-- Option A: Einem Standard-Admin-User zuordnen (empfohlen für Einzelbenutzer)
-- Option B: Alle ohne user_id löschen (VORSICHT!)
-- 
-- Beispiel Option A:
-- INSERT INTO users (cloudflare_sub, email, name) 
-- VALUES ('migrated-user', 'your-email@example.com', 'Your Name')
-- ON CONFLICT (cloudflare_sub) DO NOTHING;
-- 
-- UPDATE transactions 
-- SET user_id = (SELECT id FROM users WHERE cloudflare_sub = 'migrated-user')
-- WHERE user_id IS NULL;

COMMIT;
