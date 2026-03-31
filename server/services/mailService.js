import nodemailer from "nodemailer";

/** Normalize .env values (whitespace, optional surrounding quotes added by some editors). */
function readEnv(key) {
    const v = process.env[key];
    if (v == null || v === "") return "";
    let s = String(v).trim();
    if (
        (s.startsWith('"') && s.endsWith('"')) ||
        (s.startsWith("'") && s.endsWith("'"))
    ) {
        s = s.slice(1, -1).trim();
    }
    return s;
}

const DEFAULT_PLAYGROUND_REDIRECT = "https://developers.google.com/oauthplayground";
const REQUIRED_SCOPE = "https://mail.google.com/";

/**
 * Exchange refresh token → access token via Google's token endpoint.
 * Tries with redirect_uri first (needed for Playground-issued tokens), then without.
 */
async function fetchAccessToken(clientId, clientSecret, refreshToken, redirectUri) {
    const url = "https://oauth2.googleapis.com/token";
    const attempts = [
        { withRedirect: true, label: `with redirect_uri` },
        { withRedirect: false, label: "without redirect_uri" },
    ];

    let lastErr = null;
    for (const { withRedirect, label } of attempts) {
        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        });
        if (withRedirect && redirectUri) {
            params.set("redirect_uri", redirectUri);
        }

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.access_token) {
            console.log(`Gmail OAuth: access token obtained (${label}), scope: ${data.scope || "unknown"}`);
            if (data.scope && !data.scope.includes("mail.google.com")) {
                console.warn(
                    `Gmail OAuth WARNING: token scope is "${data.scope}" but SMTP requires "${REQUIRED_SCOPE}". ` +
                        "Re-authorize in OAuth Playground with scope: " + REQUIRED_SCOPE
                );
            }
            return data.access_token;
        }

        lastErr = data;
        console.warn(`Gmail OAuth token refresh (${label}): ${data.error || "error"} ${data.error_description || ""}`.trim());
    }

    throw new Error(lastErr?.error_description || lastErr?.error || "token_exchange_failed");
}

export function isMailConfigured() {
    const user = readEnv("GMAIL_USER") || readEnv("GMAIL_FROM");
    return Boolean(
        user &&
            readEnv("GMAIL_CLIENT_ID") &&
            readEnv("GMAIL_CLIENT_SECRET") &&
            readEnv("GMAIL_REFRESH_TOKEN")
    );
}

/** Gmail OAuth2: all four env vars must be present. */
export function isPasswordResetMailConfigured() {
    const user = readEnv("GMAIL_USER") || readEnv("GMAIL_FROM");
    return Boolean(
        user &&
            readEnv("GMAIL_CLIENT_ID") &&
            readEnv("GMAIL_CLIENT_SECRET") &&
            readEnv("GMAIL_REFRESH_TOKEN")
    );
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
    const oauthUser = readEnv("GMAIL_USER") || readEnv("GMAIL_FROM");
    if (!isPasswordResetMailConfigured()) {
        console.warn(
            "Password reset email skipped: set GMAIL_FROM (or GMAIL_USER), GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN."
        );
        return { sent: false, reason: "not_configured" };
    }

    const clientId = readEnv("GMAIL_CLIENT_ID");
    const clientSecret = readEnv("GMAIL_CLIENT_SECRET");
    const refreshToken = readEnv("GMAIL_REFRESH_TOKEN");
    const redirectUri = readEnv("GMAIL_OAUTH_REDIRECT_URI") || DEFAULT_PLAYGROUND_REDIRECT;

    let accessToken;
    try {
        accessToken = await fetchAccessToken(clientId, clientSecret, refreshToken, redirectUri);
    } catch (err) {
        console.error("Gmail OAuth token exchange failed:", err.message);
        throw err;
    }

    const fromName = readEnv("GMAIL_FROM_NAME") || "Cupang National High School";
    const fromAddress = readEnv("GMAIL_FROM") || oauthUser;

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            type: "OAuth2",
            user: oauthUser,
            clientId,
            clientSecret,
            refreshToken,
            accessToken,
        },
    });

    try {
        await transporter.sendMail({
            from: `"${fromName}" <${fromAddress}>`,
            to,
            subject: "Reset your Cupang NHS account password",
            text: `You requested a password reset. Open this link to set a new password (it expires soon):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
            html: `
        <p>You requested a password reset for your Cupang NHS account.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Set a new password</a></p>
        <p>If the button does not work, copy and paste this URL into your browser:</p>
        <p style="word-break:break-all;">${resetUrl}</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
        });
    } catch (smtpErr) {
        const m = smtpErr?.message || "";
        if (m.includes("535") || m.includes("Username and Password not accepted")) {
            console.error(
                "\n=== Gmail SMTP 535 — OAuth2 token rejected ===\n" +
                    "The access token was obtained but Gmail SMTP rejected it.\n" +
                    "This almost always means the refresh token was created with the WRONG SCOPE.\n\n" +
                    "Required scope for SMTP: " + REQUIRED_SCOPE + "\n" +
                    "(gmail.send only works with the REST API, NOT with SMTP/Nodemailer)\n\n" +
                    "Fix:\n" +
                    "1. Go to https://developers.google.com/oauthplayground\n" +
                    "2. Gear icon → enable 'Use your own OAuth credentials'\n" +
                    "3. Enter your Client ID and Client Secret from .env\n" +
                    "4. In Step 1, find 'Gmail API v1' → select '" + REQUIRED_SCOPE + "'\n" +
                    "   (NOT gmail.send, NOT gmail.readonly — must be the full mail.google.com scope)\n" +
                    "5. Click 'Authorize APIs' → sign in with " + oauthUser + "\n" +
                    "6. Click 'Exchange authorization code for tokens'\n" +
                    "7. Copy the new Refresh Token into GMAIL_REFRESH_TOKEN in .env\n" +
                    "8. Restart the server and try again\n" +
                    "=================================================\n"
            );
        }
        throw smtpErr;
    }

    console.log("Password reset email sent to", to);
    return { sent: true };
}

