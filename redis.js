const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    host: process.env.REDIS_URL
};