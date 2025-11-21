import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import pkg from 'pg';
const { Pool } = pkg;

// Import services
import { sendTestEmail } from './services/emailService.js';
import { initializeScheduler, refreshUserNotification } from './services/schedulerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Default to development if not set
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

// PostgreSQL Connection Pool
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'accounting',
    user: process.env.POSTGRES_USER || 'accounting_user',
    password: process.env.POSTGRES_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client', err);
});

// Set search path for all queries
pool.on('connect', async (client) => {
    try {
        await client.query('SET search_path TO accounting, public');
    } catch (err) {
        console.error('Error setting search_path:', err);
    }
});

// Verbesserte Migration mit SQL-Files aus migrations/
const runMigrations = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Running database migrations...');

        // Erstelle migrations Tracking-Tabelle
        await client.query(`
            CREATE TABLE IF NOT EXISTS accounting.migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Lese alle SQL-Dateien aus migrations/
        const migrationsDir = path.join(__dirname, 'migrations');
        let migrationFiles = [];

        try {
            const files = await fs.readdir(migrationsDir);
            migrationFiles = files
                .filter(f => f.endsWith('.sql'))
                .sort(); // Alphabetisch sortieren (001, 002, ...)
        } catch (err) {
            console.log('⚠️  No migrations directory found, skipping file-based migrations');
        }

        // Führe jede Migration aus (falls noch nicht ausgeführt)
        for (const filename of migrationFiles) {
            // Prüfen ob bereits ausgeführt
            const check = await client.query(
                'SELECT 1 FROM accounting.migrations WHERE filename = $1',
                [filename]
            );

            if (check.rows.length > 0) {
                console.log(`⏭️  Skipping ${filename} (already executed)`);
                continue;
            }

            console.log(`🔄 Running migration: ${filename}`);

            // SQL-Datei lesen und ausführen
            const sqlPath = path.join(migrationsDir, filename);
            const sql = await fs.readFile(sqlPath, 'utf-8');

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO accounting.migrations (filename) VALUES ($1)',
                    [filename]
                );
                await client.query('COMMIT');
                console.log(`✅ Migration ${filename} completed`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`❌ Migration ${filename} failed:`, err);
                throw err;
            }
        }

        console.log('✅ All database migrations completed');
    } catch (err) {
        console.error('❌ Migration error:', err);
        // Don't crash the server, just log the error
    } finally {
        client.release();
    }
};

// Cloudflare Team Domain (wird über ENV gesetzt)
const CF_TEAM_DOMAIN = process.env.CF_TEAM_DOMAIN || 'your-team.cloudflareaccess.com';
const CF_AUD = process.env.CF_AUD || ''; // Application Audience Tag

// CORS für Development
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Erhöht für Belegbilder

// Cloudflare JWT Verification Middleware
const verifyCloudflareJWT = async (req, res, next) => {
    // Development Bypass
    if (process.env.NODE_ENV === 'development') {
        req.user = {
            email: 'dev@local.test',
            name: 'Dev User',
            sub: 'dev-user-123',
        };
        return next();
    }

    try {
        const token = req.headers['cf-access-jwt-assertion'];

        if (!token) {
            return res.status(401).json({
                error: 'No Cloudflare Access token found',
                message: 'Diese Anwendung muss über Cloudflare Access aufgerufen werden.'
            });
        }

        // Decode JWT without verification für Development
        // In Production sollte die Signatur gegen Cloudflare Public Keys validiert werden
        const decoded = jwt.decode(token);

        if (!decoded) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Ungültiges Authentifizierungs-Token.'
            });
        }

        // Optional: Audience validieren
        if (CF_AUD && decoded.aud && !decoded.aud.includes(CF_AUD)) {
            return res.status(401).json({
                error: 'Invalid audience',
                message: 'Token für falsche Anwendung.'
            });
        }

        // User-Informationen aus Token extrahieren
        req.user = {
            email: decoded.email || '',
            name: decoded.name || decoded.email || 'Benutzer',
            sub: decoded.sub || '',
        };

        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);
        return res.status(401).json({
            error: 'Token verification failed',
            message: 'Authentifizierung fehlgeschlagen.'
        });
    }
};

// Hilfsfunktion: User in DB erstellen/aktualisieren
const ensureUser = async (client, userInfo) => {
    const { sub, email, name } = userInfo;

    const result = await client.query(
        `INSERT INTO users (cloudflare_sub, email, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (cloudflare_sub) 
         DO UPDATE SET email = $2, name = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [sub, email, name]
    );

    return result.rows[0].id;
};

