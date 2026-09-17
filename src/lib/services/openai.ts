// ==========================================
// CurrículoPRO — OpenAI Service
// ==========================================

import OpenAI, { toFile } from 'openai';
import type { StructuredResumeData } from '@/lib/types';

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }
  return new OpenAI({ apiKey });
}

const JSON_SCHEMA = `{
  "nome_completo": "string",

  "endereco": "string (opcional)",
  "telefone": "string (opcional)",
  "email": "string (opcional)",
  "linkedin": "string (opcional)",
  "resumo_profissional": "string",
  "objetivo_profissional": "string",
  "escolaridade": [{ "instituicao": "string (opcional)", "curso": "string (opcional)", "periodo": "string (opcional)", "status": "string (opcional)" }],
  "experiencia_profissional": [{ "empresa": "string (opcional)", "cargo": "string (opcional)", "periodo": "string (opcional)", "descricao": "string (opcional)" }],
  "cursos_complementares": [{ "nome": "string (opcional)", "instituicao": "string (opcional)", "periodo": "string (opcional)", "carga_horaria": "string (opcional)" }],
  "habilidades": ["string"],
  "idiomas": [{ "idioma": "string", "nivel": "string (opcional)" }],
  "cnh": "string (opcional)",
  "dados_pessoais": ["string"],
  "informacoes_adicionais": ["string"],
  "competencias": ["string"],
  "resumo_qualificacoes": "string"
}`;

const BASE_PROMPT = `Você é um Recrutador Especialista e Consultor de Carreira de alto nível, especialista em criação de currículos profissionais brasileiros de excelência.

Seu objetivo é transformar as informações brutas (muitas vezes informais, com erros ou incompletas) fornecidas pelo usuário em um currículo impecável, altamente atraente para recrutadores e otimizado para processos seletivos.

### DIRETRIZES DE ESCRITA (MUITO IMPORTANTE):
1. **Melhore e Enriqueça o Texto**: Reescreva as descrições para que soem profissionais, cultas e diretas. Corrija erros gramaticais e de concordância.
2. **Resumo Profissional Robusto**: Crie um parágrafo envolvente (3 a 5 linhas) no campo \`resumo_profissional\`, destacando o perfil do candidato, suas qualidades e áreas de domínio (mesmo que o usuário tenha escrito pouco, deduza um perfil rico a partir dos cargos).
3. **Experiência Profissional (Lógica Dupla CRÍTICA)**:
   - **CASO A (Detalhado)**: Se o usuário forneceu nomes de empresas e/ou datas (ex: "Trabalhei na HRL Confecções como auxiliar por 1 ano"), preencha \`empresa\`, \`cargo\` e \`periodo\` fielmente. **NÃO INVENTE descrições longas** se ele não descreveu o que fazia. Você pode deixar a \`descricao\` VAZIA, ou fazer uma frase extremamente curta, mantendo o currículo limpo e focado nas empresas.
   - **CASO B (Apenas lista de profissões)**: Se o usuário jogar apenas uma lista solta de profissões (ex: "armador, pintor, pedreiro") sem empresas ou datas, separe CADA profissão em um item diferente. **NÃO INVENTE nomes de empresas nem períodos** (simplesmente OMITA as chaves \`empresa\` e \`periodo\` no JSON). Apenas neste caso, GERE uma descrição (2-3 linhas) das atividades daquele cargo para o currículo não ficar vazio.
4. **Verbos de Ação**: Inicie descrições de atividades com verbos de ação fortes (ex: Gerenciou, Executou, Atuou, Responsável por).
5. **Dados Pessoais**: Agrupe informações como data de nascimento, naturalidade, estado civil e CNH em um array curto de strings no campo \`dados_pessoais\` (ex: ["Nascimento: 26/10/1985", "Estado civil: Solteira"]). SE UMA INFORMAÇÃO NÃO FOI FORNECIDA, SIMPLESMENTE OMita O ITEM INTEIRO DA LISTA.
6. **Omissão Inteligente (NÃO USE "Não Informado")**: NUNCA, SOB HIPÓTESE ALGUMA, escreva "Não Informado", "Não Informada" ou similares. Se uma informação não existir (como estado civil, data de nascimento, CNH, período, escola), simplesmente NÃO a inclua na lista ou no JSON. Oculte a informação completamente.
7. **Habilidades**: Gere uma lista robusta (mínimo 6, máximo 12) de competências técnicas (Hard Skills) e comportamentais (Soft Skills).
8. **Resumo de Qualificações**: Crie no campo \`resumo_qualificacoes\` um parágrafo envolvente (3 a 4 linhas) sintetizando as qualificações gerais do candidato para ser usado no final do currículo como fechamento (Ex: "Experiência profissional diversificada em preparação de alimentos...").
9. **Competências**: Gere uma lista (de 5 a 8 itens) no campo \`competencias\` com frases curtas baseadas nas experiências fornecidas, focando em atividades e responsabilidades chave (ex: "Operação de empilhadeira conforme qualificação", "Organização e movimentação de materiais").
10. **Limite de 1 Página (MUITO IMPORTANTE)**: O currículo final **DEVE CABER EM APENAS UMA PÁGINA**. Se o candidato tiver muitas experiências profissionais, filtre e inclua APENAS as 4 ou 5 mais recentes e relevantes. Se houver muitos cursos, limite para no máximo 5. Seja conciso e evite parágrafos longos, o design do sistema possui fontes grandes.
11. **Compensação de Espaço para Currículos Curtos**: Se as informações fornecidas forem curtas, **COMPENSE GERANDO TEXTOS MAIS LONGOS E DETALHADOS** no Perfil Profissional, Objetivo Profissional e no Resumo de Qualificações. Você DEVE gerar essas sessões sempre, mesmo que o usuário não as tenha fornecido explicitamente. Gere também uma lista generosa de Competências (8 a 10 itens) e crie Informações Adicionais (como disponibilidade de horário, foco, etc.) para que o currículo fique robusto e preencha bem a página, evitando espaços em branco excessivos.

Retorne os dados em formato JSON com a seguinte estrutura estrita:
${JSON_SCHEMA}

Retorne SOMENTE o JSON válido, sem texto adicional, sem formatação markdown (sem \`\`\`json).`;

