const express = require('express');
const router = express.Router();

// Importar controllers
const {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    loginUser,
    sendRecoveryCode,
    verificarCodigo,
    updatePasswordRecovery
} = require('../controllers/userController');

// Importar middleware
const checkToken = require('../middleware/checkToken');

// ==========================================
// ROTAS PÚBLICAS (sem autenticação)
// ==========================================

// Autenticação
router.post('/auth/register', createUser);
router.post('/auth/login', loginUser);

// Recuperação de senha
router.get('/auth/recover/:email', sendRecoveryCode);
router.get('/auth/verify-code/:email/:codigo', verificarCodigo);
router.put('/auth/update-password-recovery', updatePasswordRecovery);

// ==========================================
// ROTAS PROTEGIDAS (com autenticação)
// ==========================================

// CRUD de usuários
router.get('/', checkToken, getAllUsers);
router.get('/:id', checkToken, getUser);
router.put('/:id', checkToken, updateUser);
router.delete('/:id', checkToken, deleteUser);

module.exports = router;