export async function sendParentConcernNotificationEmail({
    to,
    parentName,
    studentName,
    concernTitle,
    concernCategory,
    counselorName,
}) {
    if (!isMailConfigured()) {
        console.warn("Parent notification email skipped: Gmail OAuth not configured.");
        return { sent: false, reason: "not_configured" };
    }

    const oauthUser = readEnv("GMAIL_USER") || readEnv("GMAIL_FROM");
    const clientId = readEnv("GMAIL_CLIENT_ID");
    const clientSecret = readEnv("GMAIL_CLIENT_SECRET");
    const refreshToken = readEnv("GMAIL_REFRESH_TOKEN");
    const redirectUri = readEnv("GMAIL_OAUTH_REDIRECT_URI") || DEFAULT_PLAYGROUND_REDIRECT;

    const accessToken = await fetchAccessToken(clientId, clientSecret, refreshToken, redirectUri);

    const fromName = readEnv("GMAIL_FROM_NAME") || "Cupang National High School";
    const fromAddress = readEnv("GMAIL_FROM") || oauthUser;

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            type: "OAuth2",
            user: oauthUser,
            clientId,
            clientSecret,
            refreshToken,
            accessToken,
        },
    });

    const categoryLabel = concernCategory
        ? concernCategory.charAt(0).toUpperCase() + concernCategory.slice(1)
        : "General";

    await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject: `Guidance Office Notice — Concern Filed for ${studentName}`,
        text:
            `Dear ${parentName},\n\n` +
            `This is to inform you that the Guidance Office of Cupang National High School is currently ` +
            `addressing a concern involving your child, ${studentName}.\n\n` +
            `Concern: ${concernTitle}\nCategory: ${categoryLabel}\n\n` +
            `The guidance counselor handling this matter is ${counselorName}. ` +
            `You may visit or contact the school guidance office for more details.\n\n` +
            `Thank you for your continued support.\n\n` +
            `Respectfully,\nCupang National High School Guidance Office`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                <div style="background:#16a34a;padding:24px;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:20px">Cupang National High School</h1>
                    <p style="color:#d1fae5;margin:4px 0 0;font-size:13px">Guidance Office</p>
                </div>
                <div style="padding:24px">
                    <p>Dear <strong>${parentName}</strong>,</p>
                    <p>This is to inform you that the Guidance Office is currently addressing a concern involving your child, <strong>${studentName}</strong>.</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0">
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Concern</td><td style="padding:8px;border:1px solid #e5e7eb">${concernTitle}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Category</td><td style="padding:8px;border:1px solid #e5e7eb">${categoryLabel}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb">Counselor</td><td style="padding:8px;border:1px solid #e5e7eb">${counselorName}</td></tr>
                    </table>
                    <p>You may visit or contact the school guidance office for more details.</p>
                    <p style="margin-top:24px">Thank you for your continued support.</p>
                    <p style="margin-top:16px;color:#6b7280;font-size:13px">Respectfully,<br><strong>Cupang National High School Guidance Office</strong></p>
                </div>
                <div style="background:#f9fafb;padding:12px;text-align:center;font-size:11px;color:#9ca3af">
                    This is an automated message. Please do not reply to this email.
                </div>
            </div>
        `,
    });

    console.log("Parent notification email sent to", to);
    return { sent: true };
}
