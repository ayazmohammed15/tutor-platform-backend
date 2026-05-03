const { google } = require("googleapis");
const { pool } = require("../config/database");

const createMeetLink = async (tutor_id, session) => {
    const [rows] = await pool.query(
        "SELECT access_token, refresh_token FROM tutor_google_tokens WHERE tutor_id = ?",
        [tutor_id]
    );

    if (!rows || rows.length === 0) {
        throw new Error(`Tutor ${tutor_id} has not connected Google Calendar.`);
    }

    const token = rows[0];

    if (!token || !token.access_token) {
        throw new Error("Invalid Google tokens found for tutor.");
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
    });

    oauth2Client.on("tokens", async (tokens) => {
        console.log("UPDATED TOKENS:", tokens);

        await pool.query(
            `UPDATE tutor_google_tokens 
         SET access_token = ?, refresh_token = COALESCE(?, refresh_token)
         WHERE tutor_id = ?`,
            [
                tokens.access_token,
                tokens.refresh_token || null,
                tutor_id
            ]
        );
    });

    const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
    });

    console.log("SESSION DETAILS:", session);
    console.log("DATE:", session.scheduled_date);
    console.log("TIME:", session.scheduled_time);

    const date = new Date(session.scheduled_date);
    const datePart = date.toISOString().split("T")[0];
    const startTime = new Date(`${datePart}T${session.scheduled_time}`);

    if (isNaN(startTime)) {
        throw new Error("Invalid date/time from session");
    }

    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const event = {
        summary: "Tutoring Session",
        start: {
            dateTime: startTime.toISOString(),
            timeZone: "Asia/Kolkata",
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: "Asia/Kolkata",
        },
        attendees: [
    { email: session.student_email },
    { email: session.tutor_email } // optional but good
  ],
        conferenceData: {
            createRequest: {
                requestId: "meet-" + Date.now(),
                conferenceSolutionKey: { type: "hangoutsMeet" },
            },
        },
    };

    const response = await calendar.events.insert({
        calendarId: "primary",
        resource: event,
        conferenceDataVersion: 1,
    });

    return response.data.hangoutLink;
};

module.exports = { createMeetLink };