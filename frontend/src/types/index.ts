export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'error';

export interface DocumentMetadata {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  page_count: number | null;
  chunk_count: number;
  status: ProcessingStatus;
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
}

export interface DocumentResponse {
  documents: DocumentMetadata[];
  total: number;
}

export interface Citation {
  document_id: string;
  document_name: string;
  page: number | null;
  paragraph: number | null;
  text: string;
  score: number;
}

export interface SearchRequest {
  query: string;
  top_k?: number;
}

export interface SearchResult {
  query: string;
  results: Citation[];
  total_results: number;
}

export interface ChatRequest {
  query: string;
  top_k?: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  ollama_available: boolean;
}

export interface ChatStatus {
  ollama_available: boolean;
  message: string;
}

export interface Stats {
  total_documents: number;
  total_chunks: number;
  documents_by_status: Record<string, number>;
  documents_by_type: Record<string, number>;
  ollama_status: string;
}

export interface DocumentPage {
  page_number: number;
  text: string;
}

export interface DocumentContent {
  id: string;
  filename: string;
  pages: DocumentPage[];
  total_pages: number;
}

export interface RecentSearch {
  query: string;
  result_count: number;
  timestamp: string;
}

export interface ActivityEntry {
  action: string;
  detail: string;
  timestamp: string;
}

export interface Analytics {
  search: {
    total_searches: number;
    average_results: number;
    top_queries: { query: string; count: number }[];
  };
  storage: {
    uploads_bytes: number;
    index_bytes: number;
  };
}

export interface SystemInfo {
  python_version: string;
  platform: string;
  machine: string;
  uploads_dir: string;
  index_dir: string;
  uploads_size: number;
  index_size: number;
}

export interface KeyTerms {
  document_id: string;
  document_name: string;
  document_type: string;
  parties: string[];
  dates: string[];
  monetary_amounts: string[];
  defined_terms: string[];
  governing_law: string[];
  references: string[];
}

export interface ClauseType {
  id: string;
  name: string;
  description: string;
  queries: string[];
  category: string;
}

export interface ClauseSearchResult {
  clause: ClauseType;
  results: Citation[];
  total_results: number;
}

export interface Bookmark {
  id: number;
  query: string;
  document_name: string;
  page: number | null;
  text: string;
  note: string;
  matter: string;
  created_at: string;
}

export interface MatterTag {
  matter: string;
  client: string;
  tags: string[];
}

// ---------------------------------------------------------------------------
// AI Analysis Types
// ---------------------------------------------------------------------------

export interface AIAnalysisResult {
  document_id: string;
  analysis_type: string;
  cached: boolean;
  [key: string]: unknown;
}

export interface AISummary extends AIAnalysisResult {
  title: string;
  summary: string;
  document_type: string;
  key_points: string[];
  parties: string[];
}

export interface RiskItem {
  clause: string;
  risk_level: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export interface AIRiskAnalysis extends AIAnalysisResult {
  overall_risk: 'low' | 'medium' | 'high';
  risk_score: number;
  risks: RiskItem[];
  summary: string;
}

export interface ChecklistItem {
  provision: string;
  status: 'pass' | 'fail' | 'review';
  detail: string;
  section: string | null;
}

export interface AIChecklist extends AIAnalysisResult {
  checklist: ChecklistItem[];
  score: number;
  summary: string;
}

export interface ObligationItem {
  party: string;
  obligation: string;
  type: string;
  deadline: string | null;
  section: string | null;
  priority: 'high' | 'medium' | 'low';
}

export interface AIObligations extends AIAnalysisResult {
  obligations: ObligationItem[];
  upcoming_deadlines: { date: string; description: string; party: string }[];
  summary: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  category: string;
  party: string | null;
}

export interface AITimeline extends AIAnalysisResult {
  events: TimelineEvent[];
  duration: string;
  key_dates_summary: string;
}

export interface ComparisonProvision {
  provision: string;
  document_a: string;
  document_b: string;
  status: 'match' | 'different' | 'only_a' | 'only_b';
}

export interface AIComparison {
  document_a: { id: string; filename: string };
  document_b: { id: string; filename: string };
  provisions: ComparisonProvision[];
  key_differences: string[];
  similarities: string[];
  recommendation: string;
}

export interface AIBrief {
  title: string;
  issue: string;
  brief_answer: string;
  discussion: string;
  conclusion: string;
  sources_used: number[];
}

export interface AISearchExpansion {
  original: string;
  suggestions: string[];
  legal_terms: string[];
}

export interface ChatResponseWithFollowUps extends ChatResponse {
  follow_up_suggestions: string[];
}
