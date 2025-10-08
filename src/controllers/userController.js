const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models/user');
const secret = require('../utils/secret');


// ==========================================
// CRUD BÁSICO
// ==========================================

// Buscar todos os usuários
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-senha_usuario');
        res.status(200).json({ sucesso: true, users });
    } catch (error) {
        console.log('Erro ao buscar usuários:', error);
        res.status(500).json({ sucesso: false, msg: 'Erro ao buscar usuários' });
    }
};

// Buscar usuário por ID
const getUser = async (req, res) => {
    const id = req.params.id;
    
    try {
        const user = await User.findById(id, '-senha_usuario');
        if (!user) {
            return res.status(404).json({ sucesso: false, msg: 'Usuário não encontrado' });
        }
        res.status(200).json({ sucesso: true, user });
    } catch (error) {
        console.log('Erro ao buscar usuário:', error);
        res.status(500).json({ sucesso: false, msg: 'Erro ao buscar usuário' });
    }
};

// Atualizar usuário
const updateUser = async (req, res) => {
    const id = req.params.id;
    
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ sucesso: false, msg: 'Usuário não encontrado' });
        }

        // Se estiver atualizando senha, fazer hash
        if (req.body.senha_usuario) {
            const salt = await bcrypt.genSalt(12);
            req.body.senha_usuario = await bcrypt.hash(req.body.senha_usuario, salt);
        }

        await User.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json({ sucesso: true, msg: 'Usuário atualizado com sucesso' });
    } catch (error) {
        console.log('Erro ao atualizar usuário:', error);
        res.status(500).json({ sucesso: false, msg: 'Erro ao atualizar usuário' });
    }
};

// Deletar usuário
const deleteUser = async (req, res) => {
    const id = req.params.id;
    
    try {
        await User.findByIdAndDelete(id);
        res.status(200).json({ sucesso: true, msg: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.log('Erro ao deletar usuário:', error);
        res.status(500).json({ sucesso: false, msg: 'Erro ao deletar usuário' });
    }
};

// ==========================================
// AUTENTICAÇÃO
// ==========================================

// Criar usuário (apenas por admin via API direta)
const createUser = async (req, res) => {
    const { 
        nome_usuario,
        email_usuario, 
        telefone_usuario,
        data_nascimento_usuario,
        cargo_usuario,
        acessos_usuario,
        senha_usuario, 
        confirmarSenha 
    } = req.body;

    // Validação de senhas
    if (senha_usuario !== confirmarSenha) {
        return res.status(422).json({ sucesso: false, message: 'Senhas não conferem!' });
    }

    // Validação de campos obrigatórios
    const requiredFields = [nome_usuario, email_usuario, telefone_usuario, data_nascimento_usuario, cargo_usuario, acessos_usuario, senha_usuario];
    if (requiredFields.some(field => !field)) {
        return res.status(422).json({ sucesso: false, message: 'Todos os campos são obrigatórios!' });
    }

    // Validação de role
    if (!['adm', 'tecnico', 'visualizador'].includes(acessos_usuario)) {
        return res.status(422).json({ sucesso: false, message: 'Role inválida! Use: adm, tecnico ou visualizador' });
    }

    try {
        // Verificar se usuário já existe
        const userExists = await User.findOne({ email_usuario });
        if (userExists) {
            return res.status(422).json({ sucesso: false, message: 'Email já cadastrado!' });
        }

        // Hash da senha
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(senha_usuario, salt);
        
        // Criar usuário
        const user = new User({
            nome_usuario,
            email_usuario,
            telefone_usuario,
            data_nascimento_usuario,
            cargo_usuario,
            acessos_usuario,
            senha_usuario: passwordHash,
        });

        await user.save();
        res.status(201).json({ sucesso: true, msg: 'Usuário criado com sucesso' });
    } catch (error) {
        console.log('Erro ao criar usuário:', error); 
        res.status(500).json({ sucesso: false, msg: 'Erro ao criar usuário' });
    }
};

// Login
const loginUser = async (req, res) => {
    const { email_usuario, senha_usuario } = req.body;

    if (!email_usuario || !senha_usuario) {
        return res.status(422).json({ sucesso: false, message: 'Email e senha são obrigatórios!' });
    }

    try {
        const user = await User.findOne({ email_usuario });
        if (!user) {
            return res.status(404).json({ sucesso: false, message: 'Usuário não cadastrado!' });
        }

        const checkPassword = await bcrypt.compare(senha_usuario, user.senha_usuario);
        if (!checkPassword) {
            return res.status(422).json({ sucesso: false, message: 'Senha inválida!' });
        }

        // Criar token com role incluída
        const token = jwt.sign({ 
            id: user._id,
            role: user.acessos_usuario,
            email: user.email_usuario
        }, secret, {
            expiresIn: '8h'
        });

        res.status(200).json({
            sucesso: true,
            msg: 'Autenticação realizada com sucesso',
            token,
            user: {
                id: user._id,
                nome: user.nome_usuario,
                email: user.email_usuario,
                role: user.acessos_usuario,
                cargo: user.cargo_usuario
            }
        });
    } catch (error) {
        console.log('Erro ao autenticar:', error);
        res.status(500).json({ sucesso: false, msg: 'Erro ao autenticar usuário' });
    }
};

// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================

// Configurar transporte Nodemailer
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
});

