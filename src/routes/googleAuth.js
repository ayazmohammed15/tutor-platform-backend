const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { pool } = require("../config/database");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// STEP 1: login
router.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
  res.redirect(url);
});

// STEP 2: callback
router.get("/google/callback", async (req, res) => {
  const code = req.query.code;

  const { tokens } = await oauth2Client.getToken(code);

  // ⚠️ for testing we use tutor_id = 56 (change later)
  await pool.query(
    "INSERT INTO tutor_google_tokens (tutor_id, access_token, refresh_token) VALUES (?, ?, ?)",
    [56, tokens.access_token, tokens.refresh_token]
  );

  res.send("Google Connected ✅");
});

module.exports = router;