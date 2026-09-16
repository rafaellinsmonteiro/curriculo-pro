console.log("CurrículoPRO Extension: Injected");

// ==========================================
// Utils & DOM Helpers
// ==========================================

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) {
      return resolve(el);
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    if (timeout) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    }
  });
}

function getChatHeader() {
  return document.querySelector('header');
}

// ==========================================
// Injeção do Botão
// ==========================================

function injectButton() {
  // O WhatsApp tem 2 headers: o da barra lateral (índice 0) e o da conversa (índice 1)
  const headers = document.querySelectorAll('header');
  if (headers.length < 2) return false;
  
  const chatHeader = headers[1];

  // Verifica se já injetamos
  if (document.getElementById('curriculo-pro-btn')) return true;

  const actionButtonsContainer = chatHeader.lastElementChild;
  if (!actionButtonsContainer) return false;

  const btn = document.createElement('button');
  btn.id = 'curriculo-pro-btn';
  btn.className = 'curriculo-btn';
  btn.innerHTML = `
    <svg class="curriculo-icon" viewBox="0 0 24 24">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
    <svg class="curriculo-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
    <span>Gerar Currículo</span>
  `;

  btn.addEventListener('click', handleGenerateResume);

  actionButtonsContainer.style.display = 'flex';
  actionButtonsContainer.style.alignItems = 'center';
  actionButtonsContainer.insertBefore(btn, actionButtonsContainer.firstChild);
  return true;
}

// Fica vigiando mudanças na tela para reinjetar o botão ao trocar de chat
const bodyObserver = new MutationObserver(() => {
  injectButton();
});
bodyObserver.observe(document.body, { childList: true, subtree: true });

// ==========================================
// Extração de Dados
// ==========================================

function getContactName() {
  const headers = document.querySelectorAll('header');
  if (headers.length < 2) return 'Desconhecido';
  const chatHeader = headers[1];
  
  const nameEl = chatHeader.querySelector('span[dir="auto"]');
  return nameEl ? nameEl.textContent : 'Desconhecido';
}

function getChatMessages() {
  const messages = [];
  // No WhatsApp Web moderno, as mensagens possuem o atributo data-id
  // data-id começa com "false_" para mensagens recebidas (cliente) e "true_" para enviadas (operador)
  const messageNodes = document.querySelectorAll('div[data-id]');
  
  messageNodes.forEach(node => {
    const dataId = node.getAttribute('data-id');
    if (!dataId) return;
    
    // Procura o texto real da mensagem
    // O texto fica dentro de um span.selectable-text com span-filho ou img (emojis)
    const textSpan = node.querySelector('span.selectable-text');
    if (textSpan) {
      const isFromMe = dataId.startsWith('true_');
      let textContent = '';
      
      // Itera pelos nós do texto (para pegar emojis como texto se tiver atributo alt, ou o textNode)
      textSpan.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          textContent += child.textContent;
        } else if (child.tagName === 'SPAN') {
          textContent += child.innerText || child.textContent;
        } else if (child.tagName === 'IMG') {
          textContent += child.getAttribute('alt') || ' ';
        }
      });
      
      if (textContent.trim()) {
        messages.push({
          sender: isFromMe ? 'Operador' : 'Cliente',
          text: textContent.trim()
        });
      }
    }
  });
  
  return messages;
}

async function getChatImages() {
  const images = [];
  // Procura QUALQUER imagem blob na tela inteira (o WhatsApp só carrega blobs para as fotos ativas)
  const imgs = document.querySelectorAll('img[src^="blob:"]');
  
  for (const img of imgs) {
    try {
      const res = await fetch(img.src);
      const blob = await res.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      images.push(base64);
    } catch (e) {
      console.error("Erro ao ler imagem do chat:", e);
    }
  }
  return images;
}

// ==========================================
// Ação Principal
// ==========================================

async function handleGenerateResume() {
  const btn = document.getElementById('curriculo-pro-btn');
  btn.classList.add('loading');
  
  try {
    const name = getContactName();
    const messages = getChatMessages();
    const images = await getChatImages();
    
    // Debug temporário para sabermos se a foto foi capturada
    console.log(`Imagens capturadas: ${images.length}`);
    if (images.length === 0) {
      alert("Aviso: Nenhuma imagem válida (blob) foi encontrada na tela. O currículo será gerado sem foto.");
    }
    
    // Filtra apenas as mensagens do cliente para mandar como "Dados anexados"
    const clientText = messages
      .filter(m => m.sender === 'Cliente')
      .map(m => m.text)
      .join('\n');
      
    if (!clientText.trim() && images.length === 0) {
      alert("Nenhum texto ou imagem do cliente encontrado na conversa visível.");
      btn.classList.remove('loading');
      return;
    }
    
    // Pega a última imagem enviada pelo cliente para ser a foto de perfil
    const lastImage = images.length > 0 ? images[images.length - 1] : null;
    
    console.log("Enviando dados para o Background Script...");
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'generateResume',
        payload: {
          name: name,
          whatsapp: name, 
          prompt: clientText,
          foto_perfil: lastImage
        }
      }, (res) => {
        if (chrome.runtime.lastError) {
          console.error("Erro no sendMessage:", chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(res);
        }
      });
    });
    
    if (response && response.success && response.pdf_base64) {
      console.log("Currículo gerado e PDF recebido em Base64!");
      
      // Converte Base64 de volta para Blob
      const binaryString = atob(response.pdf_base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const file = new File([blob], response.pdf_filename || "curriculo.pdf", { type: "application/pdf" });
      
      // Tenta encontrar o input do WhatsApp (div contenteditable)
      const inputEl = document.querySelector('div[contenteditable="true"][data-tab="10"]') || document.querySelector('div[contenteditable="true"]');
      
      if (inputEl) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        inputEl.focus();
        inputEl.dispatchEvent(pasteEvent);
        
        alert("Currículo gerado e anexado com sucesso! Clique em enviar.");
      } else {
        alert("Currículo gerado, mas não encontrei a caixa de texto para anexar.");
      }
      
    } else {
      alert("Erro ao criar currículo: " + (response?.error || 'Erro desconhecido'));
    }
  } catch (err) {
    console.error("Erro na comunicação ou execução:", err);
    alert("Erro de comunicação com a extensão ou falha ao anexar o arquivo.");
  } finally {
    btn.classList.remove('loading');
  }
}
