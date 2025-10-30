const { default: mongoose } = require("mongoose");

const brandSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    brand_name: {
        type: String,
        required: true
    },
    product_description: {
        type: String,
        required: true
    },
    target_audience:{
        type: [String],
        required: true
    }

})