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

// [GET /api/docs] - Lista todos
router.get('/', getAllDocs); 

// [POST /api/docs] - Cria novo
router.post('/', createDoc); 

// [GET /api/docs/id/:identifier] - Busca por identificador
router.get('/id/:identifier', getDocByIdentifier); 

// [PUT /api/docs/:identifier] - Atualiza
router.put('/:identifier', updateDoc);         

// [DELETE /api/docs/:identifier] - Deleta
router.delete('/:identifier', deleteDoc);     

module.exports = router;