const allowedOrigins = [
    // Frontend dev
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
<<<<<<< HEAD
    "https://marketa-ten.vercel.app",
    "https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--3000--cf284e50.local-credentialless.webcontainer-api.io",
=======
    "https://marketa-ten.vercel.app/",
    "https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--3000--cf284e50.local-credentialless.webcontainer-api.io/",
>>>>>>> e795fda163cfd9083d52c3521ba6fd93fa4f80d2
    // Common hosted app domains (wildcards via RegExp)
    /https?:\/\/.*\.vercel\.app$/,
    /https?:\/\/.*\.netlify\.app$/,
    /https?:\/\/.*\.onrender\.com$/,
    // Backend itself
    "https://marketa-server.onrender.com",
]

module.exports = allowedOrigins;
