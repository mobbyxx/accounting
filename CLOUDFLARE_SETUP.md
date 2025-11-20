# Cloudflare Access Setup Guide

## Schritt 1: Cloudflare Access Audience Tag finden

1. Öffnen Sie das [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Gehen Sie zu **Zero Trust** → **Access** → **Applications**
3. Wählen Sie Ihre Application aus
4. Im **Overview** Tab finden Sie den **Application Audience (AUD) Tag**
5. Kopieren Sie diesen Tag

## Schritt 2: Environment-Variablen konfigurieren

Bearbeiten Sie die `.env` Datei auf Ihrem VPS:

```bash
# Ihr Team Domain (Format: your-team.cloudflareaccess.com)
CF_TEAM_DOMAIN=your-team.cloudflareaccess.com

# Application Audience Tag aus Schritt 1
CF_AUD=paste-your-aud-tag-here

# Database Credentials
POSTGRES_PASSWORD=<sicheres-passwort>
REDIS_PASSWORD=<sicheres-passwort>
```

## Schritt 3: Cloudflare Tunnel Port anpassen

Ihr Cloudflare Tunnel muss auf **Port 3000** zeigen (vorher war es Port 80).

Bearbeiten Sie Ihre Cloudflare Tunnel Konfiguration:

```yaml
ingress:
  - hostname: your-app.example.com
    service: http://localhost:3000  # ← Geändert von 80 auf 3000
  - service: http_status:404
```

## Schritt 4: Deployment

```bash
# Im accounting-tool Verzeichnis
cd /path/to/accounting-tool

# Docker Container neu bauen und starten
docker-compose down
docker-compose up -d --build

# Logs überwachen
docker-compose logs -f web
```

## Schritt 5: Testen

1. Öffnen Sie Ihre Cloudflare Access URL (z.B. `https://your-app.example.com`)
2. Sie werden zu Google OAuth weitergeleitet
3. Nach erfolgreicher Authentifizierung werden Sie automatisch eingeloggt
4. Ihr Name und Email sollten in der Sidebar unten erscheinen
5. Testen Sie den Logout-Button

## Troubleshooting

### "No Cloudflare Access token found"
- Stellen Sie sicher, dass Sie über die Cloudflare Access URL zugreifen
- Prüfen Sie, dass Cloudflare Access Application korrekt konfiguriert ist

### Port-Fehler
- Stellen Sie sicher, dass Port 3000 nicht bereits verwendet wird
- Ändern Sie den Port in `docker-compose.yml` falls nötig

### JWT Validation Error
- Überprüfen Sie den `CF_AUD` Wert in der `.env` Datei
- Vergleichen Sie mit dem AUD Tag im Cloudflare Dashboard

## Wichtig

> **Kein PIN mehr nötig**: Die alte PIN-Authentifizierung wurde komplett entfernt. Alle Benutzer authentifizieren sich jetzt über Google via Cloudflare Access.
