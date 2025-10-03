const API_URL = '/api/docs';

// ==========================================================
// ESTADO GLOBAL DA APLICAÇÃO
// ==========================================================
let documents = [];
let currentDoc = null; // Identificador do documento que está sendo editado (string)
let isEditing = false;
let activeTab = 'list';
let formData = {
    tituloDocumento: '',
    identificador: '',
    secoes: [] 
};

// Variáveis para rastrear o bloco ou seção sendo editado(a) nos Modals
let currentSectionIndex = -1;
let currentBlockIndex = -1;

// Instâncias dos Modals
let blockModal;
let sectionModal;


// Mapeamento dos tipos de bloco para ícones e títulos no dropdown
const BLOCK_TYPES = {
    textoBruto: { label: '📝 Texto Simples / Descrição', icon: 'fas fa-align-left' },
    detalhes: { label: '📋 Detalhes (Rótulo/Valor)', icon: 'fas fa-list' },
    credenciais: { label: '🔐 Credenciais de Acesso', icon: 'fas fa-lock' },
    blocoCodigo: { label: '💻 Código/Comandos', icon: 'fas fa-code' },
    imagem: { label: '🖼️ Imagem (URL)', icon: 'fas fa-image' },
    mapaRede: { label: '🗺️ Diagrama/Mapa de Rede', icon: 'fas fa-sitemap' }
};

// ==========================================================
// FUNÇÕES DE UTILIDADE E RENDERIZAÇÃO GERAL
// ==========================================================

/**
 * Atualiza o estado global e o campo do formulário de edição principal.
 */
const updateFormData = (field, value) => {
    formData[field] = value;
    const element = document.getElementById(field);
    if (element) {
        element.value = value;
    }
};

/**
 * Alterna entre as abas e atualiza o estado de edição.
 */
const switchTab = (tabName) => {
    activeTab = tabName;
    const listTabElement = document.getElementById('list-tab');
    const editTabElement = document.getElementById('edit-tab');
    const editTabItemElement = document.getElementById('edit-tab-item');

    // 1. Mostrar/Esconder a aba "Editar" e muda seu título
    if (isEditing) {
        editTabItemElement.classList.remove('d-none');
        document.getElementById('edit-tab-title').textContent = currentDoc ? '✏️ Editar Documento' : '➕ Novo Documento';
    } else {
        editTabItemElement.classList.add('d-none');
    }

    // 2. Mudar a aba ativa usando a API do Bootstrap
    if (tabName === 'edit' && isEditing && editTabElement) {
        const bsEditTab = new bootstrap.Tab(editTabElement);
        bsEditTab.show();
    } else if (listTabElement) {
        const bsListTab = new bootstrap.Tab(listTabElement);
        bsListTab.show();
        // Quando volta para a lista, limpa a pesquisa e re-renderiza a lista completa
        document.getElementById('search-input').value = '';
        document.getElementById('clear-search-btn').style.display = 'none';
        renderDocumentList();
    }
};


// --- FUNÇÕES DE CARREGAMENTO E MANIPULAÇÃO DE DADOS ---

/**
 * Carrega a lista de documentos da API. (MANTIDA)
 */
const fetchDocuments = async () => {
    const listContainer = document.getElementById('document-list-container');
    const loadingMessage = document.getElementById('loading-message');
    const emptyMessage = document.getElementById('empty-list-message');

    listContainer.innerHTML = ''; // Limpa a lista
    loadingMessage.classList.remove('d-none');
    emptyMessage.classList.add('d-none');

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.sucesso) {
            documents = data.dados;
            // A renderização inicial será com a lista completa
            renderDocumentList(documents); 
        }
    } catch (error) {
        console.error('Erro ao carregar documentos:', error);
    } finally {
        loadingMessage.classList.add('d-none');
        // A lógica de lista vazia foi transferida para renderDocumentList
    }
};

