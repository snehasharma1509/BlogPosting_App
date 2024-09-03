const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const auth = (req, res, next) => {
    const token = req.headers['token']
    if (!token){
        res.send('Access token is expired or not generated');
        logger.info('Access token is expired or not generated');
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err){
            res.send('Unauthorized')
            logger.info('Unauthorized access')
        } 
        next();
        
    });
    
};

module.exports = auth;