// API-Endpunkt für User-Informationen
app.get('/api/user', verifyCloudflareJWT, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const userId = await ensureUser(client, req.user);
            res.json({
                email: req.user.email,
                name: req.user.name,
                sub: req.user.sub,
                id: userId
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in /api/user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/transactions - Alle Transaktionen des Users laden
app.get('/api/transactions', verifyCloudflareJWT, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const userId = await ensureUser(client, req.user);

            const result = await client.query(
                `SELECT id, date, description, amount, type, category, vat_rate, receipt_url, created_at
                 FROM transactions
                 WHERE user_id = $1
                 ORDER BY date DESC, created_at DESC`,
                [userId]
            );

            // Format für Frontend
            const transactions = result.rows.map(row => ({
                id: row.id,
                date: row.date.toISOString().split('T')[0],
                description: row.description,
                amount: parseFloat(row.amount),
                type: row.type,
                category: row.category,
                vatRate: parseFloat(row.vat_rate),
                attachmentUrl: row.receipt_url,
            }));

            res.json(transactions);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in GET /api/transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/transactions - Neue Transaktion erstellen
app.post('/api/transactions', verifyCloudflareJWT, async (req, res) => {
    try {
        const { date, description, amount, type, category, vatRate, attachmentUrl } = req.body;

        // Validierung
        if (!date || !description || !amount || !type || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'Invalid type' });
        }

        const client = await pool.connect();
        try {
            const userId = await ensureUser(client, req.user);

            // VAT-Betrag berechnen
            const vatAmount = (amount * (vatRate || 0)) / 100;

            const result = await client.query(
                `INSERT INTO transactions (user_id, date, description, amount, type, category, vat_rate, vat_amount, receipt_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id, date, description, amount, type, category, vat_rate, receipt_url, created_at`,
                [userId, date, description, amount, type, category, vatRate || 0, vatAmount, attachmentUrl || null]
            );

            const row = result.rows[0];
            const transaction = {
                id: row.id,
                date: row.date.toISOString().split('T')[0],
                description: row.description,
                amount: parseFloat(row.amount),
                type: row.type,
                category: row.category,
                vatRate: parseFloat(row.vat_rate),
                attachmentUrl: row.receipt_url,
            };

            res.status(201).json(transaction);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in POST /api/transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/transactions/:id - Transaktion löschen (nur eigene)
app.delete('/api/transactions/:id', verifyCloudflareJWT, async (req, res) => {
    try {
        const { id } = req.params;

        const client = await pool.connect();
        try {
            const userId = await ensureUser(client, req.user);

            // Nur eigene Transaktionen löschen
            const result = await client.query(
                `DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id`,
                [id, userId]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Transaction not found or unauthorized' });
            }

            res.json({ success: true, id });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in DELETE /api/transactions/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/sync - localStorage-Daten in DB übertragen
app.post('/api/sync', verifyCloudflareJWT, async (req, res) => {
    try {
        const { transactions } = req.body;

        if (!Array.isArray(transactions)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const userId = await ensureUser(client, req.user);

            let imported = 0;
            let skipped = 0;

            for (const t of transactions) {
                try {
                    // Prüfen, ob ID bereits existiert (Duplikate vermeiden)
                    const exists = await client.query(
                        'SELECT id FROM transactions WHERE id = $1',
                        [t.id]
                    );

                    if (exists.rowCount > 0) {
                        skipped++;
                        continue;
                    }

                    const vatAmount = (t.amount * (t.vatRate || 0)) / 100;

                    await client.query(
                        `INSERT INTO transactions (id, user_id, date, description, amount, type, category, vat_rate, vat_amount, receipt_url)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [t.id, userId, t.date, t.description, t.amount, t.type, t.category, t.vatRate || 0, vatAmount, t.attachmentUrl || null]
                    );

                    imported++;
                } catch (err) {
                    console.error('Error importing transaction:', t.id, err);
                    skipped++;
                }
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                imported,
                skipped,
                message: `${imported} Transaktionen importiert, ${skipped} übersprungen.`
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in POST /api/sync:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== E-Mail Settings API ====================

// GET /api/settings - Lade E-Mail-Einstellungen des Users
app.get('/api/settings', verifyCloudflareJWT, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const userId = await ensureUser(client, req.user);

            const result = await client.query(
                `SELECT 
                    smtp_host, 
                    smtp_port, 
                    smtp_secure, 
                    smtp_user,
                    notification_enabled,
                    notification_day,
                    notification_hour,
                    notification_minute
                 FROM user_settings
                 WHERE user_id = $1`,
                [userId]
            );

            // Wenn keine Einstellungen vorhanden, Standardwerte zurückgeben
            if (result.rows.length === 0) {
                return res.json({
                    smtp_host: '',
                    smtp_port: 587,
                    smtp_secure: false,
                    smtp_user: '',
                    notification_enabled: false,
                    notification_day: 0, // Sonntag
                    notification_hour: 12,
                    notification_minute: 0,
                });
            }

            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in GET /api/settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/settings - Speichere/Aktualisiere E-Mail-Einstellungen
app.put('/api/settings', verifyCloudflareJWT, async (req, res) => {
    try {
        const {
            smtp_host,
            smtp_port,
            smtp_secure,
            smtp_user,
            smtp_password,
            notification_enabled,
            notification_day,
            notification_hour,
            notification_minute,
        } = req.body;

        // Validierung
        if (notification_enabled) {
            if (!smtp_host || !smtp_user || !smtp_password) {
                return res.status(400).json({
                    error: 'SMTP configuration required when notifications are enabled'
                });
            }
        }

        const client = await pool.connect();
        try {
            const userId = await ensureUser(client, req.user);

            // Upsert: Update if exists, insert if not
            await client.query(
                `INSERT INTO user_settings (
                    user_id, 
                    smtp_host, 
                    smtp_port, 
                    smtp_secure, 
                    smtp_user, 
                    smtp_password,
                    notification_enabled,
                    notification_day,
                    notification_hour,
                    notification_minute
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    smtp_host = $2,
                    smtp_port = $3,
                    smtp_secure = $4,
                    smtp_user = $5,
                    smtp_password = CASE WHEN $6 != '' THEN $6 ELSE user_settings.smtp_password END,
                    notification_enabled = $7,
                    notification_day = $8,
                    notification_hour = $9,
                    notification_minute = $10,
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    userId,
                    smtp_host,
                    smtp_port,
                    smtp_secure,
                    smtp_user,
                    smtp_password || '', // Leeres Passwort = nicht ändern
                    notification_enabled,
                    notification_day,
                    notification_hour,
                    notification_minute,
                ]
            );

            // Scheduler aktualisieren
            await refreshUserNotification(pool, userId);

            res.json({
                success: true,
                message: 'Einstellungen gespeichert'
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in PUT /api/settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/settings/test-email - Sende Test-E-Mail
app.post('/api/settings/test-email', verifyCloudflareJWT, async (req, res) => {
    try {
        const {
            smtp_host,
            smtp_port,
            smtp_secure,
            smtp_user,
            smtp_password,
        } = req.body;

        // Validierung
        if (!smtp_host || !smtp_user || !smtp_password) {
            return res.status(400).json({
                error: 'SMTP configuration incomplete'
            });
        }

        const smtpConfig = {
            host: smtp_host,
            port: smtp_port,
            secure: smtp_secure,
            user: smtp_user,
            password: smtp_password,
        };

        // Test-E-Mail senden
        await sendTestEmail(req.user.email, req.user.name, smtpConfig);

        res.json({
            success: true,
            message: 'Test-E-Mail wurde versendet!'
        });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({
            error: 'Failed to send test email',
            message: error.message
        });
    }
});


// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));

    // All other GET requests not handled before will return the React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

// Server starten mit Migration
const startServer = async () => {
    try {
        // Warte bis Datenbank bereit ist
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Führe Migrationen aus
        await runMigrations();

        // Initialisiere E-Mail Scheduler
        await initializeScheduler(pool);

        // Starte Express Server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Mode: ${process.env.NODE_ENV || 'development'}`);
            if (CF_TEAM_DOMAIN) {
                console.log(`🔐 Cloudflare Team Domain: ${CF_TEAM_DOMAIN}`);
            }
            console.log(`🗄️  Database: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'accounting'}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await pool.end();
    process.exit(0);
});
