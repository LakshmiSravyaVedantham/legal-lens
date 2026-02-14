import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, ShieldAlert, ClipboardCheck, Scale,
  Clock,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import AIPanel, { RiskBadge, ChecklistBadge } from '../components/AIPanel';
import type {
  AISummary, AIRiskAnalysis, AIChecklist, AIObligations, AITimeline,
} from '../types';

type Tab = 'summary' | 'risks' | 'checklist' | 'obligations' | 'timeline';
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'summary', label: 'Summary', icon: <Sparkles size={14} /> },
  { key: 'risks', label: 'Risk Analysis', icon: <ShieldAlert size={14} /> },
  { key: 'checklist', label: 'Checklist', icon: <ClipboardCheck size={14} /> },
  { key: 'obligations', label: 'Obligations', icon: <Scale size={14} /> },
  { key: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
];

export default function AIInsights() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<Record<string, any>>({});
  const [docName, setDocName] = useState('');
  const { toast } = useToast();

  // Load document name
  useEffect(() => {
    if (!id) return;
    api.getDocumentContent(id).then((d) => setDocName(d.filename)).catch(() => {});
    // Try loading cached analyses
    api.getAllAnalyses(id).then((res) => {
      const loaded: Record<string, any> = {};
      for (const [type, val] of Object.entries(res.analyses)) {
        loaded[type] = { ...val.result, cached: true, document_id: id, analysis_type: type };
      }
      setData(loaded);
    }).catch(() => {});
  }, [id]);

  const runAnalysis = async (type: Tab, force = false) => {
    if (!id) return;
    setLoading((p) => ({ ...p, [type]: true }));
    try {
      const result = await api.runAnalysis(id, type, force);
      setData((p) => ({ ...p, [type]: result }));
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setLoading((p) => ({ ...p, [type]: false }));
    }
  };

  const runAll = async () => {
    if (!id) return;
    for (const tab of TABS) {
      if (!data[tab.key]) runAnalysis(tab.key);
    }
  };

  const summary = data.summary as AISummary | undefined;
  const risks = data.risks as AIRiskAnalysis | undefined;
  const checklist = data.checklist as AIChecklist | undefined;
  const obligations = data.obligations as AIObligations | undefined;
  const timeline = data.timeline as AITimeline | undefined;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to={`/documents/${id}`} className="flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700 mb-3">
          <ArrowLeft size={16} /> Back to Document
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-50 rounded-lg">
              <Sparkles size={20} className="text-gold-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-900">AI Insights</h1>
              {docName && <p className="text-sm text-navy-500">{docName}</p>}
            </div>
          </div>
          <button
            onClick={runAll}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition-colors"
          >
            <Sparkles size={14} /> Run All Analyses
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-navy-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (!data[tab.key] && !loading[tab.key]) runAnalysis(tab.key);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-gold-500 text-navy-900'
                : 'border-transparent text-navy-500 hover:text-navy-700 hover:border-navy-200'
            }`}
          >
            {tab.icon} {tab.label}
            {data[tab.key] && <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === 'summary' && (
          <AIPanel
            title="Document Summary"
            loading={loading.summary}
            cached={summary?.cached}
            onRefresh={() => runAnalysis('summary', true)}
          >
            {summary ? (
              <div className="space-y-4">
                {summary.title && <h3 className="font-semibold text-navy-900 text-base">{summary.title}</h3>}
                {summary.document_type && (
                  <span className="inline-block text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-medium">
                    {summary.document_type}
                  </span>
                )}
                <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap">{summary.summary}</p>
                {summary.key_points?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">Key Points</h4>
                    <ul className="space-y-1.5">
                      {summary.key_points.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-navy-700">
                          <span className="text-gold-500 mt-0.5">&#8226;</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.parties?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">Parties</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {summary.parties.map((p, i) => (
                        <span key={i} className="text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState onRun={() => runAnalysis('summary')} label="Generate Summary" />
            )}
          </AIPanel>
        )}

        {activeTab === 'risks' && (
          <AIPanel
            title="Risk Analysis"
            icon={<ShieldAlert size={16} className="text-red-500" />}
            loading={loading.risks}
            cached={risks?.cached}
            onRefresh={() => runAnalysis('risks', true)}
          >
            {risks ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-navy-600">Overall Risk:</span>
                    <RiskBadge level={risks.overall_risk} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-navy-600">Score:</span>
                    <span className="text-sm font-bold text-navy-800">{risks.risk_score}/100</span>
                  </div>
                  <div className="flex-1 bg-navy-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        risks.risk_score >= 70 ? 'bg-red-500' : risks.risk_score >= 40 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${risks.risk_score}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-navy-600">{risks.summary}</p>
                {risks.risks?.length > 0 && (
                  <div className="space-y-3">
                    {risks.risks.map((r, i) => (
                      <div key={i} className="border border-navy-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-navy-800">{r.clause}</p>
                          <RiskBadge level={r.risk_level} />
                        </div>
                        <p className="text-xs text-navy-600 mb-1">{r.description}</p>
                        <p className="text-xs text-navy-500 italic">{r.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState onRun={() => runAnalysis('risks')} label="Run Risk Analysis" />
            )}
          </AIPanel>
        )}

        {activeTab === 'checklist' && (
          <AIPanel
            title="Contract Review Checklist"
            icon={<ClipboardCheck size={16} className="text-navy-600" />}
            loading={loading.checklist}
            cached={checklist?.cached}
            onRefresh={() => runAnalysis('checklist', true)}
          >
            {checklist ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-navy-600">Score:</span>
                  <span className="text-lg font-bold text-navy-800">{checklist.score}%</span>
                  <div className="flex-1 bg-navy-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${checklist.score}%` }} />
                  </div>
                </div>
                <p className="text-sm text-navy-600">{checklist.summary}</p>
                {checklist.checklist?.length > 0 && (
                  <div className="divide-y divide-navy-50">
                    {checklist.checklist.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 py-2">
                        <div className="mt-0.5 w-5 text-center">
                          <ChecklistBadge status={item.status} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-navy-800">{item.provision}</p>
                            {item.section && (
                              <span className="text-xs text-navy-400">{item.section}</span>
                            )}
                          </div>
                          <p className="text-xs text-navy-600">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState onRun={() => runAnalysis('checklist')} label="Run Checklist Review" />
            )}
          </AIPanel>
        )}

        {activeTab === 'obligations' && (
          <AIPanel
            title="Obligations & Deadlines"
            icon={<Scale size={16} className="text-navy-600" />}
            loading={loading.obligations}
            cached={obligations?.cached}
            onRefresh={() => runAnalysis('obligations', true)}
          >
            {obligations ? (
              <div className="space-y-4">
                <p className="text-sm text-navy-600">{obligations.summary}</p>
                {obligations.upcoming_deadlines?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Upcoming Deadlines</h4>
                    <div className="space-y-1.5">
                      {obligations.upcoming_deadlines.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded px-3 py-1.5 text-sm">
                          <Clock size={13} className="text-red-500" />
                          <span className="font-medium text-red-700">{d.date}</span>
                          <span className="text-red-600">{d.description}</span>
                          {d.party && <span className="text-xs text-red-500 ml-auto">{d.party}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {obligations.obligations?.length > 0 && (
                  <div className="space-y-2">
                    {obligations.obligations.map((o, i) => (
                      <div key={i} className="border border-navy-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-navy-100 text-navy-600 px-2 py-0.5 rounded">{o.party}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            o.priority === 'high' ? 'bg-red-100 text-red-600' :
                            o.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                            'bg-green-100 text-green-600'
                          }`}>{o.priority}</span>
                          <span className="text-xs text-navy-400">{o.type}</span>
                        </div>
                        <p className="text-sm text-navy-700">{o.obligation}</p>
                        {o.deadline && <p className="text-xs text-navy-500 mt-1">Deadline: {o.deadline}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState onRun={() => runAnalysis('obligations')} label="Extract Obligations" />
            )}
          </AIPanel>
        )}

        {activeTab === 'timeline' && (
          <AIPanel
            title="Document Timeline"
            icon={<Clock size={16} className="text-navy-600" />}
            loading={loading.timeline}
            cached={timeline?.cached}
            onRefresh={() => runAnalysis('timeline', true)}
          >
            {timeline ? (
              <div className="space-y-4">
                {timeline.duration && (
                  <p className="text-sm text-navy-600">Duration: <span className="font-medium">{timeline.duration}</span></p>
                )}
                <p className="text-sm text-navy-600">{timeline.key_dates_summary}</p>
                {timeline.events?.length > 0 && (
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-navy-200" />
                    {timeline.events.map((ev, i) => (
                      <div key={i} className="relative mb-4">
                        <div className="absolute -left-4 top-1 w-3 h-3 bg-gold-400 rounded-full border-2 border-white" />
                        <div className="ml-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-navy-800">{ev.date}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              ev.category === 'deadline' ? 'bg-red-100 text-red-600' :
                              ev.category === 'payment' ? 'bg-green-100 text-green-600' :
                              ev.category === 'termination' ? 'bg-amber-100 text-amber-600' :
                              'bg-navy-100 text-navy-600'
                            }`}>{ev.category}</span>
                          </div>
                          <p className="text-sm text-navy-600">{ev.event}</p>
                          {ev.party && <p className="text-xs text-navy-400">{ev.party}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState onRun={() => runAnalysis('timeline')} label="Extract Timeline" />
            )}
          </AIPanel>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onRun, label }: { onRun: () => void; label: string }) {
  return (
    <div className="text-center py-6">
      <Sparkles size={24} className="mx-auto text-gold-300 mb-2" />
      <p className="text-sm text-navy-400 mb-3">No analysis generated yet</p>
      <button
        onClick={onRun}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition-colors"
      >
        <Sparkles size={14} /> {label}
      </button>
    </div>
  );
}
