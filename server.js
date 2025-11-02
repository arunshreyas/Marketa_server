require('dotenv').config()
const express = require("express");
const app = express();
const path= require("path")
const {logger}=require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const corsOptions = require('./config/corsOption')
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');
const {logEvents} = require('./middleware/logger');
const port = process.env.PORT || 3500;
const passport = require('passport');
require('./config/passport');
const session = require('express-session');

connectDB()

app.use(logger)

app.use(cors(corsOptions))
// Explicitly handle preflight using regex to avoid wildcard path errors
app.options(/.*/, cors(corsOptions))

app.use(express.json())

app.use(cookieParser())

app.use(express.static(path.join(__dirname,"public")))

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'marketa-session',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // For development only
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(require('./routes/root'))

// Auth routes at root level: /signup and /login
app.use('/', require('./routes/authRoutes'))

app.use('/users',require('./routes/userRoutes'))
app.use('/campaigns',require('./routes/campaignRoutes'))
app.use('/brands', require('./routes/brandRoutes'));
app.use('/conversations', require('./routes/conversationRoutes'));
app.use('/messages', require('./routes/messageRoutes'));

app.use((req, res) => {
    res.status(404);
    if(req.accepts('html')){
        res.sendFile(path.join(__dirname,'views','404.html'))
    }else if(req.accepts('json')){
        res.json({message:'404 Not Found'})
    }else{
        res.type('txt').send('404 Not Found')
    }
})
app.use(errorHandler)

// Start server after successful Mongo connection
mongoose.connection.once('open', () => {
    console.log('MongoDB connected');
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })
})

mongoose.connection.on('error', (err) => {
    console.log(err);
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log');
})