const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { pool } = require("../config/database");
const { verifyToken } = require("../utils/jwt");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const renderGoogleAuthPopupResponse = (type) => `<!DOCTYPE html>
<html>
  <body>
    <script>
      window.opener.postMessage(
        { type: "${type}" },
        window.location.origin
      );
      window.close();
    </script>
  </body>
</html>`;

const resolveTutorFromQueryToken = async (token) => {
  if (!token) {
    throw new Error("Missing auth token.");
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    throw new Error("Invalid or expired token.");
  }

  const [users] = await pool.query(
    `SELECT id, role, is_active
     FROM users
     WHERE id = ?`,
    [decoded.userId]
  );

  if (users.length === 0) {
    throw new Error("User not found.");
  }

  if (!users[0].is_active) {
    throw new Error("User account is inactive.");
  }

  if (users[0].role !== "tutor") {
    throw new Error("Only tutors can connect Google Calendar.");
  }

  return users[0];
};

// STEP 1: login
router.get("/google", async (req, res) => {
  try {
    const tutor = await resolveTutorFromQueryToken(req.query.token);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar"],
      state: tutor.id.toString(),
    });

    res.redirect(url);
  } catch (error) {
    console.error("Google OAuth Start Error:", error);
    res.status(401).send(renderGoogleAuthPopupResponse("GOOGLE_AUTH_ERROR"));
  }
});

// STEP 2: callback
router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const tutorId = req.query.state ? parseInt(req.query.state, 10) : null;

    if (!tutorId || Number.isNaN(tutorId)) {
      throw new Error("Invalid tutor state.");
    }

    const { tokens } = await oauth2Client.getToken(code);

    await pool.query(
      `INSERT INTO tutor_google_tokens (tutor_id, access_token, refresh_token)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       access_token = VALUES(access_token),
       refresh_token = VALUES(refresh_token)`,
      [tutorId, tokens.access_token, tokens.refresh_token]
    );

    console.log("Google OAuth Success:", { tutorId });
    res.send(renderGoogleAuthPopupResponse("GOOGLE_AUTH_SUCCESS"));
  } catch (error) {
    console.error("Google OAuth Error:", error);
    res.status(500).send(renderGoogleAuthPopupResponse("GOOGLE_AUTH_ERROR"));
  }
});

module.exports = router;
