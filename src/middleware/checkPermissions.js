const Documentation = require('../models/Documentation');

// Middleware para verificar se o usuário tem permissão de administrador
const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'adm') {
        return res.status(403).json({ 
            sucesso: false,
            mensagem: 'Acesso negado. Apenas administradores podem realizar esta ação.' 
        });
    }
    next();
};

// Middleware para verificar permissões de escrita (criar/editar/excluir)
const checkWritePermission = async (req, res, next) => {
    const { role, _id: userId } = req.user;
    
    // Administrador tem permissão total
    if (role === 'adm') {
        return next();
    }
    
    // Visualizador não pode fazer nada
    if (role === 'visualizador') {
        return res.status(403).json({ 
            sucesso: false,
            mensagem: 'Acesso negado. Você não tem permissão para modificar documentos.' 
        });
    }
    
    // Técnico pode criar novos documentos
    if (req.method === 'POST' && role === 'tecnico') {
        return next();
    }
    
    // Para PUT e DELETE, verificar se o técnico é o criador
    if ((req.method === 'PUT' || req.method === 'DELETE') && role === 'tecnico') {
        try {
            const identifier = req.params.identifier;
            const doc = await Documentation.findOne({ identificador: identifier });
            
            if (!doc) {
                return res.status(404).json({ 
                    sucesso: false,
                    mensagem: 'Documento não encontrado.' 
                });
            }
            
            // Verifica se o técnico é o criador
            if (doc.criadoPor.toString() !== userId.toString()) {
                return res.status(403).json({ 
                    sucesso: false,
                    mensagem: 'Acesso negado. Você só pode modificar documentos criados por você.' 
                });
            }
            
            next();
        } catch (error) {
            console.error('Erro ao verificar permissões:', error);
            return res.status(500).json({ 
                sucesso: false,
                mensagem: 'Erro ao verificar permissões.' 
            });
        }
    } else {
        return res.status(403).json({ 
            sucesso: false,
            mensagem: 'Acesso negado.' 
        });
    }
};

// Middleware para verificar permissões de leitura
const checkReadPermission = (req, res, next) => {
    // Todos os roles autenticados podem ler
    if (['adm', 'tecnico', 'visualizador'].includes(req.user.role)) {
        return next();
    }
    
    return res.status(403).json({ 
        sucesso: false,
        mensagem: 'Acesso negado.' 
    });
};

module.exports = {
    checkAdmin,
    checkWritePermission,
    checkReadPermission
};