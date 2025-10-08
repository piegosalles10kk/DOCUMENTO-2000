// src/routes/docsRoute.js - ROTAS CORRIGIDAS
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

// [GET /api/docs] - Lista todos
router.get('/',checkToken, getAllDocs); 

// [POST /api/docs] - Cria novo
router.post('/',checkToken, createDoc); 

// [GET /api/docs/id/:identifier] - Busca por identificador
router.get('/id/:identifier',checkToken, getDocByIdentifier); 

// [PUT /api/docs/:identifier] - Atualiza
router.put('/:identifier',checkToken, updateDoc);         

// [DELETE /api/docs/:identifier] - Deleta
router.delete('/:identifier',checkToken, deleteDoc);     

module.exports = router;