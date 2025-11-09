const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');

// Create response
router.post('/', responseController.createResponse);
// Get all responses
router.get('/', responseController.getAllResponses);
// Get responses by message_id and user_id (query params)
router.get('/by-message-and-user', responseController.getResponseByMessageAndUser);
// Get responses by campaign ID
router.get('/by-campaign/:campaignId', responseController.getAllResponseByCampaign);
// Get response by user ID (define before ':id' to avoid conflicts)
router.get('/by-user/:user_id', responseController.getResponseByUser);
// Get response by ID
router.get('/:id', responseController.getResponseById);
// Update response
router.put('/:id', responseController.updateResponse);
// Delete response
router.delete('/:id', responseController.deleteResponse);

module.exports = router;