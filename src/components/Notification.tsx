import { useEffect } from 'react';
import { useStore } from '../store';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export default function Notification() {
  const { state, clearNotification } = useStore();

  useEffect(() => {
    if (state.notification) {
      const timer = setTimeout(clearNotification, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.notification, clearNotification]);

  if (!state.notification) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-cyber-blue" />,
  };

  const bgColors = {
    success: 'border-emerald-400/30 bg-emerald-400/5',
    error: 'border-red-400/30 bg-red-400/5',
    info: 'border-cyan-400/30 bg-cyan-400/5',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right">
      <div className={`obsidian-panel ${bgColors[state.notification.type]} px-5 py-4 flex items-center gap-3 min-w-[300px] max-w-[420px]`}>
        {icons[state.notification.type]}
        <p className="text-sm text-white flex-1">{state.notification.message}</p>
        <button onClick={clearNotification} className="text-obsidian-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