// ==========================================================
// FUNÇÃO CENTRAL DA PESQUISA (NOVA)
// ==========================================================

/**
 * Filtra a lista de documentos com base no texto de pesquisa.
 */
const filterDocumentList = (searchText) => {
    const term = searchText.toLowerCase().trim();
    
    // Se o termo estiver vazio, renderiza a lista completa
    if (!term) {
        renderDocumentList(documents);
        document.getElementById('clear-search-btn').style.display = 'none';
        return;
    }

    // Mostra o botão de limpar
    document.getElementById('clear-search-btn').style.display = 'block';

    // Filtra os documentos
    const filteredDocs = documents.filter(doc => {
        const titleMatch = doc.tituloDocumento.toLowerCase().includes(term);
        const idMatch = doc.identificador.toLowerCase().includes(term);
        // Opcional: Adicionar busca por conteúdo da seção/bloco se a estrutura for grande
        // const contentMatch = JSON.stringify(doc.secoes).toLowerCase().includes(term); 
        return titleMatch || idMatch; // || contentMatch
    });

    renderDocumentList(filteredDocs);
};

// ==========================================================
// RENDERIZAÇÃO DA LISTA DE DOCUMENTOS (MODIFICADA)
// ==========================================================

/**
 * Renderiza a lista de documentos. Agora aceita uma lista para ser renderizada (filtrada ou completa).
 * @param {Array} listToRender - A lista de documentos a ser exibida.
 */
