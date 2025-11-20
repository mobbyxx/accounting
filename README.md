# 💼 Accounting Tool

Ein modernes, webbasiertes Buchhaltungstool mit EÜR (Einnahmenüberschussrechnung) für Selbstständige und Kleinunternehmer nach deutschem Recht.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19.2.0-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6?logo=typescript)

## ✨ Features

### 📊 Kernfunktionalitäten
- **Transaktionsverwaltung** - Erfassung und Verwaltung von Einnahmen und Ausgaben
- **EÜR-Bericht** - Automatische Erstellung der Einnahmenüberschussrechnung
- **Mehrwertsteuer** - Unterstützung für 0%, 7% und 19% USt
- **Einkommensteuer** - Geschätzte Berechnung nach § 32a EStG 2025
- **Belege** - Upload und OCR-Erkennung von Quittungsbildern

### 🚀 Erweiterte Features
- **OCR-Integration** - Automatische Extraktion von Datum und Betrag aus Belegen (Tesseract.js)
- **Kamera-Support** - Direkte Aufnahme von Belegen über die Webkamera
- **Export-Funktionen** - Export als CSV, Excel (XLSX) und PDF
- **DATEV/ELSTER-kompatibel** - Buchungskategorien für deutsche Steuersoftware
- **Übersichtliches Dashboard** - Visualisierung von Einnahmen, Ausgaben und Trends
- **Mobile-optimiert** - Responsive Design für Smartphone und Tablet

### 🔒 Sicherheit
- **Cloudflare Access** - Integration mit Google OAuth über Cloudflare
- **JWT-Authentifizierung** - Sichere Session-Verwaltung
- **PIN-Schutz** - Zusätzlicher lokaler Schutz (optional)
- **Environment-basierte Konfiguration** - Sichere Verwaltung von Zugangsdaten

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - Moderne UI-Library
- **TypeScript** - Typsichere Entwicklung
- **Vite** - Schneller Build-Prozess
- **Recharts** - Datenvisualisierung
- **Lucide Icons** - Moderne Icon-Library
- **date-fns** - Datums-Verwaltung

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Server
- **PostgreSQL** - Relationale Datenbank
- **Redis** - Session-Management (optional)

### DevOps
- **Docker** - Containerisierung
- **Docker Compose** - Multi-Container-Orchestrierung
- **Nginx** - Reverse Proxy
- **Cloudflare Tunnel** - Sichere Externalisierung

## 📦 Installation

### Voraussetzungen
- Node.js 18+ 
- PostgreSQL 16+
- Docker & Docker Compose (für Deployment)

### Lokale Entwicklung

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd accounting-tool
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env
   ```
   
   Bearbeite `.env` und setze die erforderlichen Werte:
   ```env
   POSTGRES_DB=accounting
   POSTGRES_USER=accounting_user
   POSTGRES_PASSWORD=your_secure_password
   REDIS_PASSWORD=your_redis_password
   CF_TEAM_DOMAIN=your-team.cloudflareaccess.com
   CF_AUD=your_aud_value
   ```

4. **Datenbank initialisieren**
   
   Führe `init-db.sql` in deiner PostgreSQL-Instanz aus:
   ```bash
   psql -U accounting_user -d accounting < init-db.sql
   ```

5. **Anwendung starten**
   
   Terminal 1 - Frontend:
   ```bash
   npm run dev
   ```
   
   Terminal 2 - Backend:
   ```bash
   npm run server:dev
   ```

6. **Öffnen**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 🐳 Docker Deployment

Detaillierte Anweisungen findest du in [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Start

1. **Build und Start**
   ```bash
   docker-compose up -d
   ```

2. **Logs überwachen**
   ```bash
   docker-compose logs -f
   ```

3. **Stoppen**
   ```bash
   docker-compose down
   ```

## 🔧 Verfügbare Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet Vite Dev-Server (Frontend) |
| `npm run build` | Erstellt Production Build |
| `npm run preview` | Vorschau des Production Builds |
| `npm run server` | Startet Express Backend (Production) |
| `npm run server:dev` | Startet Express Backend (Development) |
| `npm run lint` | Führt ESLint aus |

## 📁 Projektstruktur

```
accounting-tool/
├── src/
│   ├── components/       # Wiederverwendbare React-Komponenten
│   ├── pages/           # Seiten-Komponenten (Dashboard, Transactions, etc.)
│   ├── services/        # API-Services
│   ├── context/         # React Context (Auth, etc.)
│   ├── hooks/           # Custom React Hooks
│   ├── constants/       # Konstanten und Konfigurationen
│   └── assets/          # Statische Assets
├── public/              # Öffentliche Dateien
├── server.js            # Express Backend
├── init-db.sql          # Datenbank-Schema
├── docker-compose.yml   # Docker Orchestrierung
├── Dockerfile           # Container Definition
├── nginx.conf           # Nginx Konfiguration
└── package.json         # Dependencies und Scripts
```

## 🔐 Cloudflare Access Setup

Detaillierte Anweisungen findest du in [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md).

Die Anwendung kann mit Cloudflare Access geschützt werden:
- Google OAuth Integration
- JWT-basierte Authentifizierung
- Automatisches Bypassing im lokalen Development

## 📊 Datenbankmigrationen

Migrations findest du im `migrations/`-Verzeichnis. Weitere Informationen in [MIGRATION_README.md](./MIGRATION_README.md).

## 🧪 Testing

```bash
# Linting
npm run lint

# Type-Checking
npm run build
```

## 📱 Mobile Support

Die Anwendung ist vollständig responsive und optimiert für:
- 📱 Smartphones (< 640px)
- 📱 Tablets (640px - 1024px)
- 💻 Desktop (> 1024px)

Besondere Features für Mobile:
- Card-basierte Layouts statt Tabellen
- Touch-optimierte Buttons
- Responsive Charts
- Kamera-Support für Belege

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🐛 Bekannte Issues

- OCR-Genauigkeit hängt von der Qualität der Belege ab
- Tesseract.js kann bei großen Bildern langsam sein
- Browser-Kamera-API erfordert HTTPS (außer localhost)

## 💡 Geplante Features

- [ ] Automatische Backups
- [ ] Mehrere Konten/Mandanten
- [ ] Erweiterte Reporting-Optionen
- [ ] API-Dokumentation (Swagger/OpenAPI)
- [ ] Import von Banktransaktionen (CSV/MT940)
- [ ] Rechnungserstellung

## 📞 Support

Bei Fragen oder Problemen öffne bitte ein Issue im GitHub Repository.

## 🙏 Danksagungen

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

---

**Hinweis:** Dieses Tool dient zur Vereinfachung der Buchhaltung, ersetzt aber keine professionelle Steuerberatung. Für steuerrechtliche Fragen konsultiere bitte einen Steuerberater.
