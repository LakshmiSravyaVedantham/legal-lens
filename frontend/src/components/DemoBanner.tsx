import { useState, useEffect } from 'react';
import { isDemoMode } from '../lib/api';
import { Info, X } from 'lucide-react';

export default function DemoBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check after a short delay so api.ts has time to detect demo mode
    const timer = setTimeout(() => setVisible(isDemoMode()), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Re-check periodically in case state flips after first API call
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDemoMode() && !visible) setVisible(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible || dismissed) return null;

  return (
    <div className="bg-gold-50 border-b border-gold-200 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gold-800">
        <Info size={16} />
        <span>
          <strong>Demo Mode</strong> — You're viewing LegalLens with sample data.
          Deploy locally with a backend for full functionality.
        </span>
      </div>
      <button onClick={() => setDismissed(true)} className="text-gold-600 hover:text-gold-800">
        <X size={16} />
      </button>
    </div>
  );
}
