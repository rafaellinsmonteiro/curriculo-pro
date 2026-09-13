// ==========================================
// CurrículoPRO — TypeScript Types
// ==========================================

// ---------- Enums ----------

export type LeadStatus =
  | 'novo'
  | 'em_producao'
  | 'curriculo_pronto'
  | 'alteracao_solicitada'
  | 'finalizado';

export type ResumeStatus =
  | 'em_producao'
  | 'pronto'
  | 'alteracao_solicitada'
  | 'finalizado';

export type ActivityType =
  | 'lead_criado'
  | 'lead_atualizado'
  | 'curriculo_criado'
  | 'curriculo_editado'
  | 'curriculo_refeito'
  | 'versao_restaurada'
  | 'curriculo_excluido';

// ---------- Database Models ----------

export interface Lead {
  id: string;
  lead_code: string;
  name: string;
  whatsapp: string;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  lead_id: string;
  title: string;
  status: ResumeStatus;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeVersion {
  id: string;
  resume_id: string;
  version_number: number;
  structured_data: string; // JSON string
  generation_prompt: string;
  edit_instruction: string | null;
  pdf_url: string;
  pdf_filename: string;
  created_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  resume_id: string | null;
  activity_type: ActivityType;
  description: string;
  created_at: string;
}

// ---------- API Request/Response ----------

export interface CreateLeadRequest {
  name: string;
  whatsapp: string;
  notes?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  whatsapp?: string;
  status?: LeadStatus;
  notes?: string;
}

export interface CreateResumeRequest {
  lead_id: string;
  title: string;
  prompt: string;
}

export interface EditResumeRequest {
  edit_instruction: string;
}

export interface ResumeWithLead extends Resume {
  lead_name: string;
  lead_whatsapp: string;
  lead_code: string;
  pdf_url: string | null;
  pdf_filename: string | null;
}

export interface LeadWithResumeCount extends Lead {
  resume_count: number;
}

export interface DashboardStats {
  total_leads: number;
  total_resumes: number;
  resumes_today: number;
  resumes_edited: number;
  resumes_pending: number;
  resumes_finished: number;
}

// ---------- OpenAI Structured Resume Data ----------

export interface StructuredResumeData {
  nome_completo: string;
  cargo_principal?: string;
  foto_perfil?: string; // base64 string of the cropped profile photo
  endereco?: string;
  telefone?: string;
  email?: string;
  linkedin?: string;
  resumo_profissional?: string;
  objetivo_profissional?: string;
  escolaridade?: Array<{
    instituicao: string;
    curso: string;
    periodo?: string;
    status?: string;
  }>;
  experiencia_profissional?: Array<{
    empresa: string;
    cargo: string;
    periodo?: string;
    descricao?: string;
  }>;
  cursos_complementares?: Array<{
    nome: string;
    instituicao?: string;
    periodo?: string;
    carga_horaria?: string;
  }>;
  habilidades?: string[];
  idiomas?: Array<{
    idioma: string;
    nivel?: string;
  }>;
  cnh?: string;
  dados_pessoais?: string[];
  informacoes_adicionais?: string[];
  competencias?: string[];
  resumo_qualificacoes?: string;
}

// ---------- Status Display Helpers ----------

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo',
  em_producao: 'Em produção',
  curriculo_pronto: 'Currículo pronto',
  alteracao_solicitada: 'Alteração solicitada',
  finalizado: 'Finalizado',
};

export const RESUME_STATUS_LABELS: Record<ResumeStatus, string> = {
  em_producao: 'Em produção',
  pronto: 'Pronto',
  alteracao_solicitada: 'Alteração solicitada',
  finalizado: 'Finalizado',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  novo: 'badge-blue',
  em_producao: 'badge-yellow',
  curriculo_pronto: 'badge-green',
  alteracao_solicitada: 'badge-orange',
  finalizado: 'badge-purple',
};

export const RESUME_STATUS_COLORS: Record<ResumeStatus, string> = {
  em_producao: 'badge-yellow',
  pronto: 'badge-green',
  alteracao_solicitada: 'badge-orange',
  finalizado: 'badge-purple',
};
