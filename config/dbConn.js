const mongoose = require('mongoose');

const connectDB = async () =>{
    try{
        const mongoURI = process.env.DATABASE_URI ;
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected');
    }catch(err){
        console.log('MongoDB connection error:', err);
        process.exit(1);
    }
}

module.exports = connectDB;