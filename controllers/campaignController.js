const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaigns');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');


const getAllCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find().populate('user', 'username email name');
  if (!campaigns.length) {
    res.status(404);
    throw new Error('No campaigns found');
  }
  res.json(campaigns);
});


const getCampaignsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const campaigns = await Campaign.find({ user: userId });
  // Return empty list instead of 404 to simplify client handling
  res.json(Array.isArray(campaigns) ? campaigns : []);
});


const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }
  res.json(campaign);
});


const createCampaign = asyncHandler(async (req, res) => {
  const {
    campaign_name,
    status,
    goals,
    channels,
    budget,
    start_date,
    end_date,
    audience,
    content,
  } = req.body;
  // Accept user id from either userId (preferred) or user (backward compatibility)
  const userId = req.body.userId || req.body.user;

  if (
    !campaign_name ||
    !status ||
    !goals ||
    !channels ||
    !budget ||
    !start_date ||
    !end_date ||
    !audience ||
    !content ||
    !userId
  ) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const campaign = await Campaign.create({
    campaign_id: uuidv4(),
    campaign_name,
    status,
    goals,
    channels,
    budget,
    start_date,
    end_date,
    audience,
    content,
    user: user._id
  });

  // Add reference to user
  user.campaigns.push(campaign._id);
  await user.save();

  res.status(201).json(campaign);
});

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Public (secure later)
const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const updates = req.body;
  const updatedCampaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.json({
    message: 'Campaign updated successfully',
    campaign: updatedCampaign
  });
});

// @desc    Delete campaign
// @route   DELETE /campaigns/:id
// @access  Public (secure later)
const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid campaign ID format');
  }

  const campaign = await Campaign.findById(id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  await Campaign.findByIdAndDelete(id);

  // Optionally remove reference from user
  await User.updateMany({}, { $pull: { campaigns: campaign._id } });

  res.status(200).json({ message: 'Campaign deleted successfully' });
});

module.exports = {
  getAllCampaigns,
  getCampaignsByUser,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign
};
