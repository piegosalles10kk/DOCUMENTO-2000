const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models/model');
const { secret } = require('../utils/secret');


// ==========================================
// CRUD BÁSICO
// ==========================================

// Buscar todos os usuários
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-senha');
        res.status(200).json({ users });
    } catch (error) {
        console.log('Erro ao buscar usuários:', error);
        res.status(500).json({ msg: 'Erro ao buscar usuários' });
    }
};

// Buscar usuário por ID
const getUser = async (req, res) => {
    const id = req.params.id;
    
    try {
        const user = await User.findById(id, '-senha');
        if (!user) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.log('Erro ao buscar usuário:', error);
        res.status(500).json({ msg: 'Erro ao buscar usuário' });
    }
};

// Atualizar usuário
const updateUser = async (req, res) => {
    const id = req.params.id;
    
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        await User.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json({ msg: 'Usuário atualizado com sucesso' });
    } catch (error) {
        console.log('Erro ao atualizar usuário:', error);
        res.status(500).json({ msg: 'Erro ao atualizar usuário' });
    }
};

// Deletar usuário
const deleteUser = async (req, res) => {
    const id = req.params.id;
    
    try {
        await User.findByIdAndDelete(id);
        res.status(200).json({ msg: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.log('Erro ao deletar usuário:', error);
        res.status(500).json({ msg: 'Erro ao deletar usuário' });
    }
};

// ==========================================
// AUTENTICAÇÃO
// ==========================================

// Criar usuário
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

    // ✅ Correção: Validação de senhas mais clara
    if (senha_usuario !== confirmarSenha) {
        return res.status(422).json({ message: 'Senhas não conferem!' });
    }

    // ✅ Correção: Validação de campos obrigatórios mais clara
    const requiredFields = [nome_usuario, email_usuario, telefone_usuario, data_nascimento_usuario, cargo_usuario, acessos_usuario, senha_usuario];
    if (requiredFields.some(field => !field)) {
        return res.status(422).json({ message: 'Todos os campos são obrigatórios!' });
    }

    try {
        // Verificar se usuário já existe
        const userExists = await User.findOne({ email_usuario });
        if (userExists) {
            return res.status(422).json({ message: 'Email já cadastrado!' });
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
        res.status(201).json({ msg: 'Usuário criado com sucesso' });
    } catch (error) {
        console.log('Erro ao criar usuário:', error); 
        res.status(500).json({ msg: 'Erro ao criar usuário' });
    }
};

// Login
const loginUser = async (req, res) => {
    const { email_usuario, senha_usuario } = req.body;

    if (!email_usuario || !senha_usuario) {
        return res.status(422).json({ message: 'Email e senha são obrigatórios!' });
    }

    try {
        const user = await User.findOne({ email_usuario });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não cadastrado!' });
        }

        const checkPassword = await bcrypt.compare(senha_usuario, user.senha_usuario);
        if (!checkPassword) {
            return res.status(422).json({ message: 'Senha inválida!' });
        }

        // ✅ Correção: Usando a variável 'secret' importada
        const token = jwt.sign({ id: user._id }, secret, {
            expiresIn: '1d'
        });

        res.status(200).json({
            msg: 'Autenticação realizada com sucesso',
            token,
            id: user._id
        });
    } catch (error) {
        console.log('Erro ao autenticar:', error);
        res.status(500).json({ msg: 'Erro ao autenticar usuário' });
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
        user: 'chamadoschromatox@gmail.com', 
        pass: 'glsdpiqtmubibzzf', 
    },
});

