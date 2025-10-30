const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

// Create brand
router.post('/', brandController.createBrand);
// Get all brands
router.get('/', brandController.getAllBrands);
// Get brand by ID
router.get('/:id', brandController.getBrandById);
// Update brand
router.put('/:id', brandController.updateBrand);
// Delete brand
router.delete('/:id', brandController.deleteBrand);
// Get brand by user ID
router.get('/by-user/:user_id', brandController.getBrandByUser);

module.exports = router;
