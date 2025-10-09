// A API_USERS_URL deve ser o endpoint do seu backend para gerenciar usuários
// Se seu backend está em 172.16.50.20:1100, use o caminho completo para garantir que funcione, 
// caso contrário, mantenha o caminho relativo '/api/users'.
const API_USERS_URL = 'api/users'; 

// Estado Global
let userList = [];
let currentUserBeingEdited = null; // Guarda o ID do usuário em edição
let userModal; // Variável global para a instância do modal

// ==========================================================
// 1. FUNÇÃO DE VERIFICAÇÃO DE PERMISSÃO E INICIALIZAÇÃO
// ==========================================================

const checkAdminPermission = () => {
    // Reutiliza a função de autenticação do script.js (assumindo que está no escopo)
    const payload = checkAuthAndLoadUser(); 

    if (!payload) {
        return false;
    }

    const userRole = (payload.role || '').toLowerCase();
    const isAllowed = userRole === 'adm'; 

    const mainCard = document.getElementById('crud-container'); 
    const deniedMessage = document.getElementById('permission-denied');
    
    if (!isAllowed) {
        if (mainCard) mainCard.classList.add('d-none');
        if (deniedMessage) deniedMessage.classList.remove('d-none');
        return false;
    }
    
    if (mainCard) mainCard.classList.remove('d-none');
    fetchUserList();
    return true;
};


// ==========================================================
// 2. FUNÇÕES DE RENDERIZAÇÃO E MANIPULAÇÃO DA LISTA
// ==========================================================

/**
 * Renderiza a lista de usuários na tabela.
 */
