import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

interface ProviderConfig {
  enabled: boolean;
  api_key: string;
  model: string;
  endpoint: string;
}

interface LLMConfig {
  active_provider: string;
  fallback_chain: string[];
  ollama: ProviderConfig;
  anthropic: ProviderConfig;
  openai: ProviderConfig;
  azure_openai: ProviderConfig;
}

interface ProviderStatus {
  provider: string;
  available: boolean;
  model: string;
  error: string;
}

const PROVIDERS = [
  { key: 'ollama', label: 'Ollama (Local)', description: 'Free, private, runs on your machine' },
  { key: 'anthropic', label: 'Anthropic (Claude)', description: 'Claude models via API' },
  { key: 'openai', label: 'OpenAI', description: 'GPT-4o and other models' },
  { key: 'azure_openai', label: 'Azure OpenAI', description: 'OpenAI models via Azure' },
] as const;

export default function LLMProvidersTab() {
  const { user } = useAuth();
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [statuses, setStatuses] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      api.getLLMConfig(),
      api.getLLMProviderStatus(),
    ]).then(([cfg, st]) => {
      setConfig(cfg);
      setStatuses(st.providers || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <p className="text-sm text-amber-700">Only organization admins can configure LLM providers.</p>
      </div>
    );
  }

  if (loading || !config) {
    return <div className="text-center py-8 text-navy-500">Loading configuration...</div>;
  }

  const updateProvider = (key: string, field: string, value: string | boolean) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key]: { ...(prev as any)[key], [field]: value },
      };
    });
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setMessage('');
    try {
      await api.updateLLMConfig(config);
      setMessage('Configuration saved successfully');
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const testProviders = async () => {
    setTesting(true);
    try {
      const res = await api.getLLMProviderStatus();
      setStatuses(res.providers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  const getStatus = (key: string) => statuses.find((s) => s.provider === key);

  return (
    <div className="space-y-6">
      {PROVIDERS.map(({ key, label, description }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg = (config as any)[key];
        const status = getStatus(key);

        return (
          <div key={key} className="bg-white rounded-lg border border-navy-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-navy-900">{label}</h3>
                {status && (
                  status.available
                    ? <CheckCircle size={16} className="text-green-500" />
                    : <XCircle size={16} className="text-red-400" />
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.enabled}
                  onChange={(e) => updateProvider(key, 'enabled', e.target.checked)}
                  className="rounded border-navy-300"
                />
                <span className="text-sm text-navy-600">Enabled</span>
              </label>
            </div>
            <p className="text-xs text-navy-500 mb-3">{description}</p>

            {cfg.enabled && key !== 'ollama' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-navy-500 mb-1">API Key</label>
                  <input
                    type="password"
                    value={cfg.api_key}
                    onChange={(e) => updateProvider(key, 'api_key', e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-navy-500 mb-1">Model</label>
                  <input
                    type="text"
                    value={cfg.model}
                    onChange={(e) => updateProvider(key, 'model', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                {key === 'azure_openai' && (
                  <div className="col-span-2">
                    <label className="block text-xs text-navy-500 mb-1">Endpoint</label>
                    <input
                      type="text"
                      value={cfg.endpoint}
                      onChange={(e) => updateProvider(key, 'endpoint', e.target.value)}
                      placeholder="https://your-resource.openai.azure.com/"
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                    />
                  </div>
                )}
              </div>
            )}

            {cfg.enabled && key === 'ollama' && (
              <div>
                <label className="block text-xs text-navy-500 mb-1">Model</label>
                <input
                  type="text"
                  value={cfg.model}
                  onChange={(e) => updateProvider(key, 'model', e.target.value)}
                  className="w-full max-w-xs px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
            )}
          </div>
        );
      })}

      {message && (
        <div className={`text-sm p-3 rounded-lg ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-navy-800 text-white rounded-lg font-medium hover:bg-navy-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={testProviders}
          disabled={testing}
          className="px-6 py-2.5 border border-navy-200 text-navy-700 rounded-lg font-medium hover:bg-navy-50 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {testing ? <Loader2 size={14} className="animate-spin" /> : null}
          Test All Providers
        </button>
      </div>
    </div>
  );
}
