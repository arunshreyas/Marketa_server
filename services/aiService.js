const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// Load system prompt from /agents/<agent>.txt
const loadSystemPrompt = (agent) => {
  const filePath = path.join(__dirname, '..', 'agents', `${agent}.txt`);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('Error loading system prompt for agent', agent, err.message);
    return '';
  }
};

const generateAIResponse = async ({ agent, content, campaignContext }) => {
  const systemPrompt = loadSystemPrompt(agent);

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  if (campaignContext) {
    messages.push({
      role: 'system',
      content: `Campaign context: ${campaignContext}`,
    });
  }
  messages.push({ role: 'user', content });

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'openrouter/auto',
      messages,
      temperature: 0.7,
    });

    const text = response.choices?.[0]?.message?.content || '';
    return text.trim();
  } catch (err) {
    // Log richer error information to help diagnose provider issues
    console.error('OpenRouter AI error:', {
      status: err.status,
      message: err.message,
      data: err.response?.data,
    });
    throw err;
  }
};

module.exports = { generateAIResponse };
