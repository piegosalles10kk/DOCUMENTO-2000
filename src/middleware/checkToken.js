const jwt = require('jsonwebtoken');
const secret = require('../utils/secret');

function checkToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    try {
        const decoded = jwt.verify(token, secret);
        req.user = {
            _id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };
        next();
    } catch (error) {
        console.log('Erro ao verificar token:', error);
        res.status(400).json({ msg: 'Token inválido' });
    }
}

module.exports = checkToken;