document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMsg');

  // Carregar configurações salvas
  chrome.storage.sync.get({
    apiUrl: 'https://curriculopro-eight.vercel.app'
  }, (items) => {
    apiUrlInput.value = items.apiUrl;
  });

  // Salvar configurações
  saveBtn.addEventListener('click', () => {
    let url = apiUrlInput.value.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    
    chrome.storage.sync.set({
      apiUrl: url
    }, () => {
      statusMsg.textContent = 'Configurações salvas!';
      setTimeout(() => {
        statusMsg.textContent = '';
      }, 2000);
    });
  });
});
