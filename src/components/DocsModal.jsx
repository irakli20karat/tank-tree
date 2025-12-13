import { X, MousePointer2, Move, Link, Image as ImageIcon } from 'lucide-react';

export default function DocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-950/30">
          <h2 className="text-xl font-bold tracking-widest text-neutral-200 uppercase flex items-center gap-2">
            Operational Manual
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 text-neutral-300">

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">
              Interaction & Movement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex gap-4 p-4 rounded bg-neutral-950/50 border border-neutral-800/50 hover:border-neutral-700 transition-colors">
                <div className="bg-neutral-800 h-10 w-10 flex items-center justify-center rounded text-blue-400 shrink-0">
                  <MousePointer2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-200 text-sm">Selection Modes</h4>
                  <ul className="text-xs text-neutral-400 mt-2 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-neutral-300">Click:</strong> Select single tank.</li>
                    <li><strong className="text-neutral-300">Ctrl/Cmd + Click:</strong> Toggle multiple selection.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded bg-neutral-950/50 border border-neutral-800/50 hover:border-neutral-700 transition-colors">
                <div className="bg-neutral-800 h-10 w-10 flex items-center justify-center rounded text-green-400 shrink-0">
                  <Move size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-200 text-sm">Grid Repositioning</h4>
                  <p className="text-xs text-neutral-400 mt-2">
                    Drag any tank to move it. 
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 italic">
                    <span className="text-green-500/80 font-semibold">Tip:</span> If multiple tanks are selected, dragging the "Leader" moves the entire formation together, preserving relative positions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">
              Logistics & Visuals
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4 p-4 rounded bg-blue-950/10 border border-blue-900/20">
                <div className="bg-blue-500/10 h-10 w-10 flex items-center justify-center rounded text-blue-400 shrink-0 border border-blue-500/20">
                  <Link size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-100 text-sm">Tech Tree Linking</h4>
                  <p className="text-xs text-blue-200/70 mt-2">
                    Establish parent/child requirements for vehicle research.
                  </p>
                  <div className="mt-2 p-2 bg-blue-950/30 rounded border border-blue-500/10 text-[10px] font-mono text-blue-300">
                    Hold <span className="text-white font-bold">ALT</span> + Click Parent <br/>
                    &darr; <br/>
                    Click Child
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded bg-purple-950/10 border border-purple-900/20">
                <div className="bg-purple-500/10 h-10 w-10 flex items-center justify-center rounded text-purple-400 shrink-0 border border-purple-500/20">
                  <ImageIcon size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-purple-100 text-sm">Visual Customization</h4>
                  <p className="text-xs text-purple-200/70 mt-2">
                    Select a tank to access the Sidebar uploaders.
                  </p>
                  <ul className="text-xs text-purple-300/60 mt-2 space-y-1 list-disc list-inside">
                    <li><strong className="text-purple-200">Tank Sprite:</strong> The central vehicle image.</li>
                    <li><strong className="text-purple-200">Background:</strong> An atmospheric backdrop specific to that card.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] uppercase font-mono tracking-tight text-neutral-500 pt-2">
            <div className="p-2 border border-neutral-800/50 rounded bg-neutral-950 text-center">
              <span className="block text-neutral-300 font-bold">Red Border</span>
              Overlap Conflict
            </div>
            <div className="p-2 border border-neutral-800/50 rounded bg-neutral-950 text-center">
              <span className="block text-neutral-300 font-bold">Orange Border</span>
              Blocking Conflict
            </div>
            <div className="p-2 border border-neutral-800/50 rounded bg-neutral-950 text-center">
              <span className="block text-blue-400 font-bold">Blue Dashed</span>
              Linking Mode
            </div>
            <div className="p-2 border border-neutral-800/50 rounded bg-neutral-950 text-center">
              <span className="block text-yellow-500 font-bold">Yellow Solid</span>
              Selected
            </div>
          </section>

        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-200 hover:bg-white text-neutral-950 font-bold rounded text-sm transition-colors shadow-lg shadow-white/5"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}