const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Response = require('../models/Response');
const { v4: uuidv4 } = require('uuid');
const Campaign = require('../models/Campaign');
const Message = require('../models/Messages');
const { sendEvent } = require('../utils/sse');

const getAllResponses = asyncHandler(async (req,res)=>{
  const responses = await Response.find()
    .populate('campaign', 'campaign_name campaign_id user')
    .sort({ created_at: -1 })
    .limit(100);
  res.json(responses);
});

const getAllResponseByCampaign = asyncHandler(async (req,res)=>{
  const { campaignId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    res.status(400);
    throw new Error('Invalid campaign ID format');
  }
  const responses = await Response.find({ campaign: campaignId })
    .populate('campaign', 'campaign_name campaign_id user')
    .sort({ created_at: -1 })
    .limit(100);
  res.json(responses);
});

const getResponseById = asyncHandler(async (req,res)=>{
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid response ID format');
  }
  const response = await Response.findById(id)
    .populate('campaign', 'campaign_name campaign_id user');
  if (!response) {
    res.status(404);
    throw new Error('Response not found');
  }
  res.json(response);
});

const createResponse = asyncHandler(async (req,res)=>{
  const { campaign: campaignId, response: responseText, message_id } = req.body;
  if (!campaignId || !responseText) {
    res.status(400);
    throw new Error('campaign and response are required');
  }
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    res.status(400);
    throw new Error('Invalid campaign ID format');
  }
  const campaign = await Campaign.findById(campaignId).select('_id');
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const response = await Response.create({
    response_id: uuidv4(),
    campaign: campaign._id,
    response: responseText,
    message_id: message_id || undefined,
  });

  // Also persist as an assistant message in the conversation
  const aiMessage = await Message.create({
    message_id: uuidv4(),
    campaign: campaign._id,
    role: 'assistant',
    content: responseText,
  });

  // Emit SSE event to subscribers for this campaign, include linkage to user message
  try {
    const payload = {
      ...(aiMessage.toObject ? aiMessage.toObject() : aiMessage),
      link_message_id: message_id || null,
    };
    sendEvent(campaign._id.toString(), 'message:new', payload);
  } catch (_) {}

  res.status(201).json({
    message: 'Response created successfully',
    response_data: response,
    aiMessage
  });
});

const updateResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid response ID format');
  }
  const { response: responseText } = req.body;
  const response = await Response.findById(id);
  if (!response) {
    res.status(404);
    throw new Error('Response not found');
  }
  if (responseText !== undefined) response.response = responseText;
  await response.save();
  res.json({ message: 'Response updated successfully', response_data: response });
});

const deleteResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid response ID format');
  }
  const response = await Response.findById(id);
  if (!response) {
    res.status(404);
    throw new Error('Response not found');
  }
  await Response.findByIdAndDelete(id);
  res.status(200).json({ message: 'Response deleted successfully' });
});

const getResponseByUser = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    res.status(400);
    throw new Error('Invalid user ID format');
  }
  const campaigns = await Campaign.find({ user: user_id }).select('_id');
  const campaignIds = campaigns.map(c => c._id);
  const responses = await Response.find({ campaign: { $in: campaignIds } })
    .populate('campaign', 'campaign_name campaign_id user')
    .sort({ created_at: -1 });
  res.json(responses);
});

// GET /response/by-message-and-user?message_id=...&user_id=...
const getResponseByMessageAndUser = asyncHandler(async (req, res) => {
  const { message_id, user_id } = req.query;

  if (!message_id) {
    res.status(400);
    throw new Error('message_id is required');
  }
  if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
    res.status(400);
    throw new Error('Valid user_id is required');
  }

  // Find campaigns owned by this user
  const campaigns = await Campaign.find({ user: user_id }).select('_id');
  const campaignIds = campaigns.map(c => c._id);

  // Find responses that match the message_id and belong to user's campaigns
  const responses = await Response.find({
    message_id: message_id,
    campaign: { $in: campaignIds }
  })
  .populate('campaign', 'campaign_name campaign_id user')
  .sort({ created_at: -1 });

  res.json(responses);
});

module.exports = {
  getAllResponses,
  getAllResponseByCampaign,
  getResponseById,
  createResponse,
  updateResponse,
  deleteResponse,
  getResponseByUser,
  getResponseByMessageAndUser,
};