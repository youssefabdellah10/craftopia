const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: 'No token provided.' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        

        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            return res.status(401).json({ message: 'Token expired' });
        }
        
        // Set user info in request object
        req.user = decoded;
        next();
    } catch(error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({message: 'Unauthorized: Invalid token'});
    }
};