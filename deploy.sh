#!/bin/bash

# Deployment Script für Accounting Tool
# Dieses Script automatisiert das Deployment auf dem VPS

set -e

echo "🚀 Starting Accounting Tool Deployment..."

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funktion für farbige Ausgabe
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Überprüfe ob .env existiert
if [ ! -f .env ]; then
    log_error ".env Datei nicht gefunden!"
    log_info "Erstelle .env aus .env.example..."
    cp .env.example .env
    log_warn "Bitte bearbeiten Sie die .env Datei mit sicheren Passwörtern!"
    log_warn "Führen Sie dann dieses Script erneut aus."
    exit 1
fi

# Überprüfe ob Docker läuft
if ! docker info > /dev/null 2>&1; then
    log_error "Docker läuft nicht oder ist nicht installiert!"
    exit 1
fi

log_info "Docker ist verfügbar ✓"

# Überprüfe ob docker compose verfügbar ist
if ! docker compose version > /dev/null 2>&1; then
    log_error "Docker Compose ist nicht installiert!"
    exit 1
fi

log_info "Docker Compose ist verfügbar ✓"

# Stoppe alte Container falls vorhanden
if docker compose ps -q | grep -q .; then
    log_info "Stoppe alte Container..."
    docker compose down
fi

# Baue neue Images
log_info "Baue Docker Images..."
docker compose build --no-cache

# Starte Container
log_info "Starte Container..."
docker compose up -d

# Warte auf healthy status
log_info "Warte auf Container-Start..."
sleep 10

# Überprüfe Container-Status
log_info "Überprüfe Container-Status..."
docker compose ps

# Zeige Logs
log_info "Container-Logs (letzte 50 Zeilen):"
docker compose logs --tail=50

# Health Check
log_info "Führe Health-Checks durch..."
if docker compose ps | grep -q "unhealthy"; then
    log_error "Einige Container sind nicht healthy!"
    log_info "Zeige erweiterte Logs:"
    docker compose logs
    exit 1
fi

log_info "✅ Deployment erfolgreich abgeschlossen!"
log_info "Die Anwendung ist nun verfügbar."
log_info ""
log_info "Nützliche Befehle:"
log_info "  docker compose logs -f          # Logs anzeigen"
log_info "  docker compose ps               # Status anzeigen"
log_info "  docker compose restart          # Container neu starten"
log_info "  docker compose down             # Container stoppen"