const renderDocumentList = (listToRender = documents) => {
    const listContainer = document.getElementById('document-list-container');
    const emptyMessage = document.getElementById('empty-list-message');
    listContainer.innerHTML = ''; // Limpa a lista
    
    const isFiltered = listToRender.length !== documents.length || document.getElementById('search-input').value.trim() !== '';

    if (listToRender.length === 0) {
        if (!isFiltered) {
            // Lista completa está vazia
            emptyMessage.classList.remove('d-none');
        } else {
            // Lista filtrada está vazia, mostra mensagem de "Nenhum resultado"
            emptyMessage.classList.remove('d-none');
            // Altera o conteúdo da mensagem de lista vazia para pesquisa
            emptyMessage.innerHTML = `
                <p class="h5 mb-4 text-muted">🔎 Nenhum resultado encontrado para a pesquisa.</p>
                <button id="btn-create-first" class="btn btn-primary btn-lg d-none">
                    Criar Primeiro Documento
                </button>
            `;
            // Re-anexa o listener ao botão (apesar de estar escondido, a prática é boa)
            document.getElementById('btn-create-first').onclick = handleNewDocument;
        }
        listContainer.classList.add('d-none');
        return;
    }
    
    // Se há itens, remove a mensagem de lista vazia
    emptyMessage.classList.add('d-none');
    
    // Restaura a mensagem original da lista vazia se for removida
    emptyMessage.innerHTML = `
        <p class="h5 mb-4 text-muted">📭 Nenhum documento cadastrado</p>
        <button id="btn-create-first" class="btn btn-primary btn-lg">
            Criar Primeiro Documento
        </button>
    `;
    document.getElementById('btn-create-first').onclick = handleNewDocument;
    
    listContainer.classList.remove('d-none');

    let listHtml = '';
    listToRender.forEach(doc => {
        const lastUpdated = new Date(doc.ultimaAtualizacao || Date.now()).toLocaleString('pt-BR');
        listHtml += `
            <div class="col-12">
                <div class="card shadow-sm border-0 document-item" data-title="${doc.tituloDocumento}" data-id="${doc.identificador}">
                    <div class="card-body d-flex justify-content-between align-items-center p-3">
                        <div>
                            <h5 class="card-title mb-1">${doc.tituloDocumento}</h5>
                            <p class="card-subtitle text-muted mb-0">ID: ${doc.identificador}</p>
                            <small class="text-secondary">Última atualização: ${lastUpdated}</small>
                        </div>
                        <div class="btn-group" role="group">
                            <a href="/render/${doc.identificador}" target="_blank" class="btn btn-info btn-sm" title="Visualizar">
                                <i class="fas fa-file-text"></i>
                            </a>
                            <button class="btn btn-warning btn-sm btn-edit-doc" data-id="${doc.identificador}" title="Editar">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn btn-danger btn-sm btn-delete-doc" data-id="${doc.identificador}" title="Excluir">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = listHtml;
    
    // Anexar Listeners para botões da lista (Editar e Excluir)
    document.querySelectorAll('.btn-edit-doc').forEach(button => {
        button.onclick = () => handleEditDocument(button.dataset.id);
    });
    document.querySelectorAll('.btn-delete-doc').forEach(button => {
        button.onclick = () => handleDeleteDocument(button.dataset.id);
    });
};

// Restante das funções de editor (handleNewDocument, handleEditDocument, handleSaveDocument, 
// handleDeleteDocument, addSection, removeSection, handleEditSection, handleSaveSectionModal, 
// addBlock, removeBlock, handleEditBlock, handleSaveBlockModal, addDetail, removeDetail, 
// renderDetailEditorInModal, renderBlockEditor, renderSectionEditor, attachDynamicListeners) 
// permanecem inalteradas, exceto a chamada a renderDocumentList que agora deve ser renderDocumentList() 
// para usar a lista global 'documents'. (Já ajustado em fetchDocuments e switchTab).


/**
 * Inicia o modo de criação de novo documento. (MANTIDA)
 */
const handleNewDocument = () => {
    // 1. Resetar o formulário
    formData = {
        tituloDocumento: '',
        identificador: '',
        secoes: [] // Inicia vazia
    };
    
    // 2. Limpar campos principais do DOM e habilitar o identificador
    document.getElementById('tituloDocumento').value = '';
    document.getElementById('identificador').value = '';
    document.getElementById('identificador').disabled = false; 

    // 3. Atualizar estados de edição
    currentDoc = null;
    isEditing = true;
    
    // 4. Renderizar o editor de seções vazio
    renderSections(); 
    
    // 5. Mudar para a aba de edição
    switchTab('edit');
};

/**
 * Carrega um documento existente para edição. (MANTIDA)
 */
const handleEditDocument = async (identifier) => {
    try {
        const response = await fetch(`${API_URL}/id/${identifier}`);
        const data = await response.json();
        
        if (data.sucesso) {
            // Atualiza o estado
            formData = {
                tituloDocumento: data.dados.tituloDocumento,
                identificador: data.dados.identificador,
                // A estrutura de 'secoes' carregada da API já está no novo formato (com 'blocos')
                secoes: data.dados.secoes || [] 
            };
            currentDoc = identifier;
            isEditing = true;

            // Preenche campos principais
            document.getElementById('tituloDocumento').value = formData.tituloDocumento;
            document.getElementById('identificador').value = formData.identificador;
            document.getElementById('identificador').disabled = true; 
            
            renderSections();
            switchTab('edit');
        } else {
            alert(data.mensagem || 'Documento não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao carregar documento:', error);
        alert('Erro ao carregar documento para edição.');
    }
};

/**
 * Salva ou atualiza um documento. (MANTIDA)
 */
const handleSaveDocument = async () => {
    // Validação básica
    if (!formData.tituloDocumento || !formData.identificador) {
        alert('Preencha o Título e o Identificador do documento.');
        return;
    }

    const method = currentDoc ? 'PUT' : 'POST';
    const url = currentDoc ? `${API_URL}/${currentDoc}` : API_URL;

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.sucesso) {
            alert('Documento salvo com sucesso!');
            await fetchDocuments();
            // Volta para a lista
            isEditing = false;
            currentDoc = null;
            switchTab('list');
        } else {
            alert(data.mensagem || 'Erro ao salvar documento');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar documento');
    }
};

/**
 * Exclui um documento. (MANTIDA)
 */
const handleDeleteDocument = async (identifier) => {
    if (!confirm('Deseja realmente excluir este documento?')) return;

    try {
        const response = await fetch(`${API_URL}/${identifier}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.sucesso) {
            alert('Documento excluído!');
            fetchDocuments();
        } else {
            alert(data.mensagem || 'Erro ao excluir documento');
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir documento');
    }
};

// ------------------- Funções de Seção -------------------

/**
 * Adiciona uma nova seção ao formulário.
 */
const addSection = () => {
    formData.secoes.push({
        tituloSecao: `Nova Seção ${formData.secoes.length + 1}`,
        subtituloSecao: '',
        blocos: [
            {
                tipoBloco: 'textoBruto',
                tituloBloco: 'Primeiro Bloco de Texto',
                descricaoBloco: 'Edite esta seção e bloco para começar a documentar.',
                valorBruto: '' 
            }
        ],
        secoesAninhadas: []
    });
    renderSections();
};

/**
 * Remove uma seção do formulário.
 */
const removeSection = (sectionIndex) => {
    if (confirm(`Deseja realmente remover a seção "${formData.secoes[sectionIndex].tituloSecao || `Seção ${sectionIndex + 1}`}" e todo o seu conteúdo?`)) {
        formData.secoes.splice(sectionIndex, 1);
        renderSections();
    }
};

/**
 * Abre o modal de edição de seção. (NOVA)
 */
const handleEditSection = (sectionIndex) => {
    currentSectionIndex = sectionIndex;
    const section = formData.secoes[sectionIndex];
    
    // Preenche o modal
    document.getElementById('section-tituloSecao').value = section.tituloSecao || '';
    document.getElementById('section-subtituloSecao').value = section.subtituloSecao || '';
    
    // Altera o título do modal
    document.getElementById('sectionEditorModalLabel').textContent = section.tituloSecao ? `✏️ Editar Seção: ${section.tituloSecao}` : '✏️ Editar Nova Seção';

    sectionModal.show();
};

/**
 * Salva os dados do modal de seção de volta ao formData. (NOVA)
 */
const handleSaveSectionModal = () => {
    const sectionIndex = currentSectionIndex;
    const titulo = document.getElementById('section-tituloSecao').value;
    const subtitulo = document.getElementById('section-subtituloSecao').value;
    
    if (!titulo) {
        alert('O Título da Seção é obrigatório.');
        return;
    }

    formData.secoes[sectionIndex].tituloSecao = titulo;
    formData.secoes[sectionIndex].subtituloSecao = subtitulo;

    sectionModal.hide();
    renderSections(); // Re-renderiza para atualizar os títulos no painel principal
};


// ------------------- Funções de Bloco -------------------

/**
 * Adiciona um novo bloco de conteúdo a uma seção.
 */
const addBlock = (sectionIndex, type) => {
    let newBlock = {
        tipoBloco: type,
        tituloBloco: '',
        descricaoBloco: '',
        // Adiciona campos específicos por tipo
        ...(type === 'detalhes' || type === 'credenciais' ? { detalhes: [] } : {}),
        ...(type === 'imagem' ? { urlImagem: '', altImagem: '', valorBruto: '' } : { valorBruto: '' }),
    };

    formData.secoes[sectionIndex].blocos.push(newBlock);
    renderSections();
};

/**
 * Remove um bloco de conteúdo de uma seção.
 */
const removeBlock = (sectionIndex, blockIndex) => {
    if (confirm('Deseja realmente remover este bloco de conteúdo?')) {
        formData.secoes[sectionIndex].blocos.splice(blockIndex, 1);
        renderSections();
    }
};

/**
 * Abre o modal de edição de bloco e preenche os campos. (NOVA E PRINCIPAL)
 */
const handleEditBlock = (sectionIndex, blockIndex) => {
    currentSectionIndex = sectionIndex;
    currentBlockIndex = blockIndex;
    const block = formData.secoes[sectionIndex].blocos[blockIndex];
    
    // Limpa campos específicos
    document.querySelectorAll('.content-specific-field').forEach(div => div.classList.add('d-none'));

    // 1. Preenche campos comuns (subtítulos modulares)
    document.getElementById('blockEditorModalLabel').textContent = block.tituloBloco ? `⚙️ Editar Bloco: ${block.tituloBloco}` : `⚙️ Editar Bloco de ${BLOCK_TYPES[block.tipoBloco].label}`;
    document.getElementById('block-tipoBloco').value = block.tipoBloco;
    document.getElementById('block-tipoBloco').disabled = true; // Tipo não pode ser alterado após a criação
    document.getElementById('block-tituloBloco').value = block.tituloBloco || '';
    document.getElementById('block-descricaoBloco').value = block.descricaoBloco || '';
    
    // 2. Preenche campos específicos
    switch (block.tipoBloco) {
        case 'textoBruto':
        case 'blocoCodigo':
        case 'mapaRede':
            document.getElementById('content-valorBruto').classList.remove('d-none');
            document.getElementById('label-valorBruto').textContent = block.tipoBloco === 'textoBruto' ? 'Conteúdo Principal (Texto Simples) *' : (block.tipoBloco === 'blocoCodigo' ? 'Código/Comandos *' : 'Mapa de Rede/Diagrama (ASCII) *');
            document.getElementById('block-valorBruto').value = block.valorBruto || '';
            break;
            
        case 'detalhes':
        case 'credenciais':
            document.getElementById('content-detalhes').classList.remove('d-none');
            // Renderiza o editor de detalhes dentro do Modal
            renderDetailEditorInModal(block, sectionIndex, blockIndex); 
            break;
            
        case 'imagem':
            document.getElementById('content-imagem').classList.remove('d-none');
            document.getElementById('content-valorBruto').classList.remove('d-none'); // Texto adicional
            document.getElementById('label-valorBruto').textContent = 'Texto Adicional (Opcional)';
            document.getElementById('block-urlImagem').value = block.urlImagem || '';
            document.getElementById('block-altImagem').value = block.altImagem || '';
            document.getElementById('block-valorBruto').value = block.valorBruto || '';
            break;
    }

    blockModal.show();
};

/**
 * Salva os dados do modal de bloco de volta ao formData. (NOVA)
 */
const handleSaveBlockModal = () => {
    const sectionIndex = currentSectionIndex;
    const blockIndex = currentBlockIndex;
    const block = formData.secoes[sectionIndex].blocos[blockIndex];

    // 1. Salva campos comuns
    block.tituloBloco = document.getElementById('block-tituloBloco').value;
    block.descricaoBloco = document.getElementById('block-descricaoBloco').value;

    // 2. Salva campos específicos
    switch (block.tipoBloco) {
        case 'textoBruto':
        case 'blocoCodigo':
        case 'mapaRede':
            block.valorBruto = document.getElementById('block-valorBruto').value;
            break;
            
        case 'detalhes':
        case 'credenciais':
            // Os detalhes já foram atualizados no formData via `updateDetail` no `oninput`
            // Nada a fazer aqui.
            break;
            
        case 'imagem':
            block.urlImagem = document.getElementById('block-urlImagem').value;
            block.altImagem = document.getElementById('block-altImagem').value;
            block.valorBruto = document.getElementById('block-valorBruto').value;
            break;
    }
    
    // Opcional: Revalidação (ex: campo valorBruto para texto simples não deve ser vazio)
    if ((block.tipoBloco === 'textoBruto' || block.tipoBloco === 'blocoCodigo' || block.tipoBloco === 'mapaRede') && !block.valorBruto) {
        // Alerta não-bloqueante para evitar perda de dados no modal
        console.warn('Conteúdo principal vazio.');
    }

    blockModal.hide();
    renderSections();
};


// ------------------- Funções de Detalhe (Aninhadas) -------------------

/**
 * Adiciona um par Rótulo:Valor (Detalhe) a um bloco (NOVA: Usada apenas dentro do Modal).
 */
const addDetail = () => {
    const block = formData.secoes[currentSectionIndex].blocos[currentBlockIndex];
    if (!block.detalhes) {
        block.detalhes = [];
    }
    block.detalhes.push({ rotulo: '', valor: '' });
    // Re-renderiza o editor de detalhes (dentro do modal)
    renderDetailEditorInModal(block, currentSectionIndex, currentBlockIndex); 
};

/**
 * Remove um par Rótulo:Valor (Detalhe) de um bloco (NOVA: Usada apenas dentro do Modal).
 */
const removeDetail = (detailIndex) => {
    const block = formData.secoes[currentSectionIndex].blocos[currentBlockIndex];
    block.detalhes.splice(detailIndex, 1);
    // Re-renderiza o editor de detalhes (dentro do modal)
    renderDetailEditorInModal(block, currentSectionIndex, currentBlockIndex);
};

/**
 * Atualiza um par Rótulo:Valor (Detalhe) dentro de um bloco.
 * É global para ser usado com oninput. (MANTIDA)
 */
window.updateDetail = (sectionIndex, blockIndex, detailIndex, field, value) => {
    // Note que esta função usa os índices passados no HTML, não o estado global `current...Index`
    formData.secoes[sectionIndex].blocos[blockIndex].detalhes[detailIndex][field] = value;
};


// ------------------- Funções de Renderização do Editor Modular -------------------

/**
 * Renderiza o editor de detalhes DENTRO do Modal. (MODIFICADA)
 * @param {object} block
 * @param {number} sectionIndex
 * @param {number} blockIndex
 */
const renderDetailEditorInModal = (block, sectionIndex, blockIndex) => {
    const detailsContainer = document.getElementById('detalhes-list');
    const details = block.detalhes || [];
    const isCredencial = block.tipoBloco === 'credenciais';
    let html = '';

    if (details.length === 0) {
        detailsContainer.innerHTML = '<p class="text-center text-muted m-0" id="empty-detalhes-message">Nenhum detalhe adicionado.</p>';
        return;
    }

    details.forEach((detail, detailIndex) => {
        // Passa os índices do formData para o updateDetail
        html += `
            <div class="input-group mb-2 detail-row">
                <input type="text" class="form-control form-control-sm" placeholder="Rótulo (ex: Usuário / IP)" 
                        value="${detail.rotulo || ''}" 
                        oninput="window.updateDetail(${sectionIndex}, ${blockIndex}, ${detailIndex}, 'rotulo', this.value)">
                <input type="text" class="form-control form-control-sm" placeholder="Valor (ex: admin / 192.168.1.1)" 
                        value="${detail.valor || ''}" 
                        oninput="window.updateDetail(${sectionIndex}, ${blockIndex}, ${detailIndex}, 'valor', this.value)">
                <button class="btn btn-sm btn-outline-danger btn-remove-detail-modal" type="button" 
                        data-detail-index="${detailIndex}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });

    detailsContainer.innerHTML = html;
    
    // Listener para remover detalhe no Modal (usa o removeDetail simplificado)
    document.querySelectorAll('.btn-remove-detail-modal').forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            const detailIndex = parseInt(button.dataset.detailIndex);
            removeDetail(detailIndex); // Chama a função que re-renderiza o modal de detalhes
        };
    });
};

/**
 * Renderiza o cartão de um bloco no editor principal (apenas visualização/botão de edição). (MANTIDA)
 */
const renderBlockEditor = (block, sectionIndex, blockIndex) => {
    const type = block.tipoBloco;
    const uniqueId = `sec${sectionIndex}-block${blockIndex}`;
    
    const blockTitle = block.tituloBloco || BLOCK_TYPES[type].label;
    const blockDescription = block.descricaoBloco ? `<p class="mb-0 text-muted"><small>${block.descricaoBloco}</small></p>` : '';

    return `
        <div class="block-item border p-3 mb-3 bg-white rounded shadow-sm d-flex justify-content-between align-items-center" id="${uniqueId}">
            <div>
                <span class="badge bg-secondary me-2"><i class="${BLOCK_TYPES[type].icon}"></i></span>
                <span class="fw-bold">${blockTitle}</span>
                ${blockDescription}
            </div>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-info btn-edit-block" type="button" 
                        data-section-index="${sectionIndex}" data-block-index="${blockIndex}" title="Editar Bloco">
                    <i class="fas fa-pencil-alt"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger btn-remove-block" type="button" 
                        data-section-index="${sectionIndex}" data-block-index="${blockIndex}" title="Remover Bloco">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
};

/**
 * Renderiza o HTML de uma única seção no editor. (MANTIDA)
 */
const renderSectionEditor = (section, sectionIndex) => {
    const blocksHtml = (section.blocos || [])
                        .map((block, blockIndex) => renderBlockEditor(block, sectionIndex, blockIndex))
                        .join('');
    
    const addBlockDropdown = `
        <div class="dropdown d-grid">
            <button class="btn btn-secondary btn-sm dropdown-toggle" type="button" 
                    data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-layer-group"></i> Adicionar Bloco de Conteúdo
            </button>
            <ul class="dropdown-menu">
                ${Object.keys(BLOCK_TYPES).map(type => `
                    <li><a class="dropdown-item btn-add-block" href="#" 
                            data-section-index="${sectionIndex}" data-block-type="${type}">
                            <i class="${BLOCK_TYPES[type].icon} fa-fw me-1"></i> ${BLOCK_TYPES[type].label}
                    </a></li>
                `).join('')}
            </ul>
        </div>
    `;
    
    return `
        <div class="section-item border border-secondary-subtle rounded-3 mb-4" id="section-${sectionIndex}">
            <div class="d-flex align-items-center justify-content-between p-3 bg-light rounded-top shadow-sm">
                <div class="d-flex flex-column">
                    <h4 class="h6 mb-0 section-title text-primary">${section.tituloSecao || `Seção ${sectionIndex + 1}`}</h4>
                    <small class="text-muted">${section.subtituloSecao || ''}</small>
                </div>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-warning btn-edit-section" data-index="${sectionIndex}" title="Editar Título/Subtítulo">
                        <i class="fas fa-pencil-alt"></i> Editar Título
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-remove-section" data-index="${sectionIndex}" title="Remover Seção">
                        <i class="fas fa-trash-alt"></i> Remover
                    </button>
                </div>
            </div>

            <div class="p-4">
                <div class="blocks-container">
                    ${blocksHtml || '<p class="text-center text-muted py-3 m-0">Nenhum bloco de conteúdo nesta seção.</p>'}
                </div>
                
                ${addBlockDropdown}

            </div>
        </div>
    `;
};


/**
 * Renderiza todas as seções do formData no editor.
 */
const renderSections = () => {
    const editorList = document.getElementById('sections-editor-list');
    const emptyMessage = document.getElementById('empty-sections-message');
    editorList.innerHTML = '';
    
    if (formData.secoes.length === 0) {
        emptyMessage.classList.remove('d-none');
        return;
    }
    
    emptyMessage.classList.add('d-none');
    
    let sectionsHtml = '';
    formData.secoes.forEach((section, index) => {
        sectionsHtml += renderSectionEditor(section, index);
    });
    
    editorList.innerHTML = sectionsHtml;
    
    // Anexar Listeners para botões que são renderizados dinamicamente
    attachDynamicListeners();
};


/**
 * Anexa listeners a botões criados dinamicamente (remover seção, adicionar detalhe, etc.). (MANTIDA)
 */
const attachDynamicListeners = () => {
    // 1. Listeners para Remover Seção
    document.querySelectorAll('.btn-remove-section').forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            const index = parseInt(button.dataset.index);
            removeSection(index);
        };
    });

    // 2. Listeners para Adicionar Bloco
    document.querySelectorAll('.btn-add-block').forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            const sectionIndex = parseInt(button.dataset.sectionIndex);
            const blockType = button.dataset.blockType;
            addBlock(sectionIndex, blockType);
        };
    });
    
    // 3. Listeners para Remover Bloco
    document.querySelectorAll('.btn-remove-block').forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            const sectionIndex = parseInt(button.dataset.sectionIndex);
            const blockIndex = parseInt(button.dataset.blockIndex);
            removeBlock(sectionIndex, blockIndex);
        };
    });

    // 4. Listeners para Editar Seção (NOVO)
    document.querySelectorAll('.btn-edit-section').forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            const sectionIndex = parseInt(button.dataset.index);
            handleEditSection(sectionIndex);
        };
    });

    // 5. Listeners para Editar Bloco (NOVO)
    document.querySelectorAll('.btn-edit-block').forEach(button => {
        button.onclick = (e) => {
            e.preventDefault();
            const sectionIndex = parseInt(button.dataset.sectionIndex);
            const blockIndex = parseInt(button.dataset.blockIndex);
            handleEditBlock(sectionIndex, blockIndex);
        };
    });
    
    // 6. Listener para Adicionar Detalhe dentro do Modal
    document.getElementById('btn-add-detalhe').onclick = (e) => {
        e.preventDefault();
        addDetail(); // Usa o índice de estado global
    };
};


