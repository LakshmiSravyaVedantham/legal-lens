import { useEffect, useState } from 'react';
import { BookOpen, FileText, ChevronRight, Search, Bookmark } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import type { ClauseType, Citation } from '../types';

export default function ClauseLibrary() {
  const [clauses, setClauses] = useState<ClauseType[]>([]);
  const [selectedClause, setSelectedClause] = useState<ClauseType | null>(null);
  const [results, setResults] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.getClauseLibrary().then((r) => setClauses(r.clauses)).catch(console.error);
  }, []);

  const handleSearch = async (clause: ClauseType) => {
    setSelectedClause(clause);
    setLoading(true);
    setResults([]);
    try {
      const data = await api.searchClause(clause.id);
      setResults(data.results);
    } catch (e: unknown) {
      toast('error', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (result: Citation) => {
    try {
      await api.addBookmark({
        query: selectedClause?.name ?? '',
        document_name: result.document_name,
        page: result.page,
        text: result.text,
      });
      toast('success', 'Saved to Research');
    } catch (e: unknown) {
      toast('error', e instanceof Error ? e.message : String(e));
    }
  };

  const copyAsCitation = (result: Citation) => {
    const cite = `${result.document_name}${result.page ? `, at p. ${result.page}` : ''}`;
    navigator.clipboard.writeText(cite);
    toast('info', 'Citation copied');
  };

  // Group clauses by category
  const categories = clauses.reduce<Record<string, ClauseType[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="flex h-full">
      {/* Left: clause picker */}
      <div className="w-80 border-r border-navy-200 bg-white overflow-y-auto shrink-0">
        <div className="p-5 border-b border-navy-100">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-gold-500" />
            <h1 className="text-lg font-bold text-navy-900">Clause Finder</h1>
          </div>
          <p className="text-xs text-navy-500">Find standard clauses across all your documents</p>
        </div>
        <div className="py-2">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category}>
              <p className="px-5 pt-4 pb-1 text-xs font-semibold text-navy-400 uppercase tracking-wider">
                {category}
              </p>
              {items.map((clause) => (
                <button
                  key={clause.id}
                  onClick={() => handleSearch(clause)}
                  className={`w-full text-left px-5 py-2.5 flex items-center justify-between group transition-colors ${
                    selectedClause?.id === clause.id
                      ? 'bg-navy-100 border-r-2 border-gold-400'
                      : 'hover:bg-navy-50'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-medium ${
                      selectedClause?.id === clause.id ? 'text-navy-900' : 'text-navy-700'
                    }`}>
                      {clause.name}
                    </p>
                    <p className="text-xs text-navy-400 mt-0.5 line-clamp-1">{clause.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-navy-300 group-hover:text-navy-500 shrink-0" />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right: results */}
      <div className="flex-1 overflow-y-auto">
        {!selectedClause ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <BookOpen size={48} className="mx-auto text-navy-200 mb-4" />
              <h2 className="text-lg font-medium text-navy-600 mb-2">Select a Clause Type</h2>
              <p className="text-sm text-navy-400 max-w-md">
                Choose a clause category from the left panel to search for matching provisions across all uploaded documents.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Search size={16} className="text-gold-500" />
                <h2 className="text-lg font-bold text-navy-900">{selectedClause.name}</h2>
              </div>
              <p className="text-sm text-navy-500">{selectedClause.description}</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-navy-400">Searching across all documents...</div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-navy-400">
                <Search size={36} className="mx-auto mb-3 opacity-50" />
                <p>No matching clauses found in your documents.</p>
                <p className="text-sm mt-1">Upload documents containing {selectedClause.name.toLowerCase()} provisions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-navy-500">
                  Found {results.length} matching provision{results.length !== 1 ? 's' : ''}
                </p>
                {results.map((result, i) => (
                  <div key={i} className="bg-white border border-navy-200 rounded-lg shadow-sm hover:border-navy-300 transition-colors">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-navy-100">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-navy-500" />
                        <span className="text-sm font-semibold text-navy-800">{result.document_name}</span>
                        {result.page && (
                          <span className="text-xs text-navy-400 bg-navy-50 px-2 py-0.5 rounded">
                            Page {result.page}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          result.score >= 0.7
                            ? 'bg-green-100 text-green-700'
                            : result.score >= 0.5
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-navy-100 text-navy-600'
                        }`}>
                          {(result.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="px-5 py-3">
                      <p className="text-sm text-navy-700 leading-relaxed line-clamp-5">{result.text}</p>
                    </div>
                    <div className="px-5 py-2 border-t border-navy-50 flex gap-3">
                      <button
                        onClick={() => copyAsCitation(result)}
                        className="text-xs text-navy-500 hover:text-navy-700 transition-colors"
                      >
                        Copy Citation
                      </button>
                      <button
                        onClick={() => handleBookmark(result)}
                        className="text-xs text-navy-500 hover:text-navy-700 transition-colors flex items-center gap-1"
                      >
                        <Bookmark size={12} /> Save to Research
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
