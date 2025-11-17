const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');

// @desc    Create a new conversation
// @route   POST /conversations
// @access  Public (adjust later if you add auth)
const createConversation = asyncHandler(async (req, res) => {
  const { user_id, conversationName, campaign } = req.body;

  if (!user_id || !conversationName) {
    res.status(400);
    throw new Error('user_id and conversationName are required');
  }

  const conversation = await Conversation.create({
    user_id,
    conversationName,
    campaign: campaign || undefined,
  });

  res.status(201).json(conversation);
});

// @desc    Get all conversations
// @route   GET /conversations
// @access  Public
const getAllConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find()
    .populate('user_id', '-password')
    .sort({ createdAt: -1 });

  res.json(conversations);
});

// @desc    Get a conversation by ID (including all messages)
// @route   GET /conversations/:id
// @access  Public
const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate('user_id', '-password')
    .populate({
      path: 'messages',
      options: { sort: { createdAt: 1 } },
    });

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  res.json(conversation);
});

// @desc    Update a conversation (cannot change user_id)
// @route   PUT /conversations/:id
// @access  Public
const updateConversation = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  // Prevent changing ownership
  delete updates.user_id;

  const conversation = await Conversation.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  )
    .populate('user_id', '-password')
    .populate({ path: 'messages', options: { sort: { createdAt: 1 } } });

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  res.json(conversation);
});

// @desc    Delete a conversation
// @route   DELETE /conversations/:id
// @access  Public
const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findByIdAndDelete(req.params.id);

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  res.json({ message: 'Conversation deleted successfully' });
});

// @desc    Get conversations for a user
// @route   GET /conversations/user/:user_id
// @access  Public
const getConversationByUser = asyncHandler(async (req, res) => {
  const userId = req.params.user_id;

  const conversations = await Conversation.find({ user_id: userId })
    .populate('user_id', '-password')
    .populate({ path: 'messages', options: { sort: { createdAt: 1 } } })
    .sort({ createdAt: -1 });

  res.json(conversations);
});

module.exports = {
  createConversation,
  getAllConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  getConversationByUser,
};