// ==========================================================
// 4. INICIALIZAÇÃO E LISTENERS ESTÁTICOS (MODIFICADO)
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar instâncias do Bootstrap Modal
    blockModal = new bootstrap.Modal(document.getElementById('blockEditorModal'));
    sectionModal = new bootstrap.Modal(document.getElementById('sectionEditorModal'));
    
    // Inicializar a primeira aba (Lista)
    switchTab('list');
    fetchDocuments();

    // Listeners do formulário principal
    document.getElementById('tituloDocumento').addEventListener('input', (e) => updateFormData('tituloDocumento', e.target.value));
    document.getElementById('identificador').addEventListener('input', (e) => updateFormData('identificador', e.target.value.toUpperCase().replace(/\s/g, '-'))); 
    
    // Botões Estáticos
    document.getElementById('btn-new-document').onclick = handleNewDocument;
    document.getElementById('btn-create-first').onclick = handleNewDocument;
    document.getElementById('btn-save-document').onclick = handleSaveDocument;
    document.getElementById('btn-add-section').onclick = addSection;
    document.getElementById('btn-add-section-empty').onclick = addSection;
    document.getElementById('btn-cancel-edit').onclick = () => {
        isEditing = false;
        currentDoc = null;
        switchTab('list');
    };
    
    // Botões dos Modals
    document.getElementById('btn-save-block').onclick = handleSaveBlockModal;
    document.getElementById('btn-save-section').onclick = handleSaveSectionModal;

    // Resetar campos de bloco e detalhes ao fechar o modal
    document.getElementById('blockEditorModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('block-tipoBloco').disabled = false;
        document.getElementById('block-form').reset();
        currentSectionIndex = -1;
        currentBlockIndex = -1;
    });

    // ==========================================================
    // LISTENERS DE PESQUISA (NOVOS)
    // ==========================================================
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    // Listener para o campo de pesquisa (input event para filtrar em tempo real)
    searchInput.addEventListener('input', (e) => {
        filterDocumentList(e.target.value);
    });

    // Listener para o botão de limpar pesquisa
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterDocumentList(''); // Re-renderiza a lista completa
    });

});

// Tornar funções globais acessíveis a eventos inline no HTML gerado dinamicamente
window.updateDetail = window.updateDetail;