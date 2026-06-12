<!-- to generate access token secret and refresh token secret -->
node -e "const c = require('crypto'); console.log('ACCESS_TOKEN_SECRET=' + c.randomBytes(64).toString('hex')); console.log('REFRESH_TOKEN_SECRET=' + c.randomBytes(64).toString('hex'));"

<!-- .env template -->
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yourdb
ACCESS_TOKEN_SECRET=your_access_secret_key
REFRESH_TOKEN_SECRET=your_refresh_secret_key
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d