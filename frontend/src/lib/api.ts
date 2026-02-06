import type {
  DocumentResponse,
  DocumentContent,
  SearchRequest,
  SearchResult,
  ChatRequest,
  ChatResponse,
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
} from '../types';
import { demoData } from './demo-data';

const BASE = '/api';

let _isDemoMode: boolean | null = null;

/** Returns true when the backend is unreachable (GitHub Pages, etc.) */
export function isDemoMode(): boolean {
  return _isDemoMode === true;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  _isDemoMode = false;
  return res.json();
}

/** Wraps a live API call; falls back to demo data on network error. */
async function withFallback<T>(live: () => Promise<T>, fallback: () => T): Promise<T> {
  if (_isDemoMode === true) return fallback();
  try {
    return await live();
  } catch (err) {
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed'))) {
      _isDemoMode = true;
      return fallback();
    }
    throw err;
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
    return fetch(`${BASE}/documents/upload`, { method: 'POST', body: form }).then(
      async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || 'Upload failed');
        }
        _isDemoMode = false;
        return res.json();
      }
    ).catch((err) => {
      if (err instanceof TypeError) {
        _isDemoMode = true;
        return { id: 'demo-upload', filename: file.name, status: 'ready' };
      }
      throw err;
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
  chat(data: ChatRequest): Promise<ChatResponse> {
    return withFallback(
      () => request('/chat', { method: 'POST', body: JSON.stringify(data) }),
      () => demoData.chat(data.query),
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

  deleteBookmark(id: number): Promise<{ message: string }> {
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
};
