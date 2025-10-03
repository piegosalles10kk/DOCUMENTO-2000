const Documentation = require('../models/Documentation');

// 1. [GET] Listar Todos
const getAllDocs = async (req, res) => {
    try {
        const docs = await Documentation.find()
            .select('tituloDocumento identificador ultimaAtualizacao')
            .sort({ ultimaAtualizacao: -1 });
        
        return res.status(200).json({
            sucesso: true,
            total: docs.length,
            dados: docs
        });
    } catch (error) {
        console.error("Erro em getAllDocs:", error);
        return res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao buscar documentos.' 
        });
    }
};

// 2. [GET] Obter por Identificador
const getDocByIdentifier = async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const doc = await Documentation.findOne({ identificador: identifier });

        if (!doc) {
            return res.status(404).json({
                sucesso: false,
                mensagem: `Documentação ${identifier} não encontrada.`
            });
        }

        return res.status(200).json({
            sucesso: true,
            dados: doc
        });
    } catch (error) {
        console.error("Erro em getDocByIdentifier:", error);
        return res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao buscar documento.' 
        });
    }
};

// 3. [POST] Criar
const createDoc = async (req, res) => {
    try {
        const novoDoc = new Documentation(req.body);
        const docSalvo = await novoDoc.save();

        return res.status(201).json({ 
            sucesso: true, 
            mensagem: 'Documentação criada!', 
            dados: docSalvo 
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Dados inválidos.',
                detalhes: messages.join('; ') 
            });
        }
        console.error("Erro em createDoc:", error);
        return res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao criar documento.' 
        });
    }
};

// 4. [PUT] Atualizar
const updateDoc = async (req, res) => {
    try {
        const identificador = req.params.identifier;
        const docAtualizado = await Documentation.findOneAndUpdate(
            { identificador }, 
            { $set: req.body, ultimaAtualizacao: Date.now() },
            { new: true, runValidators: true }
        );

        if (!docAtualizado) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `Documento ${identificador} não encontrado.` 
            });
        }
        
        return res.status(200).json({ 
            sucesso: true, 
            mensagem: 'Documentação atualizada!', 
            dados: docAtualizado 
        });
    } catch (error) {
        console.error("Erro em updateDoc:", error);
        return res.status(400).json({ 
            sucesso: false, 
            mensagem: 'Erro ao atualizar.' 
        });
    }
};

// 5. [DELETE] Excluir
const deleteDoc = async (req, res) => {
    try {
        const identificador = req.params.identifier;
        const docDeletado = await Documentation.findOneAndDelete({ 
            identificador 
        });
        
        if (!docDeletado) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `Documento ${identificador} não encontrado.` 
            });
        }
        
        return res.status(200).json({ 
            sucesso: true, 
            mensagem: 'Documentação excluída.', 
            dados: docDeletado 
        });
    } catch (error) {
        console.error("Erro em deleteDoc:", error);
        return res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro ao excluir.' 
        });
    }
};

module.exports = {
    getAllDocs,
    getDocByIdentifier,
    createDoc,
    updateDoc,
    deleteDoc,
};