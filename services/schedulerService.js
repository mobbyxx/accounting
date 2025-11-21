import cron from 'node-cron';
import { sendReminderEmail } from './emailService.js';

/**
 * Scheduler Service für zeitgesteuerte E-Mail-Benachrichtigungen
 * Verwendet node-cron für die Planung von Jobs
 */

// Map zum Speichern aller aktiven Cron-Jobs (userId -> cronJob)
const activeJobs = new Map();

/**
 * Konvertiert Wochentag (0-6) und Zeit (Stunde, Minute) in Cron-Format
 * @param {number} day - Wochentag (0 = Sonntag, 6 = Samstag)
 * @param {number} hour - Stunde (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {string} - Cron-Expression
 */
function toCronExpression(day, hour, minute) {
    // Cron Format: minute hour day-of-month month day-of-week
    // day-of-week: 0 = Sonntag, 6 = Samstag
    return `${minute} ${hour} * * ${day}`;
}

/**
 * Erstellt einen neuen Cron-Job für einen Nutzer
 * @param {string} userId - User ID
 * @param {string} userEmail - E-Mail-Adresse des Nutzers
 * @param {string} userName - Name des Nutzers
 * @param {Object} settings - Benachrichtigungseinstellungen
 * @param {Object} smtpConfig - SMTP-Konfiguration
 */
export function scheduleUserNotification(userId, userEmail, userName, settings, smtpConfig) {
    // Alten Job entfernen, falls vorhanden
    stopUserNotification(userId);

    // Cron-Expression erstellen
    const cronExpression = toCronExpression(
        settings.notification_day,
        settings.notification_hour,
        settings.notification_minute
    );

    console.log(`📅 Scheduling notification for ${userEmail}: ${cronExpression}`);

    // Neuen Cron-Job erstellen
    const job = cron.schedule(cronExpression, async () => {
        console.log(`⏰ Triggered reminder for ${userEmail}`);
        try {
            await sendReminderEmail(userEmail, userName, smtpConfig);
        } catch (error) {
            console.error(`Failed to send reminder to ${userEmail}:`, error);
        }
    }, {
        scheduled: true,
        timezone: 'Europe/Berlin', // Deutsche Zeitzone
    });

    // Job in der Map speichern
    activeJobs.set(userId, job);

    console.log(`✅ Scheduled notification for user ${userId} (${userEmail})`);
}

/**
 * Stoppt den Cron-Job für einen Nutzer
 * @param {string} userId - User ID
 */
export function stopUserNotification(userId) {
    const job = activeJobs.get(userId);
    if (job) {
        job.stop();
        activeJobs.delete(userId);
        console.log(`🛑 Stopped notification for user ${userId}`);
    }
}

/**
 * Initialisiert alle Benachrichtigungen aus der Datenbank
 * @param {Object} pool - PostgreSQL Connection Pool
 */
export async function initializeScheduler(pool) {
    console.log('🔄 Initializing notification scheduler...');

    try {
        const client = await pool.connect();
        try {
            // Alle aktiven Benachrichtigungen laden
            const result = await client.query(`
                SELECT 
                    us.user_id,
                    us.smtp_host,
                    us.smtp_port,
                    us.smtp_secure,
                    us.smtp_user,
                    us.smtp_password,
                    us.notification_day,
                    us.notification_hour,
                    us.notification_minute,
                    u.email,
                    u.name
                FROM user_settings us
                JOIN users u ON us.user_id = u.id
                WHERE us.notification_enabled = true
                  AND us.smtp_host IS NOT NULL
                  AND us.smtp_user IS NOT NULL
                  AND us.smtp_password IS NOT NULL
            `);

            console.log(`📊 Found ${result.rows.length} active notification(s)`);

            // Für jeden Nutzer einen Cron-Job erstellen
            for (const row of result.rows) {
                const smtpConfig = {
                    host: row.smtp_host,
                    port: row.smtp_port,
                    secure: row.smtp_secure,
                    user: row.smtp_user,
                    password: row.smtp_password, // TODO: Entschlüsseln falls verschlüsselt
                };

                const settings = {
                    notification_day: row.notification_day,
                    notification_hour: row.notification_hour,
                    notification_minute: row.notification_minute,
                };

                scheduleUserNotification(
                    row.user_id,
                    row.email,
                    row.name,
                    settings,
                    smtpConfig
                );
            }

            console.log('✅ Scheduler initialized successfully');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error initializing scheduler:', error);
        throw error;
    }
}

/**
 * Aktualisiert die Benachrichtigung für einen Nutzer
 * @param {Object} pool - PostgreSQL Connection Pool
 * @param {string} userId - User ID
 */
export async function refreshUserNotification(pool, userId) {
    console.log(`🔄 Refreshing notification for user ${userId}`);

    try {
        const client = await pool.connect();
        try {
            // Einstellungen für diesen Nutzer laden
            const result = await client.query(`
                SELECT 
                    us.user_id,
                    us.smtp_host,
                    us.smtp_port,
                    us.smtp_secure,
                    us.smtp_user,
                    us.smtp_password,
                    us.notification_enabled,
                    us.notification_day,
                    us.notification_hour,
                    us.notification_minute,
                    u.email,
                    u.name
                FROM user_settings us
                JOIN users u ON us.user_id = u.id
                WHERE us.user_id = $1
            `, [userId]);

            if (result.rows.length === 0) {
                // Keine Einstellungen gefunden -> Job stoppen
                stopUserNotification(userId);
                return;
            }

            const row = result.rows[0];

            // Wenn Benachrichtigungen deaktiviert oder unvollständige Konfiguration
            if (!row.notification_enabled ||
                !row.smtp_host ||
                !row.smtp_user ||
                !row.smtp_password) {
                stopUserNotification(userId);
                console.log(`⏸️  Notifications disabled for user ${userId}`);
                return;
            }

            // Benachrichtigung neu planen
            const smtpConfig = {
                host: row.smtp_host,
                port: row.smtp_port,
                secure: row.smtp_secure,
                user: row.smtp_user,
                password: row.smtp_password, // TODO: Entschlüsseln falls verschlüsselt
            };

            const settings = {
                notification_day: row.notification_day,
                notification_hour: row.notification_hour,
                notification_minute: row.notification_minute,
            };

            scheduleUserNotification(
                row.user_id,
                row.email,
                row.name,
                settings,
                smtpConfig
            );

            console.log(`✅ Refreshed notification for user ${userId}`);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(`❌ Error refreshing notification for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Gibt die Anzahl der aktiven Jobs zurück
 * @returns {number} - Anzahl der aktiven Jobs
 */
export function getActiveJobCount() {
    return activeJobs.size;
}
