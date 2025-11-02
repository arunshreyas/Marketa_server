const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversations');
const Message = require('../models/Messages');
const User = require('../models/User');
const Campaign = require('../models/Campaigns');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all conversations for a user
// @route   GET /api/conversations/user/:userId
// @access  Public
const getConversationsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid user ID format');
  }

  const conversations = await Conversation.find({ user_id: userId })
    .populate('campaign_id', 'campaign_name status')
    .sort({ updatedAt: -1 });
  
  res.json(conversations);
});

// @desc    Get all conversations for a campaign
// @route   GET /api/conversations/campaign/:campaignId
// @access  Public
const getConversationsByCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    res.status(400);
    throw new Error('Invalid campaign ID format');
  }

  const conversations = await Conversation.find({ campaign_id: campaignId })
    .populate('user_id', 'username email')
    .sort({ updatedAt: -1 });
  
  res.json(conversations);
});

// @desc    Get single conversation with messages
// @route   GET /api/conversations/:id
// @access  Public
const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate('user_id', 'username email')
    .populate('campaign_id', 'campaign_name status');
  
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Fetch messages for this conversation
  const messages = await Message.find({ conversation: conversation._id })
    .populate('sender', 'username email')
    .sort({ createdAt: 1 });
  
  res.json({
    conversation,
    messages
  });
});

// @desc    Create a new conversation
// @route   POST /api/conversations
// @access  Public
const createConversation = asyncHandler(async (req, res) => {
  const {
    user_id,
    campaign_id,
    title,
    context,
    ai_preferences
  } = req.body;

  if (!user_id || !title) {
    res.status(400);
    throw new Error('User ID and title are required');
  }

  // Validate user exists
  const user = await User.findById(user_id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Validate campaign if provided
  if (campaign_id) {
    if (!mongoose.Types.ObjectId.isValid(campaign_id)) {
      res.status(400);
      throw new Error('Invalid campaign ID format');
    }
    const campaign = await Campaign.findById(campaign_id);
    if (!campaign) {
      res.status(404);
      throw new Error('Campaign not found');
    }
  }

  const conversation = await Conversation.create({
    conversation_id: uuidv4(),
    user_id: user._id,
    campaign_id: campaign_id ? campaign_id : undefined,
    title,
    context: context || {},
    ai_preferences: ai_preferences || {},
    status: 'active'
  });

  // If conversation is linked to a campaign, add reference to campaign
  if (campaign_id) {
    const campaign = await Campaign.findById(campaign_id);
    if (campaign) {
      campaign.conversations.push(conversation._id);
      await campaign.save();
    }
  }

  res.status(201).json(conversation);
});

// @desc    Update a conversation
// @route   PUT /api/conversations/:id
// @access  Public
const updateConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Allow updating title, context, ai_preferences, and status
  const { title, context, ai_preferences, status } = req.body;
  
  if (title !== undefined) conversation.title = title;
  if (context !== undefined) conversation.context = context;
  if (ai_preferences !== undefined) conversation.ai_preferences = ai_preferences;
  if (status !== undefined) conversation.status = status;

  await conversation.save();
  
  res.json({
    message: 'Conversation updated successfully',
    conversation
  });
});

// @desc    Delete a conversation
// @route   DELETE /api/conversations/:id
// @access  Public
const deleteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid conversation ID format');
  }

  const conversation = await Conversation.findById(id);
  
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Delete all messages in the conversation
  await Message.deleteMany({ conversation: conversation._id });
  
  // If conversation is linked to a campaign, remove reference from campaign
  if (conversation.campaign_id) {
    await Campaign.findByIdAndUpdate(
      conversation.campaign_id,
      { $pull: { conversations: conversation._id } }
    );
  }
  
  // Delete the conversation
  await Conversation.findByIdAndDelete(id);
  
  res.status(200).json({ message: 'Conversation and all associated messages deleted successfully' });
});

module.exports = {
  getConversationsByUser,
  getConversationsByCampaign,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation
};

