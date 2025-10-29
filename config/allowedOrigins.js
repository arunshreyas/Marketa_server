const allowedOrigins = [
    // Frontend dev
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://marketa-ten.vercel.app/",
    // Common hosted app domains (wildcards via RegExp)
    /https?:\/\/.*\.vercel\.app$/,
    /https?:\/\/.*\.netlify\.app$/,
    /https?:\/\/.*\.onrender\.com$/,
    // Backend itself
    "https://marketa-server.onrender.com",
]

module.exports = allowedOrigins;