const renderUserList = () => {
    const tbody = document.getElementById('user-list-body');
    tbody.innerHTML = ''; 
    
    if (userList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">Nenhum usuário cadastrado.</td></tr>';
        return;
    }

    userList.forEach(user => {
        const role = (user.acessos_usuario || 'visualizador').toUpperCase(); 
        const roleBadge = role === 'ADM' 
            ? '<span class="badge bg-danger">ADMIN</span>' 
            : `<span class="badge bg-secondary">${role}</span>`;

        // Aqui você pode adicionar lógica para formatar a data (se existir)
        const lastLogin = user.updatedAt 
             ? new Date(user.updatedAt).toLocaleDateString('pt-BR') 
             : 'N/A'; 

        const row = `
            <tr>
                <td>${user._id.substring(0, 8)}...</td>
                <td>${user.nome_usuario}</td>
                <td>${user.email_usuario || '-'}</td>
                <td>${user.cargo_usuario || '-'} | ${roleBadge}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-warning me-2 btn-edit-user" data-id="${user._id}" title="Editar">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-delete-user" data-id="${user._id}" title="Excluir">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    attachUserListListeners();
};

/**
 * Anexa listeners aos botões de Editar e Excluir.
 */
const attachUserListListeners = () => {
    // 1. ANEXANDO O CLIQUE DE EDIÇÃO
    document.querySelectorAll('.btn-edit-user').forEach(button => {
        // Garante que a função handleEditUser seja chamada com o ID do usuário
        button.onclick = () => handleEditUser(button.dataset.id); 
    });
    
    // 2. ANEXANDO O CLIQUE DE EXCLUSÃO
    document.querySelectorAll('.btn-delete-user').forEach(button => {
        button.onclick = () => handleDeleteUser(button.dataset.id);
    });
};


// ==========================================================
// 3. FUNÇÕES DE COMUNICAÇÃO COM A API (CRUD)
// ==========================================================

/**
 * Busca a lista de usuários (Apenas para Admin).
 */
const fetchUserList = async () => {
    const token = localStorage.getItem('token');
    document.getElementById('user-list-body').innerHTML = '<tr><td colspan="5" class="text-center text-primary p-4"><i class="fas fa-spinner fa-spin me-2"></i> Carregando lista de usuários...</td></tr>';
    
    try {
        const response = await fetch(API_USERS_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) {
             console.error('Acesso negado pela API.');
             checkAuthAndLoadUser(); 
             return;
        }

        const data = await response.json();
        
        if (data.sucesso) {
            userList = data.users || []; 
            renderUserList();
        } else {
            console.error('Erro ao buscar usuários:', data.msg);
            document.getElementById('user-list-body').innerHTML = `<tr><td colspan="5" class="text-center text-danger p-4">Erro: ${data.msg || 'Falha na comunicação com a API.'}</td></tr>`;
        }
    } catch (error) {
        console.error('Erro de rede ao carregar usuários:', error);
        document.getElementById('user-list-body').innerHTML = '<tr><td colspan="5" class="text-center text-danger p-4">Erro de Rede. Verifique o servidor.</td></tr>';
    }
};

/**
 * Inicia o modal para criar um novo usuário.
 */
const handleNewUser = () => {
    if (!userModal) {
        console.error("Modal não foi inicializado corretamente.");
        alert("Erro interno: Modal de usuário não está pronto.");
        return;
    }
    
    currentUserBeingEdited = null;
    document.getElementById('userEditorModalLabel').textContent = 'Criar Novo Usuário';
    document.    getElementById('user-form').reset();
    
    // ** CONFIGURAÇÃO PARA CRIAÇÃO (Senhas VISÍVEIS e OBRIGATÓRIAS) **
    const passwordContainer = document.getElementById('password-fields-container');
    if (passwordContainer) passwordContainer.classList.remove('d-none');
    
    document.getElementById('form-password').required = true; 
    document.getElementById('form-confirm-password').required = true; 
    
    document.getElementById('password-hint').textContent = '(Obrigatório. Mínimo 6 caracteres)';
    
    userModal.show();
};

/**
 * Inicia o modal para editar um usuário existente.
 */
const handleEditUser = (userId) => {
    if (!userModal) {
        console.error("Modal não foi inicializado corretamente.");
        alert("Erro interno: Modal de usuário não está pronto.");
        return;
    }

    const user = userList.find(u => String(u._id) === userId); 
    if (!user) {
        alert('Usuário não encontrado.');
        return;
    }

    currentUserBeingEdited = userId; 
    document.getElementById('userEditorModalLabel').textContent = `Editar Usuário: ${user.nome_usuario}`;
    
    // ** CONFIGURAÇÃO DE SEGURANÇA: OCULTA E DESOBRIGA CAMPOS DE SENHA **
    const passwordContainer = document.getElementById('password-fields-container');
    if (passwordContainer) {
        // Oculta o container inteiro no modo de edição
        passwordContainer.classList.add('d-none'); 
    }
    
    // Preenche o formulário com os DADOS DO USUÁRIO
    document.getElementById('form-username').value = user.nome_usuario;
    document.getElementById('form-email').value = user.email_usuario || ''; 
    document.getElementById('form-phone').value = user.telefone_usuario || ''; 

    // *** TRATAMENTO DA DATA (Corrigindo RangeError: Invalid time value) ***
    const dataNascimento = user.data_nascimento_usuario;
    if (dataNascimento) {
        const dateObj = new Date(dataNascimento);
        // Verifica se a data é válida
        if (!isNaN(dateObj) && dateObj.getFullYear() > 1900) { 
            // Formata para o padrão YYYY-MM-DD exigido pelo input type="date"
            document.getElementById('form-birthdate').value = dateObj.toISOString().split('T')[0];
        } else {
            document.getElementById('form-birthdate').value = ''; 
        }
    } else {
        document.getElementById('form-birthdate').value = ''; 
    }
    // *************************************************

    document.getElementById('form-job').value = user.cargo_usuario || ''; 
    document.getElementById('form-access').value = user.acessos_usuario || 'visualizador'; 
    
    // Remove o "required" e limpa os campos (embora ocultos)
    document.getElementById('form-password').required = false; 
    document.getElementById('form-confirm-password').required = false; 
    document.getElementById('form-password').value = ''; 
    document.getElementById('form-confirm-password').value = ''; 
    
    document.getElementById('password-hint').textContent = '(Senha não alterável neste modo)';
    
    userModal.show();
};

/**
 * Salva ou atualiza o usuário via modal.
 */
const handleSaveUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const isNew = !currentUserBeingEdited;
    const form = document.getElementById('user-form');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    // Coletando os valores com os IDs CORRETOS
    const userData = {
        nome_usuario: document.getElementById('form-username').value,
        email_usuario: document.getElementById('form-email').value,
        telefone_usuario: document.getElementById('form-phone').value,
        data_nascimento_usuario: document.getElementById('form-birthdate').value,
        cargo_usuario: document.getElementById('form-job').value,
        acessos_usuario: document.getElementById('form-access').value, 
        senha_usuario: document.getElementById('form-password').value 
    };

    // Lógica para Senha e Confirmação de Senha
    if (isNew) {
        userData.confirmarSenha = document.getElementById('form-confirm-password').value;
        
        // Validação de senhas correspondentes
        if (userData.senha_usuario !== userData.confirmarSenha) {
            alert('Erro: As senhas não coincidem!');
            return;
        }
    }
    
    // *** ESSENCIAL PARA EDIÇÃO: Remove a senha se estiver vazia (se o campo estava oculto, estará vazio) ***
    if (!userData.senha_usuario) {
        delete userData.senha_usuario;
    }

    // A rota PUT no seu backend não aceita 'confirmarSenha'
    if (!isNew) {
        delete userData.confirmarSenha;
    }

    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API_USERS_URL}/auth/register` : `${API_USERS_URL}/${currentUserBeingEdited}`; 
    
    try {
        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                // Apenas envia o token na edição (PUT), não no registro (POST)
                ...(isNew ? {} : {'Authorization': `Bearer ${token}`})
            },
            body: JSON.stringify(userData)
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error('Resposta não é JSON:', await response.text());
            alert(`Erro ${response.status}: Resposta inesperada do servidor. Verifique a rota.`);
            return;
        }

        if (data.sucesso) {
            alert(`Usuário ${isNew ? 'criado' : 'atualizado'} com sucesso!`);
            userModal.hide();
            fetchUserList();
        } else {
            alert(data.msg || data.message || 'Erro ao salvar usuário.');
        }
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        alert('Erro de rede ao salvar usuário.');
    }
};

