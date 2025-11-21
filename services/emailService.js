import nodemailer from 'nodemailer';

/**
 * E-Mail Service für das Accounting Tool
 * Versendet Erinnerungs-E-Mails über SMTP
 */

/**
 * Sendet eine Erinnerungs-E-Mail an den Nutzer
 * @param {string} userEmail - E-Mail-Adresse des Empfängers
 * @param {string} userName - Name des Nutzers
 * @param {Object} smtpConfig - SMTP-Konfiguration
 * @returns {Promise<Object>} - Ergebnis des E-Mail-Versands
 */
export async function sendReminderEmail(userEmail, userName, smtpConfig) {
    try {
        // SMTP Transporter erstellen
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure, // true für 465, false für andere Ports
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.password,
            },
        });

        // E-Mail-Inhalt
        const mailOptions = {
            from: `"Accounting Tool" <${smtpConfig.user}>`,
            to: userEmail,
            subject: '📊 Erinnerung: Einnahmen und Ausgaben eintragen',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">Hallo ${userName}!</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6;">
                        Dies ist deine wöchentliche Erinnerung, deine <strong>Einnahmen und Ausgaben</strong> 
                        im Accounting Tool einzutragen.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.6;">
                        Eine regelmäßige Buchführung hilft dir, den Überblick über deine Finanzen zu behalten 
                        und deine Steuererklärung vorzubereiten.
                    </p>
                    
                    <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280;">
                            💡 <strong>Tipp:</strong> Nutze die Kamera-Funktion, um Belege direkt zu fotografieren 
                            und mit OCR automatisch auszulesen!
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #9ca3af; margin-top: 40px;">
                        Diese E-Mail wurde automatisch versendet. Du kannst die Benachrichtigungen 
                        in den Einstellungen anpassen oder deaktivieren.
                    </p>
                </div>
            `,
            text: `
Hallo ${userName}!

Dies ist deine wöchentliche Erinnerung, deine Einnahmen und Ausgaben im Accounting Tool einzutragen.

Eine regelmäßige Buchführung hilft dir, den Überblick über deine Finanzen zu behalten und deine Steuererklärung vorzubereiten.

💡 Tipp: Nutze die Kamera-Funktion, um Belege direkt zu fotografieren und mit OCR automatisch auszulesen!

---
Diese E-Mail wurde automatisch versendet. Du kannst die Benachrichtigungen in den Einstellungen anpassen oder deaktivieren.
            `.trim(),
        };

        // E-Mail senden
        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Reminder email sent to ${userEmail}:`, info.messageId);

        return {
            success: true,
            messageId: info.messageId,
            recipient: userEmail,
        };
    } catch (error) {
        console.error('❌ Error sending reminder email:', error);
        throw error;
    }
}

/**
 * Testet die SMTP-Verbindung
 * @param {Object} smtpConfig - SMTP-Konfiguration zum Testen
 * @returns {Promise<boolean>} - true wenn Verbindung erfolgreich
 */
export async function testEmailConnection(smtpConfig) {
    try {
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.password,
            },
        });

        // Verbindung testen
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
        return true;
    } catch (error) {
        console.error('❌ SMTP connection test failed:', error);
        throw error;
    }
}

/**
 * Sendet eine Test-E-Mail
 * @param {string} userEmail - E-Mail-Adresse des Empfängers
 * @param {string} userName - Name des Nutzers
 * @param {Object} smtpConfig - SMTP-Konfiguration
 * @returns {Promise<Object>} - Ergebnis des E-Mail-Versands
 */
export async function sendTestEmail(userEmail, userName, smtpConfig) {
    try {
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.password,
            },
        });

        const mailOptions = {
            from: `"Accounting Tool" <${smtpConfig.user}>`,
            to: userEmail,
            subject: '✅ Test-E-Mail - Accounting Tool',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Test erfolgreich!</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6;">
                        Hallo ${userName},
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.6;">
                        deine SMTP-Konfiguration funktioniert einwandfrei! 
                        Du erhältst zukünftig deine Erinnerungen zum eingetragenen Zeitpunkt.
                    </p>
                    
                    <div style="margin: 30px 0; padding: 20px; background-color: #d1fae5; border-radius: 8px; border-left: 4px solid #10b981;">
                        <p style="margin: 0; font-size: 14px; color: #065f46;">
                            ✅ SMTP-Server: ${smtpConfig.host}:${smtpConfig.port}<br>
                            ✅ Verschlüsselung: ${smtpConfig.secure ? 'SSL/TLS' : 'STARTTLS'}<br>
                            ✅ Benutzer: ${smtpConfig.user}
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #9ca3af;">
                        Diese Test-E-Mail wurde manuell ausgelöst.
                    </p>
                </div>
            `,
            text: `
Test erfolgreich!

Hallo ${userName},

deine SMTP-Konfiguration funktioniert einwandfrei! Du erhältst zukünftig deine Erinnerungen zum eingetragenen Zeitpunkt.

✅ SMTP-Server: ${smtpConfig.host}:${smtpConfig.port}
✅ Verschlüsselung: ${smtpConfig.secure ? 'SSL/TLS' : 'STARTTLS'}
✅ Benutzer: ${smtpConfig.user}

Diese Test-E-Mail wurde manuell ausgelöst.
            `.trim(),
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Test email sent to ${userEmail}:`, info.messageId);

        return {
            success: true,
            messageId: info.messageId,
            recipient: userEmail,
        };
    } catch (error) {
        console.error('❌ Error sending test email:', error);
        throw error;
    }
}
