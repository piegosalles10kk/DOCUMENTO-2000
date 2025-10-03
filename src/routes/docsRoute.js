const express = require('express');
const router = express.Router();

const { 
    getAllDocs, 
    getDocByIdentifier, 
    createDoc, 
    updateDoc, 
    deleteDoc 
} = require('../controllers/docsController');


// [GET /api/docs] - Lista todos os documentos
router.get('/', getAllDocs); 

// [POST /api/docs] - Cria um novo documento
router.post('/', createDoc); 

// [GET /api/docs/:identifier] - Lê um documento específico
router.get('/:id', getDocByIdentifier); 
    
// [PUT /api/docs/:identifier] - Atualiza um documento
router.put('/:id', updateDoc);         
    
// [DELETE /api/docs/:identifier] - Deleta um documento
router.delete('/:id', deleteDoc);     


module.exports = router;