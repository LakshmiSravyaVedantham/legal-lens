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
