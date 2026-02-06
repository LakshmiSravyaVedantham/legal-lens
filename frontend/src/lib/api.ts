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

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Documents
  uploadDocument(file: File) {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${BASE}/documents/upload`, { method: 'POST', body: form }).then(
      async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || 'Upload failed');
        }
        return res.json();
      }
    );
  },

  getDocuments(): Promise<DocumentResponse> {
    return request('/documents');
  },

  getDocumentContent(id: string): Promise<DocumentContent> {
    return request(`/documents/${id}/content`);
  },

  deleteDocument(id: string): Promise<{ message: string }> {
    return request(`/documents/${id}`, { method: 'DELETE' });
  },

  // Search
  search(data: SearchRequest): Promise<SearchResult> {
    return request('/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Chat
  chat(data: ChatRequest): Promise<ChatResponse> {
    return request('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getChatStatus(): Promise<ChatStatus> {
    return request('/chat/status');
  },

  // Stats & Analytics
  getStats(): Promise<Stats> {
    return request('/stats');
  },

  getAnalytics(): Promise<Analytics> {
    return request('/analytics');
  },

  getRecentSearches(limit = 10): Promise<{ searches: RecentSearch[] }> {
    return request(`/analytics/recent-searches?limit=${limit}`);
  },

  getActivityLog(limit = 20): Promise<{ activity: ActivityEntry[] }> {
    return request(`/analytics/activity?limit=${limit}`);
  },

  getSystemInfo(): Promise<SystemInfo> {
    return request('/system-info');
  },

  // Legal Intelligence
  getKeyTerms(docId: string): Promise<KeyTerms> {
    return request(`/documents/${docId}/key-terms`);
  },

  classifyDocument(docId: string): Promise<{ document_id: string; document_type: string }> {
    return request(`/documents/${docId}/classify`);
  },

  getClauseLibrary(): Promise<{ clauses: ClauseType[] }> {
    return request('/clauses');
  },

  searchClause(clauseId: string, topK = 10): Promise<ClauseSearchResult> {
    return request(`/clauses/${clauseId}/search?top_k=${topK}`);
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
    return request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBookmarks(matter?: string): Promise<{ bookmarks: Bookmark[] }> {
    const q = matter ? `?matter=${encodeURIComponent(matter)}` : '';
    return request(`/bookmarks${q}`);
  },

  deleteBookmark(id: number): Promise<{ message: string }> {
    return request(`/bookmarks/${id}`, { method: 'DELETE' });
  },

  // Matter Tags
  setMatterTag(docId: string, data: MatterTag): Promise<{ message: string }> {
    return request(`/documents/${docId}/matter`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getMatterTag(docId: string): Promise<MatterTag> {
    return request(`/documents/${docId}/matter`);
  },
};
