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
  const baseSystemPrompt = loadSystemPrompt(agent);
  const safetyLayer =
    'IMPORTANT: Never invent promotions, discounts, sales, seasonal events, or generic marketing offers unless the user explicitly requests it.';

  const systemPrompt = baseSystemPrompt
    ? `${baseSystemPrompt}\n\n${safetyLayer}`
    : safetyLayer;

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
    const model = process.env.OPENROUTER_MODEL || 'openrouter/auto';
    console.log('generateAIResponse payload:', { model, messages });

    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
    });

    const text = (response.choices?.[0]?.message?.content || '').trim();

    // Defensive fallback: if the reply looks like a generic promotion but
    // the user did not mention any sale-related concept, return a neutral message.
    const lowerReply = text.toLowerCase();
    const lowerUser = (content || '').toLowerCase();
    const promoKeywords = ['sale', 'discount', 'seasonal offer', 'limited time offer', 'black friday', 'cyber monday'];

    const userRequestedPromo = promoKeywords.some((kw) => lowerUser.includes(kw));
    const looksLikePromo = promoKeywords.some((kw) => lowerReply.includes(kw));

    if (looksLikePromo && !userRequestedPromo) {
      return 'Your message was misinterpreted. Please clarify what you need.';
    }

    return text;
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
