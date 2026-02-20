import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FileText, Download, Clock, Bookmark, Copy, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import type { Citation, RecentSearch, AISearchExpansion } from '../types';

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="bg-gold-200 text-navy-900 rounded px-0.5">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISearchExpansion | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.getRecentSearches(5).then((r) => setRecentSearches(r.searches)).catch(() => {});
  }, []);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await api.search({ query: q.trim() });
      setResults(data.results);
      // Refresh recent searches
      api.getRecentSearches(5).then((r) => setRecentSearches(r.searches)).catch(() => {});
      // Get AI suggestions (non-blocking)
      setSuggestLoading(true);
      api.expandSearch(q.trim())
        .then(setAiSuggestions)
        .catch(() => {})
        .finally(() => setSuggestLoading(false));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query.trim() ? { q: query.trim() } : {});
    handleSearch(query);
  };

  const exportCSV = () => {
    const header = 'Document,Page,Confidence,Text\n';
    const rows = results.map(
      (r) =>
        `"${r.document_name}",${r.page ?? ''},${(r.score * 100).toFixed(0)}%,"${r.text.replace(/"/g, '""').substring(0, 500)}"`
    );
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${query.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function confidenceLabel(score: number): { text: string; className: string } {
    if (score >= 0.8) return { text: 'High', className: 'bg-green-100 text-green-700' };
    if (score >= 0.6) return { text: 'Medium', className: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Low', className: 'bg-navy-100 text-navy-600' };
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">Smart Search</h1>
        <p className="text-navy-500 mt-1">Search across all your documents with natural language</p>
      </div>

      {/* Search bar */}
      <form onSubmit={onSubmit} className="mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            className="w-full pl-12 pr-28 py-4 text-base border border-navy-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-navy-800 text-white text-sm font-medium rounded-md hover:bg-navy-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* AI Suggestions */}
      {searched && (aiSuggestions || suggestLoading) && (
        <div className="mb-6 bg-gold-50 border border-gold-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-gold-500" />
            <span className="text-xs text-gold-700 font-medium uppercase tracking-wider">AI Suggestions</span>
          </div>
          {suggestLoading ? (
            <p className="text-sm text-gold-600 animate-pulse">Generating suggestions...</p>
          ) : aiSuggestions && (
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(s);
                    setSearchParams({ q: s });
                    handleSearch(s);
                  }}
                  className="text-xs bg-white border border-gold-200 text-gold-700 px-3 py-1.5 rounded-full hover:bg-gold-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent searches */}
      {!searched && recentSearches.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-navy-400" />
            <span className="text-xs text-navy-400 font-medium uppercase tracking-wider">Recent Searches</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(s.query);
                  setSearchParams({ q: s.query });
                  handleSearch(s.query);
                }}
                className="px-3 py-1.5 text-xs bg-white border border-navy-200 rounded-full text-navy-600 hover:border-navy-400 hover:text-navy-800 transition-colors"
              >
                {s.query}
                <span className="ml-1.5 text-navy-400">({s.result_count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && results.length === 0 && (
        <div className="text-center py-12 text-navy-400">
          <Search size={40} className="mx-auto mb-3 opacity-50" />
          <p>No results found. Try a different query or upload more documents.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-navy-500">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs text-navy-500 hover:text-navy-700 transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
          {results.map((result, i) => {
            const conf = confidenceLabel(result.score);
            return (
              <div key={i} className="bg-white border border-navy-200 rounded-lg p-5 shadow-sm hover:border-navy-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-navy-500" />
                    <span className="text-sm font-semibold text-navy-800">{result.document_name}</span>
                    {result.page && (
                      <span className="text-xs text-navy-400 bg-navy-50 px-2 py-0.5 rounded">
                        Page {result.page}
                      </span>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${conf.className}`}>
                    {conf.text} ({(result.score * 100).toFixed(0)}%)
                  </span>
                </div>
                <p className="text-sm text-navy-600 leading-relaxed line-clamp-4">
                  {highlightText(result.text, query)}
                </p>
                <div className="flex gap-3 mt-3 pt-2 border-t border-navy-50">
                  <button
                    onClick={() => {
                      const cite = `${result.document_name}${result.page ? `, at p. ${result.page}` : ''}`;
                      navigator.clipboard.writeText(cite);
                      toast('info', 'Citation copied');
                    }}
                    className="text-xs text-navy-400 hover:text-navy-700 transition-colors flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy Citation
                  </button>
                  <button
                    onClick={async () => {
                      await api.addBookmark({
                        query,
                        document_name: result.document_name,
                        page: result.page,
                        text: result.text,
                      });
                      toast('success', 'Saved to Research');
                    }}
                    className="text-xs text-navy-400 hover:text-navy-700 transition-colors flex items-center gap-1"
                  >
                    <Bookmark size={12} /> Save to Research
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
