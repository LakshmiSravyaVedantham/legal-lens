/**
 * Demo data for GitHub Pages deployment.
 * When the backend is unreachable, the app uses this mock data
 * so visitors can see the full UI in action.
 */
import type {
  DocumentResponse, DocumentContent, SearchResult, ChatResponse, ChatStatus,
  Stats, Analytics, SystemInfo, RecentSearch, ActivityEntry, KeyTerms,
  ClauseType, ClauseSearchResult, Bookmark, MatterTag, Citation,
} from '../types';

const demoCitations: Citation[] = [
  {
    document_id: 'demo-1',
    document_name: 'Master Services Agreement — Acme Corp.pdf',
    page: 4,
    paragraph: 2,
    text: 'The Service Provider shall indemnify, defend, and hold harmless the Client from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys\' fees) arising out of or related to any breach of this Agreement by the Service Provider.',
    score: 0.92,
  },
  {
    document_id: 'demo-2',
    document_name: 'Software License Agreement.pdf',
    page: 7,
    paragraph: 1,
    text: 'IN NO EVENT SHALL EITHER PARTY\'S AGGREGATE LIABILITY UNDER THIS AGREEMENT EXCEED THE TOTAL AMOUNTS PAID OR PAYABLE BY LICENSEE DURING THE TWELVE (12) MONTH PERIOD IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO SUCH LIABILITY.',
    score: 0.87,
  },
  {
    document_id: 'demo-3',
    document_name: 'Employment Agreement — J. Smith.docx',
    page: 3,
    paragraph: 3,
    text: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles. Any disputes arising under this Agreement shall be resolved in the federal or state courts located in Wilmington, Delaware.',
    score: 0.84,
  },
  {
    document_id: 'demo-1',
    document_name: 'Master Services Agreement — Acme Corp.pdf',
    page: 8,
    paragraph: 1,
    text: 'Either party may terminate this Agreement for convenience upon sixty (60) days\' prior written notice to the other party. Upon termination, the Client shall pay the Service Provider for all services rendered through the effective date of termination.',
    score: 0.81,
  },
  {
    document_id: 'demo-4',
    document_name: 'Non-Disclosure Agreement.pdf',
    page: 2,
    paragraph: 2,
    text: '"Confidential Information" means any and all non-public, proprietary, or confidential information disclosed by either party to the other, whether orally, in writing, or by inspection of tangible objects, including but not limited to trade secrets, business plans, financial data, and customer lists.',
    score: 0.79,
  },
];

