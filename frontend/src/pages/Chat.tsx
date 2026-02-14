import { useEffect, useRef, useState } from 'react';
import { Send, FileText, AlertTriangle, Trash2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import type { Citation, ChatStatus } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  followUps?: string[];
}

const SUGGESTED_QUESTIONS = [
  'What are the key terms and conditions?',
  'Summarize the main obligations of each party.',
  'Are there any indemnification clauses?',
  'What are the termination provisions?',
  'What deadlines or time limits are mentioned?',
  'Are there any confidentiality requirements?',
];

export default function Chat() {
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChatStatus().then(setStatus).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (q?: string) => {
    const query = (q || input).trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await api.chat({ query });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer, citations: res.citations, followUps: res.follow_up_suggestions },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedCitation(null);
  };

  const renderAnswer = (text: string, citations?: Citation[]) => {
    if (!citations?.length) return <p className="whitespace-pre-wrap">{text}</p>;

    const parts = text.split(/(\[\d+\])/g);
    return (
      <p className="whitespace-pre-wrap leading-relaxed">
        {parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (match) {
            const idx = parseInt(match[1]) - 1;
            const citation = citations[idx];
            return (
              <button
                key={i}
                onClick={() => citation && setSelectedCitation(citation)}
                className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded ml-0.5 transition-colors ${
                  selectedCitation === citation
                    ? 'bg-gold-500 text-white'
                    : 'bg-gold-400 text-navy-900 hover:bg-gold-300'
                }`}
                title={citation ? `${citation.document_name}, Page ${citation.page}` : ''}
              >
                {match[1]}
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  if (status && !status.ollama_available) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-900">Document Q&A</h1>
          <p className="text-navy-500 mt-1">Ask questions about your documents</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertTriangle size={36} className="mx-auto text-amber-500 mb-3" />
          <h2 className="font-semibold text-amber-800 mb-2">No LLM Provider Available</h2>
          <p className="text-sm text-amber-700 mb-4">
            Document Q&A requires an LLM provider. Configure one in Settings or start Ollama locally.
          </p>
          <div className="bg-white rounded-lg p-4 text-left text-sm text-navy-700 space-y-2 max-w-md mx-auto">
            <p className="font-medium">Options:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Go to <span className="font-semibold">Settings → LLM Providers</span> to configure Claude or OpenAI</li>
              <li>Or install Ollama from <span className="font-mono text-navy-600">ollama.ai</span> and run: <code className="bg-navy-100 px-1.5 py-0.5 rounded text-xs">ollama pull llama3.1:8b</code></li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Chat panel */}
      <div className="flex-1 flex flex-col">
        <div className="p-5 border-b border-navy-200 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-navy-900">Document Q&A</h1>
            <p className="text-xs text-navy-500">Ask questions — answers cite specific documents and pages</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-600 transition-colors"
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="mt-8">
              <div className="text-center text-navy-400 mb-8">
                <Sparkles size={32} className="mx-auto mb-2 text-gold-400" />
                <p className="text-base mb-1">Ask a question about your documents</p>
                <p className="text-sm">Answers include citations to specific pages and paragraphs.</p>
              </div>
              <div className="max-w-lg mx-auto">
                <p className="text-xs text-navy-400 font-medium uppercase tracking-wider mb-3">Suggested questions</p>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="text-left px-4 py-2.5 text-sm bg-white border border-navy-200 rounded-lg text-navy-700 hover:border-navy-400 hover:bg-navy-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-2xl rounded-lg px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-navy-800 text-white'
                    : 'bg-white border border-navy-200 text-navy-800'
                }`}
              >
                {msg.role === 'assistant'
                  ? renderAnswer(msg.content, msg.citations)
                  : <p>{msg.content}</p>
                }
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-navy-100 flex flex-wrap gap-1">
                    {msg.citations.map((c, ci) => (
                      <button
                        key={ci}
                        onClick={() => setSelectedCitation(c)}
                        className="text-xs text-navy-500 bg-navy-50 px-2 py-0.5 rounded hover:bg-navy-100 transition-colors"
                      >
                        [{ci + 1}] {c.document_name}{c.page ? `, p.${c.page}` : ''}
                      </button>
                    ))}
                  </div>
                )}
                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-navy-100">
                    <p className="text-xs text-navy-400 mb-1.5">Follow-up questions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.followUps.map((q, qi) => (
                        <button
                          key={qi}
                          onClick={() => handleSend(q)}
                          className="text-xs bg-gold-50 border border-gold-200 text-gold-700 px-2.5 py-1 rounded-full hover:bg-gold-100 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-navy-200 rounded-lg px-4 py-3 text-sm text-navy-500">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </span>
                <span className="ml-2">Analyzing documents</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-navy-200 bg-white">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question about your documents..."
              className="flex-1 px-4 py-2.5 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-navy-800 text-white rounded-lg hover:bg-navy-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Citation detail panel */}
      <div className="w-80 border-l border-navy-200 bg-white overflow-y-auto hidden lg:block">
        <div className="p-4 border-b border-navy-100">
          <h2 className="text-sm font-semibold text-navy-700">Citation Detail</h2>
        </div>
        {selectedCitation ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-navy-500" />
              <span className="text-sm font-medium text-navy-800">{selectedCitation.document_name}</span>
            </div>
            {selectedCitation.page && (
              <p className="text-xs text-navy-500">
                Page {selectedCitation.page}
                {selectedCitation.paragraph ? `, Paragraph ${selectedCitation.paragraph}` : ''}
              </p>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-navy-100 rounded-full h-1.5">
                <div
                  className="bg-gold-400 h-1.5 rounded-full"
                  style={{ width: `${selectedCitation.score * 100}%` }}
                />
              </div>
              <span className="text-xs text-navy-400">
                {(selectedCitation.score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bg-navy-50 rounded-lg p-3 mt-2">
              <p className="text-sm text-navy-700 leading-relaxed">{selectedCitation.text}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-navy-400 text-sm">
            <FileText size={24} className="mx-auto mb-2 opacity-50" />
            Click a citation number to view the source text
          </div>
        )}
      </div>
    </div>
  );
}
