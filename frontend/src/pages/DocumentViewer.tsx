import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, BookOpen, Scale, Calendar, DollarSign,
  Users, MapPin, Tag, Hash, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import type { DocumentContent, KeyTerms, MatterTag } from '../types';

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<DocumentContent | null>(null);
  const [keyTerms, setKeyTerms] = useState<KeyTerms | null>(null);
  const [matter, setMatter] = useState<MatterTag>({ matter: '', client: '', tags: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [showIntel, setShowIntel] = useState(true);
  const [editingMatter, setEditingMatter] = useState(false);
  const { toast } = useToast();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getDocumentContent(id),
      api.getKeyTerms(id).catch(() => null),
      api.getMatterTag(id).catch(() => ({ matter: '', client: '', tags: [] })),
    ])
      .then(([doc, terms, matterData]) => {
        setContent(doc);
        setKeyTerms(terms);
        setMatter(matterData);
        setActivePage(0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveMatter = async () => {
    if (!id) return;
    try {
      await api.setMatterTag(id, matter);
      toast('success', 'Matter information saved');
      setEditingMatter(false);
    } catch (e: unknown) {
      toast('error', e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse text-navy-400">Loading document...</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link to="/documents" className="flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700 mb-6">
          <ArrowLeft size={16} /> Back to Documents
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error || 'Document not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: Page navigator */}
      {content.total_pages > 1 && (
        <div className="w-44 border-r border-navy-200 bg-white overflow-y-auto shrink-0">
          <div className="p-3 border-b border-navy-100">
            <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Pages</p>
          </div>
          {content.pages.map((page, i) => (
            <button
              key={i}
              onClick={() => setActivePage(i)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-navy-50 transition-colors ${
                activePage === i
                  ? 'bg-navy-100 text-navy-900 font-medium border-l-2 border-l-gold-400'
                  : 'text-navy-600 hover:bg-navy-50'
              }`}
            >
              Page {page.page_number}
            </button>
          ))}
        </div>
      )}

      {/* Center: Document content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 border-b border-navy-200 bg-white">
          <Link to="/documents" className="flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700 mb-3">
            <ArrowLeft size={16} /> Back to Documents
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-100 rounded-lg">
              <FileText size={20} className="text-navy-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-navy-900">{content.filename}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-navy-500">{content.total_pages} page{content.total_pages !== 1 ? 's' : ''}</span>
                {keyTerms?.document_type && (
                  <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-medium">
                    {keyTerms.document_type}
                  </span>
                )}
                {matter.matter && (
                  <span className="text-xs bg-navy-100 text-navy-600 px-2 py-0.5 rounded-full">
                    {matter.client ? `${matter.client} / ` : ''}{matter.matter}
                  </span>
                )}
              </div>
            </div>
            <Link
              to={`/documents/${id}/ai`}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-50 text-gold-700 border border-gold-200 rounded-lg hover:bg-gold-100 transition-colors font-medium"
            >
              <Sparkles size={14} /> AI Insights
            </Link>
          </div>
        </div>

        <div className="p-6 max-w-4xl">
          {/* Matter tagging */}
          <div className="bg-white rounded-lg border border-navy-200 shadow-sm mb-4">
            <button
              onClick={() => setEditingMatter(!editingMatter)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-navy-700"
            >
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-navy-400" />
                <span>Client / Matter</span>
                {!editingMatter && matter.matter && (
                  <span className="text-xs text-navy-400 font-normal ml-2">
                    {matter.client ? `${matter.client} / ` : ''}{matter.matter}
                  </span>
                )}
              </div>
              {editingMatter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {editingMatter && (
              <div className="px-5 pb-4 border-t border-navy-100 pt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-navy-500 mb-1 block">Client Name</label>
                  <input
                    type="text"
                    value={matter.client}
                    onChange={(e) => setMatter({ ...matter, client: e.target.value })}
                    placeholder="e.g. Acme Corp."
                    className="w-full px-3 py-1.5 border border-navy-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-navy-500 mb-1 block">Matter Number</label>
                  <input
                    type="text"
                    value={matter.matter}
                    onChange={(e) => setMatter({ ...matter, matter: e.target.value })}
                    placeholder="e.g. 2024-001"
                    className="w-full px-3 py-1.5 border border-navy-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={saveMatter}
                    className="px-4 py-1.5 text-xs bg-navy-800 text-white rounded hover:bg-navy-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Document text */}
          {content.pages.length === 0 ? (
            <div className="text-center py-12 text-navy-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
              <p>No text content extracted from this document.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-navy-200 shadow-sm">
              <div className="px-5 py-3 border-b border-navy-100 flex items-center justify-between">
                <span className="text-sm font-medium text-navy-700">
                  Page {content.pages[activePage].page_number}
                </span>
                <span className="text-xs text-navy-400">
                  {activePage + 1} of {content.total_pages}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-navy-800 leading-relaxed whitespace-pre-wrap">
                  {content.pages[activePage].text}
                </p>
              </div>
              {content.total_pages > 1 && (
                <div className="px-5 py-3 border-t border-navy-100 flex justify-between">
                  <button
                    onClick={() => setActivePage((p) => Math.max(0, p - 1))}
                    disabled={activePage === 0}
                    className="text-sm text-navy-600 hover:text-navy-800 disabled:text-navy-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setActivePage((p) => Math.min(content.total_pages - 1, p + 1))}
                    disabled={activePage === content.total_pages - 1}
                    className="text-sm text-navy-600 hover:text-navy-800 disabled:text-navy-300"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Document Intelligence panel */}
      <div className="w-72 border-l border-navy-200 bg-white overflow-y-auto shrink-0 hidden xl:block">
        <button
          onClick={() => setShowIntel(!showIntel)}
          className="w-full flex items-center justify-between p-4 border-b border-navy-100 text-sm font-semibold text-navy-700"
        >
          <div className="flex items-center gap-2">
            <Scale size={14} className="text-gold-500" />
            Document Intelligence
          </div>
          {showIntel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showIntel && keyTerms && (
          <div className="divide-y divide-navy-50">
            {/* Document Type */}
            <IntelSection
              icon={<FileText size={13} className="text-navy-400" />}
              title="Document Type"
            >
              <span className="text-sm font-medium text-navy-800">{keyTerms.document_type}</span>
            </IntelSection>

            {/* Parties */}
            {keyTerms.parties.length > 0 && (
              <IntelSection
                icon={<Users size={13} className="text-navy-400" />}
                title="Parties"
                count={keyTerms.parties.length}
              >
                {keyTerms.parties.map((p, i) => (
                  <span key={i} className="inline-block text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded mr-1 mb-1">
                    {p}
                  </span>
                ))}
              </IntelSection>
            )}

            {/* Key Dates */}
            {keyTerms.dates.length > 0 && (
              <IntelSection
                icon={<Calendar size={13} className="text-navy-400" />}
                title="Key Dates"
                count={keyTerms.dates.length}
              >
                {keyTerms.dates.map((d, i) => (
                  <p key={i} className="text-xs text-navy-700">{d}</p>
                ))}
              </IntelSection>
            )}

            {/* Monetary Amounts */}
            {keyTerms.monetary_amounts.length > 0 && (
              <IntelSection
                icon={<DollarSign size={13} className="text-navy-400" />}
                title="Monetary Amounts"
                count={keyTerms.monetary_amounts.length}
              >
                {keyTerms.monetary_amounts.map((a, i) => (
                  <p key={i} className="text-xs text-navy-700 font-mono">{a}</p>
                ))}
              </IntelSection>
            )}

            {/* Defined Terms */}
            {keyTerms.defined_terms.length > 0 && (
              <IntelSection
                icon={<Hash size={13} className="text-navy-400" />}
                title="Defined Terms"
                count={keyTerms.defined_terms.length}
              >
                {keyTerms.defined_terms.map((t, i) => (
                  <span key={i} className="inline-block text-xs bg-gold-50 text-gold-700 px-2 py-0.5 rounded mr-1 mb-1">
                    {t}
                  </span>
                ))}
              </IntelSection>
            )}

            {/* Governing Law */}
            {keyTerms.governing_law.length > 0 && (
              <IntelSection
                icon={<MapPin size={13} className="text-navy-400" />}
                title="Governing Law"
              >
                {keyTerms.governing_law.map((g, i) => (
                  <p key={i} className="text-xs text-navy-700">{g}</p>
                ))}
              </IntelSection>
            )}

            {/* Legal References */}
            {keyTerms.references.length > 0 && (
              <IntelSection
                icon={<Scale size={13} className="text-navy-400" />}
                title="Legal References"
                count={keyTerms.references.length}
              >
                {keyTerms.references.map((r, i) => (
                  <p key={i} className="text-xs text-navy-700 font-mono">{r}</p>
                ))}
              </IntelSection>
            )}
          </div>
        )}

        {showIntel && !keyTerms && (
          <div className="p-4 text-center text-sm text-navy-400">
            No key terms extracted yet.
          </div>
        )}
      </div>
    </div>
  );
}

function IntelSection({
  icon, title, count, children,
}: {
  icon: React.ReactNode; title: string; count?: number; children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">{title}</span>
        {count !== undefined && (
          <span className="text-xs text-navy-400 ml-auto">{count}</span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
