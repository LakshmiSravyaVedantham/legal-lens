import type {
  DocumentResponse,
  DocumentContent,
  SearchRequest,
  SearchResult,
  ChatRequest,
  ChatStatus,
  Stats,
  Analytics,
  SystemInfo,
  RecentSearch,
  ActivityEntry,
  KeyTerms,
  ClauseType,
  ClauseSearchResult,
  Bookmark,
  MatterTag,
  AIAnalysisResult,
  AISummary,
  AIRiskAnalysis,
  AIChecklist,
  AIObligations,
  AITimeline,
  AIComparison,
  AIBrief,
  AISearchExpansion,
  ChatResponseWithFollowUps,
} from '../types';
import { demoData } from './demo-data';
import { loadAuth, clearAuth } from './auth';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

let _isDemoMode: boolean | null = null;

/** Returns true when the backend is unreachable (GitHub Pages, etc.) */
export function isDemoMode(): boolean {
  return _isDemoMode === true;
}

function getAuthHeaders(): Record<string, string> {
  const { tokens } = loadAuth();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tokens?.access_token) {
    headers['Authorization'] = `Bearer ${tokens.access_token}`;
  }
  return headers;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: getAuthHeaders(),
    ...options,
  });

  if (res.status === 401) {
    // Token expired — try refresh
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry with new token
      const retryRes = await fetch(`${BASE}${url}`, {
        headers: getAuthHeaders(),
        ...options,
      });
      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed: ${retryRes.status}`);
      }
      _isDemoMode = false;
      return retryRes.json();
    }
    // Refresh failed — logout
    clearAuth();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  _isDemoMode = false;
  return res.json();
}

async function tryRefreshToken(): Promise<boolean> {
  const { tokens } = loadAuth();
  if (!tokens?.refresh_token) return false;

  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    if (!res.ok) return false;
    const newTokens = await res.json();

    // Update stored tokens
    const { user } = loadAuth();
    if (user) {
      const { saveAuth } = await import('./auth');
      saveAuth(user, newTokens);
    }
    return true;
  } catch {
    return false;
  }
}

/** Wraps a live API call; falls back to demo data when backend is unreachable. */
async function withFallback<T>(live: () => Promise<T>, fallback: () => T): Promise<T> {
  if (_isDemoMode === true) return fallback();
  try {
    return await live();
  } catch {
    _isDemoMode = true;
    return fallback();
  }
}

export const api = {
  // Documents
  uploadDocument(file: File) {
    if (_isDemoMode) {
      return Promise.resolve({ id: 'demo-upload', filename: file.name, status: 'ready' });
    }
    const form = new FormData();
    form.append('file', file);
    const { tokens } = loadAuth();
    const headers: Record<string, string> = {};
    if (tokens?.access_token) {
      headers['Authorization'] = `Bearer ${tokens.access_token}`;
    }
    return fetch(`${BASE}/documents/upload`, { method: 'POST', body: form, headers }).then(
      async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || 'Upload failed');
        }
        _isDemoMode = false;
        return res.json();
      }
    ).catch(() => {
      _isDemoMode = true;
      return { id: 'demo-upload', filename: file.name, status: 'ready' };
    });
  },

  getDocuments(): Promise<DocumentResponse> {
    return withFallback(() => request('/documents'), demoData.documents);
  },

  getDocumentContent(id: string): Promise<DocumentContent> {
    return withFallback(() => request(`/documents/${id}/content`), demoData.documentContent);
  },

  deleteDocument(_id: string): Promise<{ message: string }> {
    return withFallback(
      () => request(`/documents/${_id}`, { method: 'DELETE' }),
      () => ({ message: 'Demo mode — delete simulated' }),
    );
  },

  // Search
  search(data: SearchRequest): Promise<SearchResult> {
    return withFallback(
      () => request('/search', { method: 'POST', body: JSON.stringify(data) }),
      () => demoData.search(data.query),
    );
  },

  // Chat
  chat(data: ChatRequest): Promise<ChatResponseWithFollowUps> {
    return withFallback(
      () => request('/chat', { method: 'POST', body: JSON.stringify(data) }),
      () => ({ ...demoData.chat(data.query), follow_up_suggestions: [] }),
    );
  },

  getChatStatus(): Promise<ChatStatus> {
    return withFallback(() => request('/chat/status'), demoData.chatStatus);
  },

  // Stats & Analytics
  getStats(): Promise<Stats> {
    return withFallback(() => request('/stats'), demoData.stats);
  },

  getAnalytics(): Promise<Analytics> {
    return withFallback(() => request('/analytics'), demoData.analytics);
  },

  getRecentSearches(_limit = 10): Promise<{ searches: RecentSearch[] }> {
    return withFallback(
      () => request(`/analytics/recent-searches?limit=${_limit}`),
      demoData.recentSearches,
    );
  },

  getActivityLog(_limit = 20): Promise<{ activity: ActivityEntry[] }> {
    return withFallback(
      () => request(`/analytics/activity?limit=${_limit}`),
      demoData.activity,
    );
  },

  getSystemInfo(): Promise<SystemInfo> {
    return withFallback(() => request('/system-info'), demoData.systemInfo);
  },

  // Legal Intelligence
  getKeyTerms(_docId: string): Promise<KeyTerms> {
    return withFallback(() => request(`/documents/${_docId}/key-terms`), demoData.keyTerms);
  },

  classifyDocument(_docId: string): Promise<{ document_id: string; document_type: string }> {
    return withFallback(
      () => request(`/documents/${_docId}/classify`),
      () => ({ document_id: _docId, document_type: 'Contract' }),
    );
  },

  getClauseLibrary(): Promise<{ clauses: ClauseType[] }> {
    return withFallback(() => request('/clauses'), demoData.clauses);
  },

  searchClause(clauseId: string, topK = 10): Promise<ClauseSearchResult> {
    return withFallback(
      () => request(`/clauses/${clauseId}/search?top_k=${topK}`),
      () => demoData.clauseSearch(clauseId),
    );
  },

  // Bookmarks
  addBookmark(data: {
    query?: string;
    document_name: string;
    page?: number | null;
    text: string;
    note?: string;
    matter?: string;
  }): Promise<Bookmark> {
    return withFallback(
      () => request('/bookmarks', { method: 'POST', body: JSON.stringify(data) }),
      () => ({ id: Date.now(), ...data, page: data.page ?? 1, note: data.note ?? '', matter: data.matter ?? '', created_at: new Date().toISOString() } as Bookmark),
    );
  },

  getBookmarks(matter?: string): Promise<{ bookmarks: Bookmark[] }> {
    const q = matter ? `?matter=${encodeURIComponent(matter)}` : '';
    return withFallback(() => request(`/bookmarks${q}`), demoData.bookmarks);
  },

  deleteBookmark(id: number | string): Promise<{ message: string }> {
    return withFallback(
      () => request(`/bookmarks/${id}`, { method: 'DELETE' }),
      () => ({ message: 'Demo mode — delete simulated' }),
    );
  },

  // Matter Tags
  setMatterTag(docId: string, data: MatterTag): Promise<{ message: string }> {
    return withFallback(
      () => request(`/documents/${docId}/matter`, { method: 'PUT', body: JSON.stringify(data) }),
      () => ({ message: 'Demo mode — tag saved' }),
    );
  },

  getMatterTag(_docId: string): Promise<MatterTag> {
    return withFallback(() => request(`/documents/${_docId}/matter`), demoData.matterTag);
  },

  // LLM Config (admin only)
  getLLMConfig(): Promise<any> {
    return request('/llm/config');
  },

  updateLLMConfig(config: any): Promise<{ message: string }> {
    return request('/llm/config', { method: 'PUT', body: JSON.stringify(config) });
  },

  getLLMProviderStatus(): Promise<{ providers: any[] }> {
    return request('/llm/providers/status');
  },

  // --- AI Features ---
  runAnalysis(docId: string, analysisType: string, forceRefresh = false): Promise<AIAnalysisResult> {
    return request(`/ai/documents/${docId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ analysis_type: analysisType, force_refresh: forceRefresh }),
    });
  },

  getAllAnalyses(docId: string): Promise<{ document_id: string; analyses: Record<string, { result: any; created_at: string | null }> }> {
    return request(`/ai/documents/${docId}/analyses`);
  },

  getAISummary(docId: string, force = false): Promise<AISummary> {
    return request(`/ai/documents/${docId}/summary?force=${force}`);
  },

  getAIRisks(docId: string, force = false): Promise<AIRiskAnalysis> {
    return request(`/ai/documents/${docId}/risks?force=${force}`);
  },

  getAIChecklist(docId: string, force = false): Promise<AIChecklist> {
    return request(`/ai/documents/${docId}/checklist?force=${force}`);
  },

  getAIObligations(docId: string, force = false): Promise<AIObligations> {
    return request(`/ai/documents/${docId}/obligations?force=${force}`);
  },

  getAITimeline(docId: string, force = false): Promise<AITimeline> {
    return request(`/ai/documents/${docId}/timeline?force=${force}`);
  },

  compareDocuments(docAId: string, docBId: string): Promise<AIComparison> {
    return request('/ai/compare', {
      method: 'POST',
      body: JSON.stringify({ document_a_id: docAId, document_b_id: docBId }),
    });
  },

  generateBrief(topic: string, bookmarks: { document_name: string; page?: number | null; text: string }[]): Promise<AIBrief> {
    return request('/ai/brief', {
      method: 'POST',
      body: JSON.stringify({ topic, bookmarks }),
    });
  },

  expandSearch(query: string): Promise<AISearchExpansion> {
    return request('/ai/search/expand', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  clearAnalyses(docId: string): Promise<{ message: string }> {
    return request(`/ai/documents/${docId}/analyses`, { method: 'DELETE' });
  },
};
