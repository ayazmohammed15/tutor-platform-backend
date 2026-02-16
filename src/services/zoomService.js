const axios = require('axios');
const config = require('../config/config');

const getAccessToken = async () => {
  try {
    const credentials = Buffer.from(
      `${config.zoom.clientId}:${config.zoom.clientSecret}`
    ).toString('base64');

    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${config.zoom.accountId}`,
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Zoom token error:', error.response?.data || error.message);
    throw new Error('Failed to get Zoom access token');
  }
};

const createMeeting = async (sessionData) => {
  try {
    const accessToken = await getAccessToken();

    const meetingData = {
      topic: `Tutoring Session - ${sessionData.topic || 'General'}`,
      type: 2,
      start_time: `${sessionData.scheduled_date}T${sessionData.scheduled_time}:00`,
      duration: sessionData.duration_minutes || 60,
      timezone: 'Asia/Kolkata',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        watermark: false,
        audio: 'both',
        auto_recording: 'none'
      }
    };

    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      meetingData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      meeting_id: response.data.id,
      join_url: response.data.join_url,
      password: response.data.password,
      start_url: response.data.start_url
    };
  } catch (error) {
    console.error('Zoom meeting creation error:', error.response?.data || error.message);
    throw new Error('Failed to create Zoom meeting');
  }
};

module.exports = {
  createMeeting
};