export const demoData = {
  documents: (): DocumentResponse => ({
    documents: [
      { id: 'demo-1', filename: 'Master Services Agreement — Acme Corp.pdf', file_type: '.pdf', file_size: 245760, page_count: 12, chunk_count: 34, status: 'ready', error_message: null, uploaded_at: new Date(Date.now() - 86400000).toISOString(), processed_at: new Date(Date.now() - 86000000).toISOString() },
      { id: 'demo-2', filename: 'Software License Agreement.pdf', file_type: '.pdf', file_size: 189440, page_count: 9, chunk_count: 26, status: 'ready', error_message: null, uploaded_at: new Date(Date.now() - 172800000).toISOString(), processed_at: new Date(Date.now() - 172400000).toISOString() },
      { id: 'demo-3', filename: 'Employment Agreement — J. Smith.docx', file_type: '.docx', file_size: 98304, page_count: 5, chunk_count: 15, status: 'ready', error_message: null, uploaded_at: new Date(Date.now() - 259200000).toISOString(), processed_at: new Date(Date.now() - 258800000).toISOString() },
      { id: 'demo-4', filename: 'Non-Disclosure Agreement.pdf', file_type: '.pdf', file_size: 61440, page_count: 3, chunk_count: 9, status: 'ready', error_message: null, uploaded_at: new Date(Date.now() - 345600000).toISOString(), processed_at: new Date(Date.now() - 345200000).toISOString() },
      { id: 'demo-5', filename: 'Board Resolution — Q4 2024.pdf', file_type: '.pdf', file_size: 40960, page_count: 2, chunk_count: 6, status: 'ready', error_message: null, uploaded_at: new Date(Date.now() - 432000000).toISOString(), processed_at: new Date(Date.now() - 431600000).toISOString() },
    ],
    total: 5,
  }),

  documentContent: (): DocumentContent => ({
    id: 'demo-1',
    filename: 'Master Services Agreement — Acme Corp.pdf',
    pages: [
      { page_number: 1, text: 'MASTER SERVICES AGREEMENT\n\nThis Master Services Agreement ("Agreement") is entered into as of January 15, 2024 ("Effective Date"), by and between:\n\nAcme Corporation, a Delaware corporation ("Client"), with principal offices at 100 Innovation Drive, Wilmington, DE 19801;\n\nand\n\nTechServ Solutions LLC, a California limited liability company ("Service Provider"), with principal offices at 500 Market Street, San Francisco, CA 94105.\n\nWHEREAS, Client desires to engage Service Provider to provide certain professional services; and\n\nWHEREAS, Service Provider has the expertise and resources to provide such services;\n\nNOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, the parties agree as follows:' },
      { page_number: 2, text: '1. DEFINITIONS\n\n1.1 "Services" means the professional, technical, and consulting services to be provided by Service Provider as described in one or more Statements of Work.\n\n1.2 "Statement of Work" or "SOW" means a document executed by both parties that describes the specific Services to be performed, deliverables, timelines, and fees.\n\n1.3 "Deliverables" means all work product, documents, software, and materials created by Service Provider in the course of performing the Services.\n\n1.4 "Confidential Information" means any non-public information disclosed by either party, including but not limited to trade secrets, business plans, financial data, and technical information.\n\n2. SERVICES\n\n2.1 Service Provider shall perform the Services in a professional and workmanlike manner, consistent with industry standards.\n\n2.2 Service Provider shall assign qualified personnel to perform the Services.' },
    ],
    total_pages: 2,
  }),

  search: (query: string): SearchResult => ({
    query,
    results: demoCitations.filter(() => Math.random() > 0.2),
    total_results: demoCitations.length,
  }),

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  chat: (_query: string): ChatResponse => ({
    answer: `Based on the uploaded documents, I can provide the following analysis:\n\nThe Master Services Agreement between Acme Corporation and TechServ Solutions [1] contains standard indemnification provisions requiring the Service Provider to defend and hold harmless the Client from claims arising out of breach [1]. The agreement also includes a limitation of liability clause capping aggregate liability at twelve months of fees paid [2].\n\nRegarding governing law, the Employment Agreement specifies Delaware law as the governing jurisdiction [3], while the MSA follows similar Delaware choice-of-law provisions.\n\nThe termination provisions allow either party to terminate for convenience with 60 days' written notice [4], with payment obligations surviving through the effective termination date.\n\n*Note: This is demo data. Deploy the backend locally for real document analysis.*`,
    citations: demoCitations.slice(0, 4),
    ollama_available: true,
  }),

  chatStatus: (): ChatStatus => ({
    ollama_available: true,
    message: 'Demo mode — Ollama simulated',
  }),

  stats: (): Stats => ({
    total_documents: 5,
    total_chunks: 90,
    documents_by_status: { ready: 5 },
    documents_by_type: { '.pdf': 4, '.docx': 1 },
    ollama_status: 'connected',
  }),

  analytics: (): Analytics => ({
    search: {
      total_searches: 47,
      average_results: 4.2,
      top_queries: [
        { query: 'indemnification', count: 8 },
        { query: 'termination clause', count: 6 },
        { query: 'governing law delaware', count: 5 },
        { query: 'limitation of liability', count: 4 },
        { query: 'confidentiality obligations', count: 4 },
        { query: 'force majeure', count: 3 },
      ],
    },
    storage: { uploads_bytes: 635904, index_bytes: 167936 },
  }),

  recentSearches: (): { searches: RecentSearch[] } => ({
    searches: [
      { query: 'indemnification hold harmless', result_count: 5, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { query: 'termination for convenience', result_count: 3, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { query: 'governing law delaware', result_count: 4, timestamp: new Date(Date.now() - 14400000).toISOString() },
      { query: 'confidential information definition', result_count: 6, timestamp: new Date(Date.now() - 28800000).toISOString() },
    ],
  }),

  activity: (): { activity: ActivityEntry[] } => ({
    activity: [
      { action: 'search', detail: '"indemnification hold harmless" — 5 results', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { action: 'document_processed', detail: 'Master Services Agreement — 12 pages, 34 chunks', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { action: 'document_uploaded', detail: 'Master Services Agreement — Acme Corp.pdf (0.2 MB)', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { action: 'clause_search', detail: 'Indemnification — 3 results', timestamp: new Date(Date.now() - 90000000).toISOString() },
      { action: 'search', detail: '"governing law delaware" — 4 results', timestamp: new Date(Date.now() - 100000000).toISOString() },
      { action: 'document_processed', detail: 'Software License Agreement — 9 pages, 26 chunks', timestamp: new Date(Date.now() - 172800000).toISOString() },
      { action: 'bookmark_added', detail: 'Master Services Agreement — The Service Provider shall indemnify...', timestamp: new Date(Date.now() - 180000000).toISOString() },
      { action: 'document_uploaded', detail: 'Non-Disclosure Agreement.pdf (0.1 MB)', timestamp: new Date(Date.now() - 345600000).toISOString() },
    ],
  }),

  systemInfo: (): SystemInfo => ({
    python_version: '3.13.0',
    platform: 'macOS-15.3-arm64-arm-64bit',
    machine: 'arm64',
    uploads_dir: '/Users/demo/legal-lens/backend/data/uploads',
    index_dir: '/Users/demo/legal-lens/backend/data/chroma_db',
    uploads_size: 635904,
    index_size: 167936,
  }),

  keyTerms: (): KeyTerms => ({
    document_id: 'demo-1',
    document_name: 'Master Services Agreement — Acme Corp.pdf',
    document_type: 'Contract',
    parties: ['Acme Corporation', 'TechServ Solutions LLC'],
    dates: ['January 15, 2024', 'December 31, 2025'],
    monetary_amounts: ['$500,000', '$2,500,000'],
    defined_terms: ['Services', 'Statement of Work', 'Deliverables', 'Confidential Information', 'Effective Date'],
    governing_law: ['Delaware'],
    references: ['§ 2.1', '§ 4.3', '§ 7.2'],
  }),

  clauses: (): { clauses: ClauseType[] } => ({
    clauses: [
      { id: 'indemnification', name: 'Indemnification', description: 'Clauses requiring one party to compensate the other for losses', queries: [], category: 'Risk Allocation' },
      { id: 'limitation_of_liability', name: 'Limitation of Liability', description: 'Caps on damages and liability exclusions', queries: [], category: 'Risk Allocation' },
      { id: 'termination', name: 'Termination', description: 'Conditions and procedures for ending the agreement', queries: [], category: 'Term & Termination' },
      { id: 'force_majeure', name: 'Force Majeure', description: 'Excuses for non-performance due to extraordinary events', queries: [], category: 'Risk Allocation' },
      { id: 'confidentiality', name: 'Confidentiality / NDA', description: 'Obligations to protect confidential information', queries: [], category: 'Information Protection' },
      { id: 'governing_law', name: 'Governing Law & Jurisdiction', description: 'Choice of law and dispute resolution forum', queries: [], category: 'Dispute Resolution' },
      { id: 'intellectual_property', name: 'Intellectual Property', description: 'Ownership, licensing, and assignment of IP rights', queries: [], category: 'IP & Ownership' },
      { id: 'representations_warranties', name: 'Representations & Warranties', description: 'Statements of fact and promises about conditions', queries: [], category: 'Assurances' },
      { id: 'assignment', name: 'Assignment & Delegation', description: 'Restrictions on transferring rights or obligations', queries: [], category: 'General Provisions' },
      { id: 'notices', name: 'Notices', description: 'Requirements for formal communications between parties', queries: [], category: 'General Provisions' },
      { id: 'non_compete', name: 'Non-Compete / Non-Solicitation', description: 'Restrictions on competition and soliciting clients or employees', queries: [], category: 'Restrictive Covenants' },
      { id: 'payment_terms', name: 'Payment Terms', description: 'Payment schedules, invoicing, late fees', queries: [], category: 'Financial' },
    ],
  }),

  clauseSearch: (clauseId: string): ClauseSearchResult => ({
    clause: { id: clauseId, name: clauseId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), description: '', queries: [], category: '' },
    results: demoCitations.slice(0, 3),
    total_results: 3,
  }),

  bookmarks: (): { bookmarks: Bookmark[] } => ({
    bookmarks: [
      { id: 1, query: 'indemnification', document_name: 'Master Services Agreement — Acme Corp.pdf', page: 4, text: 'The Service Provider shall indemnify, defend, and hold harmless the Client from and against any and all claims, damages, losses...', note: 'Key indemnification clause — review with partner', matter: '2024-001', created_at: new Date(Date.now() - 180000000).toISOString() },
      { id: 2, query: 'governing law', document_name: 'Employment Agreement — J. Smith.docx', page: 3, text: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware...', note: '', matter: '2024-003', created_at: new Date(Date.now() - 260000000).toISOString() },
    ],
  }),

  matterTag: (): MatterTag => ({ matter: '2024-001', client: 'Acme Corporation', tags: ['contract', 'active'] }),
};