/**
 * Exclui um usuário.
 */
const handleDeleteUser = async (userId) => {
    const token = localStorage.getItem('token');
    const user = userList.find(u => String(u._id) === userId); 
    
    if (!user || !confirm(`Deseja realmente excluir o usuário: ${user.nome_usuario}?`)) return;

    try {
        const response = await fetch(`${API_USERS_URL}/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.sucesso) {
            alert('Usuário excluído!');
            fetchUserList();
        } else {
            alert(data.msg || 'Erro ao excluir usuário.');
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
    }
};


// ==========================================================
// 4. INICIALIZAÇÃO E LISTENERS
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // *** INICIALIZAÇÃO ROBUSTA DO MODAL (Resolve o TypeError) ***
    const modalElement = document.getElementById('userEditorModal');
    
    // 1. Verifica se a biblioteca do Bootstrap e o elemento HTML existem
    if (typeof bootstrap !== 'undefined' && modalElement) {
        try {
            // Inicializa a variável global userModal
            userModal = new bootstrap.Modal(modalElement);
        } catch (e) {
            console.error("ERRO CRÍTICO ao criar bootstrap.Modal. Verifique o CDN do Bootstrap.", e);
        }
    } else {
        console.error("ERRO CRÍTICO: Elemento do Modal não encontrado OU Biblioteca Bootstrap não carregada.");
    }
    // *************************************************

    if (!checkAdminPermission()) {
        return; 
    }

    document.getElementById('btn-add-user').onclick = handleNewUser;
    
    // O botão de salvar do modal
    document.getElementById('user-form').addEventListener('submit', handleSaveUser);
});