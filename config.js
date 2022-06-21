const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    HOST: process.env.HOST,
    PORT: process.env.PORT,
    REDIS_URL: process.env.REDIS_URL
};