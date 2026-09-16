chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateResume') {
    handleGenerateResume(request.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Indicates that we will send a response asynchronously
    return true;
  }
});

async function handleGenerateResume(payload) {
  // 1. Obter a URL da API salva nas configurações
  const config = await chrome.storage.sync.get({ apiUrl: 'https://curriculopro-eight.vercel.app' });
  const apiUrl = config.apiUrl;
  
  if (!apiUrl) {
    throw new Error("URL da API não configurada.");
  }

  // 2. Montar FormData
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('whatsapp', payload.whatsapp);
  formData.append('prompt', payload.prompt);
  
  if (payload.foto_perfil) {
    formData.append('foto_perfil', payload.foto_perfil);
  }
  
  // 3. Fazer requisição POST
  console.log("Enviando requisição para:", `${apiUrl}/api/resumes`);
  
  const response = await fetch(`${apiUrl}/api/resumes`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao conectar com a API');
  }
  
  // 4. Buscar a URL do PDF gerado
  if (data.success && data.resume_id) {
    const detailResponse = await fetch(`${apiUrl}/api/resumes/${data.resume_id}`);
    const detailData = await detailResponse.json();
    
    if (detailResponse.ok && detailData.versions && detailData.versions.length > 0) {
      const latestVersion = detailData.versions[0];
      const pdfUrl = latestVersion.pdf_url;
      const fullPdfUrl = pdfUrl.startsWith('http') ? pdfUrl : `${apiUrl}${pdfUrl}`;
      
      // Baixar o PDF pelo Background (para evitar bloqueio de CORS/CSP do WhatsApp)
      const pdfFetch = await fetch(fullPdfUrl);
      const pdfBuffer = await pdfFetch.arrayBuffer();
      
      // Converter ArrayBuffer para Base64
      let binary = '';
      const bytes = new Uint8Array(pdfBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Pdf = btoa(binary);
      
      return { 
        success: true, 
        resume_id: data.resume_id,
        pdf_base64: base64Pdf,
        pdf_filename: latestVersion.pdf_filename || "curriculo.pdf"
      };
    }
  }

  return data;
}
