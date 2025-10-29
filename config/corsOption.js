const { options } = require('../routes/root')
const allowedOrigins = require('./allowedOrigins')

const corsOptions = {   
    origin: (origin, callback) => {
        // Allow all origins if explicitly enabled via env (for troubleshooting)
        if (process.env.ALLOW_ALL_ORIGINS === 'true') return callback(null, true)

        const isAllowed = !origin || allowedOrigins.some((o) => {
            if (o instanceof RegExp) return o.test(origin)
            return o === origin
        })

        if (isAllowed) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by cors'))
        }
    },
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    optionsSuccessStatus: 204
}

module.exports = corsOptions