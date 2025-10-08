const express = require('express');
const router = express.Router();

const { 
    getAllDocs, 
    getDocByIdentifier, 
    createDoc, 
    updateDoc, 
    deleteDoc 
} = require('../controllers/docsController');

const checkToken = require('../middleware/checkToken');
const { checkReadPermission, checkWritePermission } = require('../middleware/checkPermissions');

// [GET /api/docs] - Lista todos (todos os roles autenticados)
router.get('/', checkToken, checkReadPermission, getAllDocs); 

// [GET /api/docs/id/:identifier] - Busca por identificador (todos os roles autenticados)
router.get('/id/:identifier', checkToken, checkReadPermission, getDocByIdentifier); 

// [POST /api/docs] - Cria novo (adm e técnico)
router.post('/', checkToken, checkWritePermission, createDoc); 

// [PUT /api/docs/:identifier] - Atualiza (adm ou técnico criador)
router.put('/:identifier', checkToken, checkWritePermission, updateDoc);         

// [DELETE /api/docs/:identifier] - Deleta (adm ou técnico criador)
router.delete('/:identifier', checkToken, checkWritePermission, deleteDoc);     

module.exports = router;