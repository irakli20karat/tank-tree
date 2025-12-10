import { X, MousePointer2, Move, Link, Image as ImageIcon } from 'lucide-react';

export default function DocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
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
              Basic Controls
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4 p-3 rounded bg-neutral-950/50 border border-neutral-800/50">
                <div className="bg-neutral-800 h-10 w-10 flex items-center justify-center rounded text-blue-400 shrink-0">
                  <MousePointer2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-200">Selection</h4>
                  <p className="text-xs text-neutral-400 mt-1">Click any tank to select it. This opens the Sidebar to edit details, stats, and upload images.</p>
                </div>
              </div>

              <div className="flex gap-4 p-3 rounded bg-neutral-950/50 border border-neutral-800/50">
                <div className="bg-neutral-800 h-10 w-10 flex items-center justify-center rounded text-green-400 shrink-0">
                  <Move size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-200">Repositioning</h4>
                  <p className="text-xs text-neutral-400 mt-1">Drag and drop tanks to move them between Tiers or Columns. The grid snaps automatically.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">
              Advanced Actions
            </h3>

            <div className="flex gap-4 p-4 rounded bg-neutral-800/20 border border-blue-900/30">
              <div className="bg-blue-500/10 h-12 w-12 flex items-center justify-center rounded text-blue-400 shrink-0 border border-blue-500/20">
                <Link size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-100">Creating Connections (Parents/Children)</h4>
                <p className="text-sm text-neutral-300 mt-2">
                  Hold <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-xs font-mono text-neutral-200 mx-1">Alt</kbd>
                  while clicking on a tank to initiate a connection line.
                </p>
                <ul className="list-disc list-inside text-xs text-neutral-400 mt-2 space-y-1">
                  <li>Hold Alt + Click on <strong>Parent</strong> and then click on <strong>Child</strong> to link them..</li>
                  <li>Repeat the action to remove an existing link.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">
              Toolbar Functions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-center">
                <strong className="block text-neutral-300 mb-1">Reset</strong>
                <span className="text-neutral-500">Wipe all data</span>
              </div>
              <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-center">
                <strong className="block text-neutral-300 mb-1">Load</strong>
                <span className="text-neutral-500">Import .JSON</span>
              </div>
              <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-center">
                <strong className="block text-neutral-300 mb-1">Save</strong>
                <span className="text-neutral-500">Export .JSON</span>
              </div>
              <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-center">
                <strong className="block text-neutral-300 mb-1">Img</strong>
                <span className="text-neutral-500">Export PNG</span>
              </div>
            </div>
          </section>

        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-200 hover:bg-white text-neutral-950 font-bold rounded text-sm transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}