// Template HTML para email
const getEmailTemplate = (codigo, nome, appName = 'Sistema de Documentação') => {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documentos 2000 - Recuperar Senha</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
            }
            .header {
                text-align: center;
                padding: 20px;
                background: linear-gradient(to right, #2563eb, #4f46e5);
                color: white;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 30px 20px;
            }
            .footer {
                text-align: center;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 0 0 8px 8px;
                font-size: 12px;
                color: #6c757d;
            }
            .code {
                font-size: 32px;
                font-weight: bold;
                background-color: #eff6ff;
                color: #2563eb;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 25px 0;
                letter-spacing: 5px;
                border: 2px dashed #93c5fd;
            }
            .warning {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 12px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .info {
                background-color: #dbeafe;
                border-left: 4px solid #3b82f6;
                padding: 12px;
                margin: 20px 0;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1> Documentos 2000</h1>
                <h2>Recuperação de Senha</h2>
            </div>
            <div class="content">
                <p>Olá, <strong>${nome}</strong></p>
                <p>Recebemos uma solicitação para recuperar a senha da sua conta.</p>
                
                <div class="warning">
                    <strong>⚠️ Atenção:</strong> Se você não solicitou esta recuperação, ignore este email e sua senha permanecerá inalterada.
                </div>
                
                <p>Use o código abaixo para redefinir sua senha:</p>
                
                <div class="code">${codigo}</div>
                
                <div class="info">
                    <strong>ℹ️ Importante:</strong> Este código expira em <strong>15 minutos</strong> por questões de segurança.
                </div>
                
                <p>Atenciosamente,<br><strong>Diego Salles</strong></p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} Documentos 2000. Todos os direitos reservados.</p>
                <p>Este é um email automático, por favor não responda.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Função para gerar código
const gerarCodigo = (length = 6) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        codigo += characters[randomIndex];
    }
    return codigo;
};

// Enviar código de recuperação
const sendRecoveryCode = async (req, res) => {
    const { email } = req.params;
    
    if (!email) {
        return res.status(400).json({ sucesso: false, msg: 'Email é obrigatório.' });
    }

    try {
        const user = await User.findOne({ email_usuario: email });
        
        if (!user) {
            return res.status(404).json({ sucesso: false, msg: 'Email não encontrado' });
        }
        
        // Gerar código e definir expiração (15 minutos)
        const codigo = gerarCodigo(6);
        const expiracao = new Date();
        expiracao.setMinutes(expiracao.getMinutes() + 15);
        
        user.codigoRecuperarSenha = codigo;
        user.codigoRecuperarSenhaExpira = expiracao;
        await user.save();
        
        // Configurar email
        const mailOptions = {
            from: `${process.env.APP_NAME || 'Sistema de Documentação'} <${process.env.EMAIL_USER}>`,
            to: user.email_usuario,
            subject: 'Recuperação de Senha - Código de Acesso',
            html: getEmailTemplate(codigo, user.nome_usuario, process.env.APP_NAME || 'Sistema de Documentação'),
            text: `Olá ${user.nome_usuario},\n\nCódigo de recuperação: ${codigo}\n\nEste código expira em 15 minutos.`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ sucesso: true, msg: 'Código enviado para o email com sucesso!' });
        
    } catch (error) {
        console.log('Erro ao enviar email:', error);
        res.status(500).json({ sucesso: false, msg: 'Erro ao enviar email de recuperação' });
    }
};

