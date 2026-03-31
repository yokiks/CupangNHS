/**
 * Diagnostic script: tests each step of Gmail OAuth2 independently.
 * Run: node scripts/test-gmail.mjs
 */
import "dotenv/config";

function readEnv(key) {
    const v = process.env[key];
    if (v == null || v === "") return "";
    let s = String(v).trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1).trim();
    }
    return s;
}

const clientId = readEnv("GMAIL_CLIENT_ID");
const clientSecret = readEnv("GMAIL_CLIENT_SECRET");
const refreshToken = readEnv("GMAIL_REFRESH_TOKEN");
const user = readEnv("GMAIL_USER") || readEnv("GMAIL_FROM");
const redirectUri = readEnv("GMAIL_OAUTH_REDIRECT_URI") || "https://developers.google.com/oauthplayground";

console.log("=== Gmail OAuth2 Diagnostic ===\n");
console.log("GMAIL_FROM / GMAIL_USER:", user || "(MISSING)");
console.log("GMAIL_CLIENT_ID:", clientId ? clientId.slice(0, 20) + "..." : "(MISSING)");
console.log("GMAIL_CLIENT_SECRET:", clientSecret ? clientSecret.slice(0, 8) + "..." : "(MISSING)");
console.log("GMAIL_REFRESH_TOKEN:", refreshToken ? refreshToken.slice(0, 15) + "..." : "(MISSING)");
console.log("redirect_uri:", redirectUri);
console.log("");

if (!user || !clientId || !clientSecret || !refreshToken) {
    console.error("FAIL: Missing env vars. Fill all four in server/.env");
    process.exit(1);
}

// Step 1: Exchange refresh token for access token
console.log("Step 1: Exchanging refresh token for access token...");
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
    }).toString(),
});
const tokenData = await tokenRes.json().catch(() => ({}));

if (!tokenRes.ok || !tokenData.access_token) {
    console.error("FAIL: Token exchange returned", tokenRes.status);
    console.error("  error:", tokenData.error);
    console.error("  description:", tokenData.error_description);
    if (tokenData.error === "invalid_grant") {
        console.error("\n  → Refresh token is invalid/expired/revoked. Generate a NEW one in OAuth Playground.");
    }
    if (tokenData.error === "unauthorized_client") {
        console.error("\n  → Refresh token was not created with this Client ID/Secret.");
    }
    process.exit(1);
}

console.log("OK: Got access token");
console.log("  token_type:", tokenData.token_type);
console.log("  expires_in:", tokenData.expires_in, "seconds");
console.log("  scope:", tokenData.scope || "(not reported)");

if (tokenData.scope && !tokenData.scope.includes("mail.google.com")) {
    console.error("\nFAIL: Scope is '" + tokenData.scope + "'");
    console.error("  SMTP requires scope: https://mail.google.com/");
    console.error("  Re-authorize in OAuth Playground with 'Gmail API v1 → https://mail.google.com/'");
    process.exit(1);
}
console.log("");

// Step 2: Test SMTP connection with OAuth2
console.log("Step 2: Connecting to Gmail SMTP with OAuth2 token...");
const nodemailer = (await import("nodemailer")).default;

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        type: "OAuth2",
        user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken: tokenData.access_token,
    },
});

try {
    await transporter.verify();
    console.log("OK: SMTP connection verified\n");
} catch (err) {
    console.error("FAIL: SMTP verify error:", err.message);
    if (err.message.includes("535")) {
        console.error("\n  → Gmail rejected the OAuth2 token over SMTP.");
        console.error("  Most likely cause: wrong scope on the refresh token.");
        console.error("  Required scope: https://mail.google.com/");
        console.error("  (gmail.send only works with Gmail REST API, NOT SMTP)");
    }
    process.exit(1);
}

// Step 3: Send test email
console.log("Step 3: Sending test email to", user, "...");
try {
    await transporter.sendMail({
        from: `"CupangNHS Test" <${user}>`,
        to: user,
        subject: "Cupang NHS — Gmail OAuth test",
        text: "If you see this, Gmail OAuth2 SMTP is working correctly.",
    });
    console.log("OK: Test email sent! Check inbox of", user);
} catch (err) {
    console.error("FAIL: sendMail error:", err.message);
    process.exit(1);
}

console.log("\n=== All steps passed ===");
