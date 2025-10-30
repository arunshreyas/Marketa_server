const Brand = require('../models/Brand');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

const createBrand = asyncHandler(async (req, res) => {
    const { user_id, brand_name, product_description, target_audience } = req.body;
    if (!user_id || !brand_name || !product_description || !target_audience) {
        res.status(400);
        throw new Error('All fields are required');
    }
    const brand = await Brand.create({ user_id, brand_name, product_description, target_audience });
    res.status(201).json(brand);
});

// Get all brands
const getAllBrands = asyncHandler(async (req, res) => {
    const brands = await Brand.find().populate('user_id', '-password');
    res.json(brands);
});


const getBrandById = asyncHandler(async (req, res) => {
    const brand = await Brand.findById(req.params.id).populate('user_id', '-password');
    if (!brand) {
        res.status(404);
        throw new Error('Brand not found');
    }
    res.json(brand);
});

// Update a brand
const updateBrand = asyncHandler(async (req, res) => {
    const updates = req.body;
    
    delete updates.user_id;
    const brand = await Brand.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('user_id', '-password');
    if (!brand) {
        res.status(404);
        throw new Error('Brand not found');
    }
    res.json(brand);
});

// Delete a brand
const deleteBrand = asyncHandler(async (req, res) => {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
        res.status(404);
        throw new Error('Brand not found');
    }
    res.json({ message: 'Brand deleted successfully' });
});

// Get brand by user_id
const getBrandByUser = asyncHandler(async (req, res) => {
    const userId = req.params.user_id;
    const brand = await Brand.findOne({ user_id: userId }).populate('user_id', '-password');
    if (!brand) {
        res.status(404);
        throw new Error('Brand not found for this user');
    }
    res.json(brand);
});

module.exports = {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
    getBrandByUser,
};