// Verificar código de recuperação
const verificarCodigo = async (req, res) => {
    const { email, codigo } = req.params;
    
    try {
        const user = await User.findOne({ email_usuario: email });
        if (!user) {
            return res.status(404).json({ sucesso: false, msg: 'Email não encontrado' });
        }

        // Verificar se o código existe
        if (!user.codigoRecuperarSenha) {
            return res.status(400).json({ sucesso: false, msg: 'Nenhum código de recuperação foi solicitado' });
        }

        // Verificar se o código expirou
        if (user.codigoRecuperarSenhaExpira && new Date() > user.codigoRecuperarSenhaExpira) {
            return res.status(400).json({ sucesso: false, msg: 'Código expirado. Solicite um novo código.' });
        }

        // Verificar se o código está correto
        if (user.codigoRecuperarSenha === codigo.toUpperCase()) {
            return res.status(200).json({ 
                sucesso: true,
                msg: 'Código verificado com sucesso!', 
                idUsuario: user._id 
            });
        } else {
            return res.status(400).json({ sucesso: false, msg: 'Código incorreto' });
        }
    } catch (error) {
        console.log('Erro ao verificar código:', error);
        res.status(500).json({ sucesso: false, msg: 'Erro ao verificar código' });
    }
};

// Atualizar senha via recuperação
const updatePasswordRecovery = async (req, res) => {
    const { email_usuario, codigoRecuperarSenha, senha_usuario, confirmarSenha } = req.body;

    // Validações
    if (!email_usuario || !codigoRecuperarSenha || !senha_usuario || !confirmarSenha) {
        return res.status(422).json({ sucesso: false, msg: 'Todos os campos são obrigatórios' });
    }

    if (senha_usuario !== confirmarSenha) {
        return res.status(422).json({ sucesso: false, msg: 'Senhas não conferem!' });
    }

    if (senha_usuario.length < 6) {
        return res.status(422).json({ sucesso: false, msg: 'A senha deve ter no mínimo 6 caracteres' });
    }

    try {
        const user = await User.findOne({ email_usuario });
        if (!user) {
            return res.status(404).json({ sucesso: false, msg: 'Usuário não encontrado' });
        }

        // Verificar se o código existe
        if (!user.codigoRecuperarSenha) {
            return res.status(400).json({ sucesso: false, msg: 'Nenhum código de recuperação foi solicitado' });
        }

        // Verificar se o código expirou
        if (user.codigoRecuperarSenhaExpira && new Date() > user.codigoRecuperarSenhaExpira) {
            return res.status(400).json({ sucesso: false, msg: 'Código expirado. Solicite um novo código.' });
        }

        // Verificar se o código está correto
        if (user.codigoRecuperarSenha !== codigoRecuperarSenha.toUpperCase()) {
            return res.status(400).json({ sucesso: false, msg: 'Código incorreto' });
        }

        // Hash da nova senha
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(senha_usuario, salt);

        // Atualizar senha e limpar código
        user.senha_usuario = passwordHash;
        user.codigoRecuperarSenha = undefined;
        user.codigoRecuperarSenhaExpira = undefined;
        await user.save();
        
        res.status(200).json({ sucesso: true, msg: 'Senha atualizada com sucesso!' });
    } catch (error) {
        console.log('Erro ao atualizar senha:', error);
        res.status(500).json({ sucesso: false, msg: 'Erro ao atualizar senha' });
    }
};

module.exports = {
    // CRUD
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    
    // Auth
    loginUser,
    
    // Recovery
    sendRecoveryCode,
    verificarCodigo,
    updatePasswordRecovery
};