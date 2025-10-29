const allowedOrigins = [
    // Frontend dev
    "http://localhost:3000",
    "http://localhost:5173",
    // Backend itself (some tools send no origin or same-origin)
    "https://marketa-server.onrender.com",
]

module.exports = allowedOrigins;