// Template HTML simples para email
const getEmailTemplate = (codigo, appName = 'Template') => {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${appName} - Recuperar Senha</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                width: 100%;
                padding: 20px;
                background-color: #ffffff;
            }
            .header {
                text-align: center;
                padding: 20px;
                background-color: #007bff;
                color: white;
            }
            .content {
                padding: 20px;
            }
            .footer {
                text-align: center;
                padding: 10px;
                background-color: #dddddd;
                font-size: 12px;
                color: #555555;
            }
            .code {
                font-size: 24px;
                font-weight: bold;
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                text-align: center;
                margin: 20px 0;
                letter-spacing: 2px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${appName}</h1>
                <h2>Recuperar Senha</h2>
            </div>
            <div class="content">
                <p>Olá,</p>
                <p>Foi solicitada uma recuperação de senha para sua conta.</p>
                <p><strong>Caso não tenha sido você, ignore este email.</strong></p>
                <p>Código de acesso:</p>
                <div class="code">${codigo}</div>
                <p>Este código expira em 15 minutos.</p>
                <p>Atenciosamente,<br>Equipe ${appName}</p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} ${appName}. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Função para gerar código
const gerarCodigo = (length = 6) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let codigo = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        codigo += characters[randomIndex];
    }
    return codigo;
};

// No seu arquivo userControllers.js
const sendRecoveryCode = async (req, res) => {
    // ✅ CORREÇÃO: Pega o parâmetro 'email' da rota
    const { email } = req.params;
    
    if (!email) {
        return res.status(400).json({ msg: 'Email é obrigatório e deve ser passado na URL.' });
    }

    try {
        // ✅ CORREÇÃO: Usa 'email' para buscar no banco de dados
        const user = await User.findOne({ email_usuario: email });
        
        if (!user) {
            return res.status(404).json({ msg: 'Email não encontrado' });
        }
        
        // ... o restante do código segue inalterado
        const testeCodigo = gerarCodigo(6);
        user.codigoRecuperarSenha = testeCodigo;
        await user.save();
        
        const mailOptions = {
            from: `Sua App <chamadoschromatox@gmail.com>`,
            to: user.email_usuario,
            subject: 'Recuperar Senha',
            html: getEmailTemplate(testeCodigo, 'Sua App'),
            text: `Código de recuperação: ${testeCodigo}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ msg: 'Email enviado com sucesso!' });
        
    } catch (error) {
        console.log('Erro ao enviar email:', error);
        res.status(500).json({ msg: 'Erro ao enviar email' });
    }
};

// Verificar código de recuperação
const verificarCodigo = async (req, res) => {
    const { email, codigo } = req.params;
    
    try {
        const user = await User.findOne({ email_usuario: email });
        if (!user) {
            return res.status(404).json({ msg: 'Email não encontrado' });
        }
        if (user.codigoRecuperarSenha === codigo) {
            return res.status(200).json({ 
                msg: 'Código verificado com sucesso!', 
                idUsuario: user._id 
            });
        } else {
            return res.status(400).json({ msg: 'Código incorreto' });
        }
    } catch (error) {
        console.log('Erro ao verificar código:', error);
        res.status(500).json({ msg: 'Erro ao verificar código' });
    }
};

// Atualizar senha via recuperação
const updatePasswordRecovery = async (req, res) => {
    const { email_usuario, codigoRecuperarSenha, senha_usuario, confirmarSenha } = req.body;

    if (!senha_usuario || senha_usuario !== confirmarSenha) {
        return res.status(422).json({ msg: 'Senhas não conferem!' });
    }

    try {
        const user = await User.findOne({ email_usuario });
        if (!user) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }
        if (user.codigoRecuperarSenha !== codigoRecuperarSenha) {
            return res.status(400).json({ msg: 'Código incorreto' });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(senha_usuario, salt);

        // ✅ Correção: Usando o campo correto do modelo 'senha_usuario'
        user.senha_usuario = passwordHash;
        user.codigoRecuperarSenha = undefined;
        await user.save();
        res.status(200).json({ msg: 'Senha atualizada com sucesso!' });
    } catch (error) {
        console.log('Erro ao atualizar senha:', error);
        res.status(500).json({ msg: 'Erro ao atualizar senha' });
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