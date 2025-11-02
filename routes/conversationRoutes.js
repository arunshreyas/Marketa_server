const express = require('express');
const router = express.Router();
const {
  getConversationsByUser,
  getConversationsByCampaign,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation
} = require('../controllers/conversationController');

// Get conversations by user
router.route('/user/:userId')
  .get(getConversationsByUser);

// Get conversations by campaign
router.route('/campaign/:campaignId')
  .get(getConversationsByCampaign);

// General conversation routes
router.route('/')
  .post(createConversation);

router.route('/:id')
  .get(getConversationById)
  .put(updateConversation)
  .delete(deleteConversation);

module.exports = router;

