const axios = require('axios');

const PY_AI_SERVICE_URL = process.env.PY_AI_SERVICE_URL || 'http://127.0.0.1:8000';

// This function is used by messageController.js.
// It now calls the Python FastAPI service instead of OpenRouter directly.
const generateAIResponse = async ({ agent, content, campaignContext }) => {
  const messages = [];

  if (campaignContext) {
    messages.push({
      role: 'system',
      content: `Campaign context: ${campaignContext}`,
    });
  }

  messages.push({
    role: 'user',
    content,
  });

  const payload = {
    agent,
    messages,
  };

  try {
    const url = `${PY_AI_SERVICE_URL}/generate`;
    console.log('Calling Python AI service:', {
      url,
      payloadSummary: {
        agent,
        messagesCount: messages.length,
      },
    });

    const response = await axios.post(url, payload, { timeout: 60000 });

    const reply = response?.data?.reply || '';
    const text = (reply || '').trim();

    return text || 'The AI did not return any text.';
  } catch (err) {
    console.error('Python AI service error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

module.exports = { generateAIResponse };
