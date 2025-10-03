const Documentation = require('../models/Documentation');

// 1. [GET] Listar Todos os Documentos
const getAllDocs = async (req, res) => {
    try {
        const docs = await Documentation.find()
            .select('tituloDocumento identificador ultimaAtualizacao');
        
        return res.status(200).json({
            sucesso: true,
            total: docs.length,
            dados: docs
        });

    } catch (error) {
        // ... (código de erro omitido para brevidade)
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor ao buscar documentos.' });
    }
};

// 2. [GET] Obter um Documento Específico
const getDocByIdentifier = async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const doc = await Documentation.findOne({ identificador: identifier });

        if (!doc) {
            return res.status(404).send(`Documentação ${identifier} não encontrada.`);
        }

        // Isso renderiza o template views/documento.ejs
        res.render('documento', { documentacao: doc });

    } catch (error) {
        console.error("Erro ao buscar documentação para renderização:", error);
        res.status(500).send("Erro interno do servidor durante a renderização.");
    }
};

// 3. [POST] Criar Novo Documento
const createDoc = async (req, res) => {
    try {
        const novoDoc = new Documentation(req.body);
        const docSalvo = await novoDoc.save();

        return res.status(201).json({ sucesso: true, mensagem: 'Documentação criada com sucesso!', dados: docSalvo });

    } catch (error) {
        // --- NOVO BLOCO DE TRATAMENTO DE ERRO DETALHADO ---
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            
            // Retorna os detalhes da validação para você poder corrigir o Schema/Payload
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Dados inválidos ou campos obrigatórios ausentes.',
                detalhes: messages.join('; ') 
            });
        }
        // Loga o erro interno para depuração no servidor
        console.error("Erro interno do servidor em createDoc:", error);
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor ao criar documento.' });
    }
};

// 4. [PUT/PATCH] Atualizar Documento Existente
const updateDoc = async (req, res) => {
    try {
        const identificador = req.params.identifier;
        const docAtualizado = await Documentation.findOneAndUpdate(
            { identificador }, 
            { $set: req.body, ultimaAtualizacao: Date.now() },
            { new: true, runValidators: true }
        );

        if (!docAtualizado) {
            return res.status(404).json({ sucesso: false, mensagem: `Documentação com identificador ${identificador} não encontrada.` });
        }
        
        return res.status(200).json({ sucesso: true, mensagem: 'Documentação atualizada com sucesso!', dados: docAtualizado });

    } catch (error) {
        // ... (código de erro omitido para brevidade)
        return res.status(400).json({ sucesso: false, mensagem: 'Erro ao atualizar documento. Verifique os dados fornecidos.' });
    }
};

// [DELETE] Excluir Documento
const deleteDoc = async (req, res) => {
    try {
        const docId = req.params.id;

        // Opção 1: Usar findByIdAndDelete (Recomendado para deletar por _id)
        const docDeletado = await Documentation.findByIdAndDelete(docId);
        
        // Se a busca falhou ou o documento não existe
        if (!docDeletado) {
            // A mensagem de erro que você recebeu é esta. 
            // O problema é que a sua função de busca anterior (interna) falhou
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `Documentação com ID ${docId} não encontrada.` 
            });
        }
        
        return res.status(200).json({ 
            sucesso: true, 
            mensagem: 'Documentação excluída com sucesso.', 
            dados: docDeletado // Retorna o documento que foi excluído
        });

    } catch (error) {
        console.error("Erro interno do servidor em deleteDoc:", error);
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor ao excluir documento.' });
    }
};

// EXPORTAÇÃO USANDO CHAVES
module.exports = {
    getAllDocs,
    getDocByIdentifier,
    createDoc,
    updateDoc,
    deleteDoc,
};