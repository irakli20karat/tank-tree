import { AlertTriangle, XCircle, X } from 'lucide-react';

export default function StorageWarning({ warning, onDismiss }) {
    if (!warning) return null;

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full mx-4 ${warning.type === 'error'
                ? 'bg-red-900/90 border-red-700'
                : 'bg-yellow-900/90 border-yellow-700'
            } border rounded-lg shadow-2xl backdrop-blur-sm`}>
            <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 mt-0.5">
                    {warning.type === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold mb-1 text-sm ${warning.type === 'error' ? 'text-red-200' : 'text-yellow-200'
                        }`}>
                        {warning.type === 'error' ? 'Storage Limit Exceeded' : 'Warning'}
                    </h3>
                    <p className="text-xs text-neutral-200 leading-relaxed">
                        {warning.message}
                    </p>
                </div>
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}