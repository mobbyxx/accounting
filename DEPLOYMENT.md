# Deployment-Anleitung: Accounting Tool auf VPS mit Docker und Cloudflare

Diese Anleitung beschreibt das vollständige Deployment des Accounting Tools als Docker-Container auf einem VPS mit separater PostgreSQL-Datenbank und Cloudflare-Integration.

## 📋 Voraussetzungen

- VPS mit mindestens 2 GB RAM (empfohlen: 4 GB)
- Ubuntu 22.04 LTS oder neuer (andere Distributionen funktionieren ebenfalls)
- Root- oder Sudo-Zugriff
- Domain mit Cloudflare-Account
- SSH-Zugang zum VPS

## 🚀 Teil 1: VPS-Vorbereitung

### 1.1 Mit VPS verbinden

```bash
ssh root@IHRE_VPS_IP
```

### 1.2 System aktualisieren

```bash
apt update && apt upgrade -y
```

### 1.3 Docker installieren

```bash
# Docker Installation Script
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt install docker-compose-plugin -y

# Docker Service starten und autostart aktivieren
systemctl start docker
systemctl enable docker

# Überprüfen
docker --version
docker compose version
```

### 1.4 Firewall konfigurieren (UFW)

```bash
# UFW installieren falls nicht vorhanden
apt install ufw -y

# Grundlegende Regeln
ufw default deny incoming
ufw default allow outgoing

# SSH erlauben (WICHTIG: Vor dem Aktivieren!)
ufw allow ssh
ufw allow 22/tcp

# HTTP & HTTPS erlauben
ufw allow 80/tcp
ufw allow 443/tcp

# Firewall aktivieren
ufw enable

# Status prüfen
ufw status
```

## 🔧 Teil 2: Anwendung deployen

### 2.1 Arbeitsverzeichnis erstellen

```bash
# Verzeichnis für die Anwendung erstellen
mkdir -p /opt/accounting-tool
cd /opt/accounting-tool
```

### 2.2 Code auf den VPS übertragen

**Option A: Via Git (empfohlen)**

```bash
# Git installieren
apt install git -y

# Repository klonen (falls Sie ein Git-Repo haben)
git clone https://github.com/IHR_USERNAME/accounting-tool.git .
```

**Option B: Via SCP (von Ihrem lokalen Rechner)**

```bash
# Auf Ihrem lokalen Rechner ausführen:
scp -r c:/Users/marvinz/Documents/accounting-tool/* root@IHRE_VPS_IP:/opt/accounting-tool/
```

**Option C: Via SFTP-Client**

Verwenden Sie FileZilla, WinSCP oder einen anderen SFTP-Client, um die Dateien hochzuladen.

### 2.3 Environment-Variablen konfigurieren

```bash
cd /opt/accounting-tool

# .env Datei aus Template erstellen
cp .env.example .env

# .env mit sicheren Passwörtern bearbeiten
nano .env
```

Setzen Sie sichere Passwörter:

```env
POSTGRES_DB=accounting
POSTGRES_USER=accounting_user
POSTGRES_PASSWORD=IhrSehrSicheresPasswort123!@#

REDIS_PASSWORD=IhrSehrSicheresRedisPasswort456!@#

NODE_ENV=production
APP_URL=https://ihre-domain.de
```

**Tipp:** Generieren Sie sichere Passwörter:
```bash
openssl rand -base64 32
```

### 2.4 Docker Container starten

```bash
# Images bauen und Container starten
docker compose up -d

# Logs überprüfen
docker compose logs -f

# Status prüfen
docker compose ps
```

Alle Services sollten als "healthy" angezeigt werden.

## 🌐 Teil 3: Cloudflare-Konfiguration

### 3.1 Domain zu Cloudflare hinzufügen

