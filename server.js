import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudflare Team Domain (wird über ENV gesetzt)
const CF_TEAM_DOMAIN = process.env.CF_TEAM_DOMAIN || 'your-team.cloudflareaccess.com';
const CF_AUD = process.env.CF_AUD || ''; // Application Audience Tag

// CORS für Development
app.use(cors());
app.use(express.json());

// Cloudflare JWT Verification Middleware
const verifyCloudflareJWT = async (req, res, next) => {
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

// API-Endpunkt für User-Informationen
app.get('/api/user', verifyCloudflareJWT, (req, res) => {
    res.json({
        email: req.user.email,
        name: req.user.name,
        sub: req.user.sub,
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));

    // All other GET requests not handled before will return the React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Mode: ${process.env.NODE_ENV || 'development'}`);
    if (CF_TEAM_DOMAIN) {
        console.log(`🔐 Cloudflare Team Domain: ${CF_TEAM_DOMAIN}`);
    }
});
