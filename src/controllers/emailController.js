const nodemailer = require('nodemailer');
const { User } = require('../models/model');


// Função para gerar código (igual à sua)
const gerarCodigo = (length = 6) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let codigo = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        codigo += characters[randomIndex];
    }
    return codigo;
};

// Configurar transporte Nodemailer para Gmail
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


// Enviar email de recuperação
const sendEmail = async (req, res) => {
    const email = req.params.email;
    
    try {
        // Buscar usuário
        const user = await User.findOne({ email_usuario });
        if (!user) {
            return res.status(404).json({ msg: 'Email não encontrado' });
        }

        // Gerar código
        const testeCodigo = gerarCodigo(6);

        // Salvar código no usuário
        user.codigoRecuperarSenha = testeCodigo;
        await user.save();

        // Configurar email
        const transport = transporter();
        
        const mailOptions = {
            from: `Sua App <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Recuperar Senha',
            html: getEmailTemplate(testeCodigo, 'Sua App'),
            text: `Código de recuperação: ${testeCodigo}`
        };

        // Enviar email
        await transport.sendMail(mailOptions);

        res.status(200).json({ msg: 'Email enviado com sucesso!' });
    } catch (error) {
        console.log('Erro ao enviar email:', error);
        res.status(500).json({ msg: 'Erro ao enviar email' });
    }
};

// Verificar código (igual ao seu)
const verificarCodigo = async (req, res) => {
    const { email, codigo } = req.params;

    try {
        const user = await User.findOne({ email_usuario });
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

module.exports = { 
    sendEmail, 
    verificarCodigo 
};