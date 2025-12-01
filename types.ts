
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: string;
  avatar: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  lastLogin?: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  state: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUpdate: string;
  photo: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CANDIDATES = 'CANDIDATES',
  NETWORK = 'NETWORK',
  AI_CORE = 'AI_CORE',
  SETTINGS = 'SETTINGS',
  USERS = 'USERS',
  COMMERCE = 'COMMERCE' // Novo Módulo
}

export interface FileNode {
  name: string;
  path: string;
  type: 'FILE' | 'DIRECTORY';
  children?: FileNode[];
  content?: string;
  isProtected?: boolean;
}

export interface TerminalResponse {
  output: string;
  error?: string;
  exitCode: number;
}

export interface RiskAnalysis {
  securityScore: number;
  performanceScore: number;
  integrityScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  analysis: string;
}

export interface AIActionResponse {
  actionType: "CREATE" | "UPDATE" | "DELETE" | "EXPLAIN" | "SHELL" | "SQL_QUERY" | "ANALYZE_RISK";
  message: string;
  files?: Array<{ path: string; content: string; }>;
  shellCommand?: string; 
  sqlQuery?: string;
  riskAnalysis?: RiskAnalysis;
}

export enum AIProvider {
  GEMINI = 'GEMINI',
  OPENROUTER = 'OPENROUTER',
  HUGGINGFACE = 'HUGGINGFACE',
  DEEPSEEK = 'DEEPSEEK',
  OTHER = 'OTHER'
}

export interface AIKey {
  id: number;
  provider: AIProvider;
  key_value: string;
  label: string;
  is_active: boolean;
  priority: number;
  usage_count: number;
  error_count: number;
}

export interface ActiveKeyResponse {
  key: string;
  provider: AIProvider;
  id: number;
  priority?: number;
}

export interface ModuleMetrics {
  name: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  cpuUsage: number;
  memoryUsage: number;
}

// Novos Tipos para Commerce e Branding
export interface Plan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  trial_days: number;
  features_json: string[]; // Array de strings
  is_active: boolean;
}

export interface Payment {
  id: number;
  user_id: number;
  user_name?: string; // Join
  plan_id: number;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transaction_id: string;
  payment_method: string;
  created_at: string;
}

export interface BrandingConfig {
  systemName: string;
  logoUrl: string;
}
