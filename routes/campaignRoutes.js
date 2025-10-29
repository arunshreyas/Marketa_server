const express = require('express');
const router = express.Router();
const {
  getAllCampaigns,
  getCampaignsByUser,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign
} = require('../controllers/campaignController');

// Public for now — can add protect middleware later
router.route('/')
  .get(getAllCampaigns)
  .post(createCampaign);

router.route('/user/:userId')
  .get(getCampaignsByUser);

router.route('/:id')
  .get(getCampaignById)
  .put(updateCampaign)
  .delete(deleteCampaign);

module.exports = router;