const EDIT_PROMPT = `Você é um Recrutador Especialista editando um currículo já existente.

Utilize como base todas as informações da versão atual.

Realize SOMENTE as alterações solicitadas pelo usuário. Aplique as melhores práticas de escrita profissional (verbos de ação, clareza, correção gramatical) nas partes alteradas.
Mantenha sempre a REGRA CRÍTICA DE 1 PÁGINA: O currículo não pode ser muito longo. Se houver excesso de experiências, mantenha apenas as 4 ou 5 mais importantes e resuma descrições longas.

Preserve a estrutura e as demais informações do currículo. Não remova informações a menos que solicitado. Se a solicitação pedir para adicionar ou inventar novas seções (como objetivo profissional ou informações adicionais para preencher espaço), VOCÊ DEVE OBEDECER E CRIÁ-LAS.

Regra de Omissão Inteligente: Se houver algum campo no JSON atual com o valor "Não informado" (ou similar) ou em listas como \`dados_pessoais\`, REMOVA ESSE DADO COMPLETAMENTE ao gerar o JSON de saída. NUNCA coloque "Não informado".

Retorne os dados completos do currículo já atualizados no seguinte formato JSON estrito:
${JSON_SCHEMA}

Retorne SOMENTE o JSON válido, sem texto adicional, sem formatação markdown (sem \`\`\`json).`;

/**
 * Generate a new resume from raw text input
 */
export async function generateResume(
  prompt: string,
  images?: { base64: string; mimeType: string }[]
): Promise<{
  structured_data: StructuredResumeData;
  raw_response: string;
}> {
  const client = getClient();

  const userContent: any[] = [{ type: 'text', text: prompt }];

  if (images && images.length > 0) {
    for (const img of images) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
      });
    }
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: BASE_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '';

  try {
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    let cleaned = content;
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = content.substring(jsonStart, jsonEnd + 1);
    }
    const structured_data = JSON.parse(cleaned) as StructuredResumeData;
    return { structured_data, raw_response: content };
  } catch (err) {
    console.error("ERRO DE PARSE NA GERAÇÃO. Raw content:", content, err);
    throw new Error('Não foi possível processar a resposta da OpenAI. Tente novamente.');
  }
}

/**
 * Edit an existing resume with specific instructions
 */
export async function editResume(
  currentData: StructuredResumeData,
  editInstruction: string,
  images?: { base64: string; mimeType: string }[]
): Promise<{
  structured_data: StructuredResumeData;
  raw_response: string;
}> {
  const client = getClient();

  // Remove profile photo base64 to avoid consuming thousands of tokens and hitting max_tokens limit
  const dataForAi = { ...currentData };
  delete dataForAi.foto_perfil;

  const promptText = `Dados atuais do currículo:\n${JSON.stringify(dataForAi, null, 2)}\n\nAlterações solicitadas:\n${editInstruction}`;
  const userContent: any[] = [{ type: 'text', text: promptText }];

  if (images && images.length > 0) {
    for (const img of images) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
      });
    }
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: EDIT_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '';

  try {
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    let cleaned = content;
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = content.substring(jsonStart, jsonEnd + 1);
    }
    const structured_data = JSON.parse(cleaned) as StructuredResumeData;
    return { structured_data, raw_response: content };
  } catch (err) {
    console.error("ERRO DE PARSE NA EDIÇÃO. Raw content:", content, err);
    throw new Error('Não foi possível processar a resposta da OpenAI. Tente novamente.');
  }
}

/**
 * Check if the OpenAI API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;
}

/**
 * Transcribe an audio file using OpenAI Whisper API
 */
export async function transcribeAudio(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const client = getClient();

  const file = await toFile(buffer, filename);

  const transcription = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'pt',
    response_format: 'text',
  });

  return transcription as unknown as string;
}