1. Melden Sie sich bei [Cloudflare](https://dash.cloudflare.com) an
2. Klicken Sie auf **"Website hinzufügen"**
3. Geben Sie Ihre Domain ein
4. Wählen Sie einen Plan (Free ist ausreichend)
5. Cloudflare zeigt die Nameserver an - notieren Sie diese

### 3.2 Nameserver bei Ihrem Domain-Registrar ändern

1. Loggen Sie sich bei Ihrem Domain-Registrar ein (z.B. Namecheap, GoDaddy, IONOS)
2. Ändern Sie die Nameserver zu den Cloudflare-Nameservern
3. Warten Sie auf die Propagierung (kann bis zu 24h dauern, meist schneller)

### 3.3 DNS-Einträge in Cloudflare konfigurieren

Gehen Sie zu **DNS** > **Records** in Cloudflare:

**A-Record erstellen:**
- **Type:** A
- **Name:** @ (für Hauptdomain) oder www
- **IPv4 address:** IHRE_VPS_IP
- **Proxy status:** ✅ Proxied (Orange Cloud aktiviert)
- **TTL:** Auto

**Optional - CNAME für www:**
- **Type:** CNAME
- **Name:** www
- **Target:** ihre-domain.de
- **Proxy status:** ✅ Proxied
- **TTL:** Auto

### 3.4 SSL/TLS konfigurieren

1. Gehen Sie zu **SSL/TLS** > **Overview**
2. Setzen Sie den Verschlüsselungsmodus auf **"Full"** oder **"Full (strict)"**
3. Gehen Sie zu **SSL/TLS** > **Edge Certificates**
4. Aktivieren Sie:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ Opportunistic Encryption

### 3.5 Sicherheitseinstellungen (empfohlen)

**Firewall Rules:**
1. Gehen Sie zu **Security** > **WAF**
2. Aktivieren Sie die Web Application Firewall

**Page Rules (optional):**
1. Gehen Sie zu **Rules** > **Page Rules**
2. Erstellen Sie eine Regel für `http://*ihre-domain.de/*`:
   - Setting: **Always Use HTTPS**

**Security Level:**
1. Gehen Sie zu **Security** > **Settings**
2. Setzen Sie Security Level auf **Medium** oder **High**

### 3.6 Performance-Optimierung

**Caching:**
1. Gehen Sie zu **Caching** > **Configuration**
2. Setzen Sie Caching Level auf **Standard**
3. Browser Cache TTL: **4 hours** oder länger

**Auto Minify:**
1. Gehen Sie zu **Speed** > **Optimization**
2. Aktivieren Sie Auto Minify für:
   - ✅ JavaScript
   - ✅ CSS
   - ✅ HTML

**Brotli:**
1. Aktivieren Sie Brotli-Komprimierung

## 🔒 Teil 4: Nginx Reverse Proxy (optional, für SSL-Termination auf VPS)

Falls Sie SSL direkt auf dem VPS handhaben möchten (nicht notwendig mit Cloudflare):

### 4.1 Nginx installieren

```bash
apt install nginx certbot python3-certbot-nginx -y
```

### 4.2 Nginx-Konfiguration erstellen

```bash
nano /etc/nginx/sites-available/accounting-tool
```

Fügen Sie folgende Konfiguration ein:

```nginx
server {
    listen 80;
    server_name ihre-domain.de www.ihre-domain.de;

    # Cloudflare IP-Authentifizierung (optional)
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.3 Nginx aktivieren

```bash
# Symlink erstellen
ln -s /etc/nginx/sites-available/accounting-tool /etc/nginx/sites-enabled/

# Standardseite deaktivieren
rm /etc/nginx/sites-enabled/default

# Konfiguration testen
nginx -t

# Nginx neu starten
systemctl restart nginx
systemctl enable nginx
```

## 📊 Teil 5: Monitoring und Wartung

### 5.1 Docker Container überwachen

```bash
# Status aller Container
docker compose ps

# Logs anzeigen
docker compose logs -f web
docker compose logs -f db

# Ressourcennutzung
docker stats
```

### 5.2 Datenbank-Backup erstellen

**Manuelles Backup:**

```bash
# Backup erstellen
docker compose exec db pg_dump -U accounting_user accounting > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup komprimieren
gzip backup_*.sql
```

**Automatisches Backup mit Cron:**

```bash
# Backup-Script erstellen
nano /opt/accounting-tool/backup.sh
```

Fügen Sie folgendes Script ein:

```bash
#!/bin/bash
BACKUP_DIR="/opt/accounting-tool/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Backup-Verzeichnis erstellen
mkdir -p $BACKUP_DIR

# Datenbank-Backup
cd /opt/accounting-tool
docker compose exec -T db pg_dump -U accounting_user accounting | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Alte Backups löschen
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup erstellt: backup_$DATE.sql.gz"
```

```bash
# Script ausführbar machen
chmod +x /opt/accounting-tool/backup.sh

# Cron-Job erstellen (täglich um 2 Uhr nachts)
crontab -e
```

Fügen Sie folgende Zeile hinzu:

```cron
0 2 * * * /opt/accounting-tool/backup.sh >> /var/log/accounting-backup.log 2>&1
```

### 5.3 Datenbank wiederherstellen

```bash
# Aus komprimiertem Backup
gunzip < backup_DATUM.sql.gz | docker compose exec -T db psql -U accounting_user accounting
```

### 5.4 Updates durchführen

```bash
cd /opt/accounting-tool

# Code aktualisieren (falls Git)
git pull

# Container neu bauen und starten
docker compose down
docker compose up -d --build

# Alte Images aufräumen
docker image prune -a
```

## 🔍 Teil 6: Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker compose logs

# Container-Status
docker compose ps

# Einzelnen Container neu starten
docker compose restart web
```

### Datenbank-Verbindungsprobleme

```bash
# In den DB-Container wechseln
docker compose exec db psql -U accounting_user accounting

# Verbindung testen
docker compose exec db pg_isready -U accounting_user
```

### Performance-Probleme

```bash
# Ressourcen überwachen
docker stats

# System-Ressourcen
htop
df -h
free -m
```

### Cloudflare-Probleme

- **Zu viele Redirects:** SSL/TLS-Modus auf "Full" setzen
- **502 Bad Gateway:** Überprüfen Sie, ob der Container läuft
- **DNS funktioniert nicht:** Warten Sie auf DNS-Propagierung (bis zu 24h)

## 🛡️ Teil 7: Sicherheits-Checkliste

- ✅ Starke Passwörter in `.env` verwenden
- ✅ SSH-Key-Authentication aktivieren, Passwort-Login deaktivieren
- ✅ UFW Firewall aktiviert
- ✅ Nur notwendige Ports geöffnet (22, 80, 443)
- ✅ Regelmäßige System-Updates (`apt update && apt upgrade`)
- ✅ Regelmäßige Datenbank-Backups
- ✅ Cloudflare WAF aktiviert
- ✅ SSL/TLS korrekt konfiguriert
- ✅ Docker-Container regelmäßig aktualisieren

## 📝 Teil 8: Nützliche Befehle

```bash
# Alle Container stoppen
docker compose down

# Container neu starten
docker compose restart

# Container mit neuen Images neu bauen
docker compose up -d --build --force-recreate

# Volumes löschen (ACHTUNG: Daten gehen verloren!)
docker compose down -v

# In Container-Shell wechseln
docker compose exec web sh
docker compose exec db bash

# Logs live verfolgen
docker compose logs -f --tail=100

# Disk-Space von Docker aufräumen
docker system prune -a --volumes
```

## 🎯 Zusammenfassung

Sie haben jetzt ein vollständiges Deployment mit:

- ✅ Docker-Container für das Frontend
- ✅ PostgreSQL-Datenbank in separatem Container
- ✅ Redis für Session-Management
- ✅ Nginx als Webserver
- ✅ Cloudflare für SSL, CDN und Sicherheit
- ✅ Automatische Backups
- ✅ Health-Checks und Monitoring

## 📞 Support

Bei Problemen:
1. Prüfen Sie die Logs: `docker compose logs`
2. Überprüfen Sie die Container-Status: `docker compose ps`
3. Testen Sie die Cloudflare-Einstellungen im Dashboard

---

**Hinweis:** Diese Anleitung setzt voraus, dass die Anwendung aktuell nur im Frontend läuft. Wenn Sie später ein Backend-API hinzufügen, müssen Sie die `docker-compose.yml` entsprechend anpassen (der API-Service ist bereits vorbereitet, aber auskommentiert).
