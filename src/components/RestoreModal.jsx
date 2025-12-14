import { AlertTriangle, Save, Trash2 } from 'lucide-react';

const RestoreModal = ({ isOpen, onRestore, onDiscard }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-500/10 rounded-full">
             <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Unsaved Work Found</h2>
        </div>
        
        <p className="text-neutral-400 mb-6 leading-relaxed">
          We found an unsaved project in your local storage. Would you like to restore the latest version or discard it and start fresh?
        </p>
        
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onDiscard}
            className="px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Trash2 size={16} />
            Discard
          </button>
          <button 
            onClick={onRestore}
            className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Save size={16} />
            Restore Latest Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreModal;