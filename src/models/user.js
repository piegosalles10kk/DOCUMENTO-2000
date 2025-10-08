const mongoose = require('mongoose');

// Esquema para Usuários
const UserSchema = new mongoose.Schema({
    nome_usuario: { type: String, required: true },
    email_usuario: { type: String, required: true, unique: true },
    telefone_usuario: { type: Number, required: true },
    data_nascimento_usuario: { type: String, required: true },
    cargo_usuario: { type: String, required: true},
    
    // ROLES: adm, tecnico, visualizador
    acessos_usuario: { 
        type: String, 
        required: true,
        enum: ['adm', 'tecnico', 'visualizador'],
        default: 'visualizador'
    },    

    // Processo de recuperação de senha
    senha_usuario : { type: String, required: true },
    codigoRecuperarSenha: { type: String, required: false },
    codigoRecuperarSenhaExpira: { type: Date, required: false },
    
}, { timestamps: true });

// Modelos
const User = mongoose.model('User', UserSchema);

// Exportação dos Modelos
module.exports = {
    User
};