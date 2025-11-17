const express = require('express');
const router = express.Router();

const {
  createConversation,
  getAllConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  getConversationByUser,
} = require('../controllers/conversationController');

router.route('/')
  .get(getAllConversations)
  .post(createConversation);

router.route('/:id')
  .get(getConversationById)
  .put(updateConversation)
  .delete(deleteConversation);

router.get('/user/:user_id', getConversationByUser);

module.exports = router;
