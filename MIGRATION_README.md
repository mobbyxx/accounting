# Automatische Datenbank-Migration

## Problem gelöst

Die Migration wird jetzt **automatisch beim Server-Start** ausgeführt! Sie müssen kein separates Skript mehr manuell ausführen.

## Wie es funktioniert

### Bei Neuinstallation (leere Datenbank)
1. `init-db.sql` erstellt die Tabellen mit `user_id` bereits integriert
2. Server startet und führt Migrations-Check aus (findet alles OK)
3. Fertig! ✅

### Bei bestehender Datenbank (Update)
1. Docker Compose startet DB-Container
2. Health Check wartet bis DB bereit ist
3. Web-Container wartet auf DB Health Check
4. Server-Start führt automatisch `runMigrations()` aus:
   - Prüft ob `user_id` Spalte existiert → fügt hinzu falls nicht
   - Prüft ob Index existiert → erstellt falls nicht
   - Prüft ob Foreign Key existiert → überspringt (siehe Hinweis unten)
5. Server startet normal
6. Fertig! ✅

## Änderungen

### [server.js](file:///c:/Users/marvinz/Documents/accounting-tool/server.js)
- `runMigrations()` Funktion hinzugefügt mit idempotenter SQL-Migration
- Server-Start wartet auf Migration-Abschluss
- Fehlertoleranz: Migration-Fehler stoppen Server nicht sofort

### [docker-compose.yml](file:///c:/Users/marvinz/Documents/accounting-tool/docker-compose.yml)
- `POSTGRES_*` Environment-Variablen zum Web-Service hinzugefügt
- `depends_on` mit Health-Check-Condition erweitert
- Garantiert: DB ist ready bevor Server startet

## Deployment

```bash
# Auf VPS
cd /path/to/accounting-tool
git pull
docker-compose down
docker-compose up -d --build

# Logs überwachen
docker-compose logs -f web
```

**Erwartete Logs:**
```
✅ Connected to PostgreSQL database
🔄 Running database migrations...
✅ Database migrations completed
🚀 Server running on port 3000
```

## Wichtiger Hinweis: Foreign Key Constraint

Die Foreign Key Constraint wird NICHT automatisch hinzugefügt, um Fehler zu vermeiden falls bereits Transaktionen ohne `user_id` existieren.

**Wenn Sie bestehende Transaktionen haben:**

Option A: Alle einem Standard-User zuordnen
```sql
-- Auf VPS via docker exec
docker exec -it accounting-db psql -U accounting_user -d accounting

-- User erstellen (falls nicht vorhanden)
INSERT INTO accounting.users (cloudflare_sub, email, name) 
VALUES ('migration-user', 'your-email@example.com', 'Migration User')
ON CONFLICT DO NOTHING;

-- Alle Transaktionen ohne user_id diesem User zuordnen
UPDATE accounting.transactions 
SET user_id = (SELECT id FROM accounting.users WHERE cloudflare_sub = 'migration-user')
WHERE user_id IS NULL;

-- Jetzt Foreign Key hinzufügen
ALTER TABLE accounting.transactions 
ADD CONSTRAINT fk_transactions_user_id 
FOREIGN KEY (user_id) REFERENCES accounting.users(id) ON DELETE CASCADE;
```

Option B: Alte Transaktionen löschen (VORSICHT!)
```sql
DELETE FROM accounting.transactions WHERE user_id IS NULL;
```

## Testen

### Lokal
```bash
npm run server:dev
```

Check Logs für Migration-Nachrichten.

### Production
```bash
docker-compose logs -f web | grep -i migration
```

## Rollback

Falls etwas schief geht:

```bash
# Auf alten Stand zurück
git checkout HEAD~1
docker-compose down
docker-compose up -d --build
```

Die Migration ändert nur Schema, nicht die Daten. Bestehende Transaktionen bleiben erhalten.
