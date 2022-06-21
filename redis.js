const dotenv = require('dotenv');
dotenv.config();
if (process.env.NODE_ENV === 'development') {
    module.exports = {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_PORT,
    };
} else {
    module.exports = {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    };
};