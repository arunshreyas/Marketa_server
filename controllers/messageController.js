const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Message = require('../models/Messages');

const User = require('../models/User');
const Campaign = require('../models/Campaign');
const { v4: uuidv4 } = require('uuid');
const { sendEvent } = require('../utils/sse');
const agentSelector = require('../utils/agentSelector');
const { generateAIResponse } = require('../services/aiService');

// @desc    Get all messages
// @route   GET /api/messages
// @access  Public
const getAllMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find()
    .populate('sender', 'username email')
    .populate('campaign', 'campaign_name campaign_id user')
    .sort({ createdAt: -1 })
    .limit(100); // Limit to prevent huge responses
  
  res.json(messages);
});

// @desc    Get all messages for a campaign
// @route   GET /messages/campaign/:campaignId
// @access  Public
const getMessagesByCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    res.status(400);
    throw new Error('Invalid campaign ID format');
  }

  // Verify campaign exists
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const messages = await Message.find({ campaign: campaignId })
    .sort({ createdAt: 1 });

  const formatted = messages.map((m) => ({
    _id: m._id,
    content: m.content,
    response: m.response,
    role: m.role,
    createdAt: m.createdAt,
  }));

  res.json(formatted);
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Public
const getMessageById = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id)
    .populate('campaign', 'campaign_name campaign_id user')
    .populate('sender', 'username email');
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  
  res.json(message);
});

// @desc    Create a new message and AI response in a single document
// @route   POST /messages
// @access  Public
const createMessage = asyncHandler(async (req, res) => {
  const {
    campaign: campaignId,
    sender: senderId,
    content,
  } = req.body;

  if (!campaignId || !content) {
    res.status(400);
    throw new Error('campaign and content are required');
  }

  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    res.status(400);
    throw new Error('Invalid campaign ID format');
  }

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  let sender = undefined;
  if (senderId && mongoose.Types.ObjectId.isValid(senderId)) {
    const senderDoc = await User.findById(senderId);
    if (senderDoc) {
      sender = senderId;
    }
  }

  // Create initial user message
  const message = await Message.create({
    message_id: uuidv4(),
    campaign: campaign._id,
    sender,
    role: 'user',
    content,
  });

  // AI agent logic
  try {
    const agent = agentSelector(campaign.type);
    const campaignContext = campaign.goals || campaign.content || '';

    const aiReply = await generateAIResponse({
      agent,
      content,
      campaignContext,
    });

    // Use AI reply if present, otherwise a generic fallback
    message.response = aiReply || 'The AI did not return any text.';
    await message.save();

    // Update campaign aggregates
    campaign.last_message = content;
    campaign.message_count = (campaign.message_count || 0) + 1;
    await campaign.save();

    try { sendEvent(campaign._id.toString(), 'message:new', message); } catch (_) {}
  } catch (err) {
    console.error('AI generation error:', err.message);
    // Guarantee a response even if the AI call fails
    message.response = 'The AI service is temporarily unavailable. Please try again later.';
    await message.save();
  }

  res.status(201).json(message);
});

// @desc    Update a message
// @route   PUT /api/messages/:id
// @access  Public
const updateMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  const { content } = req.body;
  
  if (content !== undefined) message.content = content;

  await message.save();
  
  res.json({
    message: 'Message updated successfully',
    message_data: message
  });
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Public
const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid message ID format');
  }

  const message = await Message.findById(id);
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  await Message.findByIdAndDelete(id);
  
  res.status(200).json({ message: 'Message deleted successfully' });
});

module.exports = {
  getAllMessages,
  getMessagesByCampaign,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage
};
