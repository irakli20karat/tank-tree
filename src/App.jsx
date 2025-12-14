import { Plus, Loader2, AlertTriangle, Save, Trash2 } from 'lucide-react';
import { generateId } from './utils/utils';
import { toRoman, TANK_WIDTH } from './utils/tankUtils';
import { useTankTree } from './hooks/useTankTree';
import TankCard from './components/TankCard';
import Sidebar from './components/Sidebar';
import TierZone from './components/TierZone';
import ConnectionLines from './components/ConnectionLines';
import Toolbar from './components/Toolbar';
import DocsModal from './components/DocsModal';

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

export default function TankTreeArchitect() {
  const { state, refs, actions, handlers } = useTankTree();

  const draggingTanks = state.draggingState.isDragging
    ? state.tanks.filter(t => state.selectedIds.has(t.id))
    : [];

  const leaderTank = state.draggingState.leaderId
    ? state.tanks.find(t => t.id === state.draggingState.leaderId)
    : null;

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-300 font-sans overflow-hidden select-none">
      
      <RestoreModal 
        isOpen={state.showRestoreModal}
        onRestore={actions.handleRestoreAutosave}
        onDiscard={actions.handleDiscardAutosave}
      />

      {state.isExporting && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center cursor-wait">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-white tracking-wider">EXPORTING IMAGE...</h2>
        </div>
      )}

      <DocsModal
        isOpen={state.isDocsOpen}
        onClose={() => actions.setIsDocsOpen(false)}
      />

      <Sidebar
        isOpen={state.isSidebarOpen}
        setIsOpen={actions.setIsSidebarOpen}
        selectedTank={state.tanks.find(t => t.id === state.selectedTankId)}
        selectedIds={state.selectedIds}
        tanks={state.tanks}
        tiers={state.tiers}
        groups={state.groups}
        updateTank={actions.updateTank}
        updateGroupColor={actions.updateGroupColor}
        handleDeleteTank={handlers.onDeleteTank}
        toggleParent={actions.toggleParent}
        toggleChild={actions.toggleChild}
        handleImageUpload={actions.handleImageUpload}
        handleBgImageUpload={actions.handleBgImageUpload}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative">

        <Toolbar state={state} actions={actions} refs={refs} />

        <div
          ref={refs?.containerRef}
          onClick={(e) => {
            actions.handleEmptyClick(e);
            actions.setConnectionSourceId(null);
          }}
          className="flex-1 overflow-auto relative custom-scrollbar"
        >
          <div
            ref={refs?.exportRef}
            className={`
              relative p-4 flex 
              ${state.layoutMode === 'horizontal'
                ? 'flex-row min-h-full h-fit min-w-full'
                : 'flex-col min-w-full w-fit min-h-full pb-20'
              }
            `}
          >
            <div className="absolute inset-0 pointer-events-none">
              <ConnectionLines
                tanks={state.tanks} groups={state.groups} tankRefs={refs?.tankRefs}
                containerRef={refs?.containerRef} draggingState={state.draggingState}
                highlightedIds={state.highlightedIds} layoutMode={state.layoutMode}
              />
            </div>

            <div className={`
              flex relative z-10 
              ${state.layoutMode === 'horizontal'
                ? 'flex-row h-full'
                : 'flex-col w-full'
              }
            `}>
              {state.tiers.map((tier, index) => (
                <TierZone
                  key={tier.id}
                  tier={tier}
                  tanks={state.tanks.filter(t => t.tierId === tier.id)}
                  groups={state.groups}
                  selectedTankId={state.selectedTankId}
                  selectedIds={state.selectedIds}
                  connectionSourceId={state.connectionSourceId}
                  highlightedIds={state.highlightedIds}
                  draggingState={state.draggingState}
                  conflicts={state.conflicts}
                  gridCapacity={state.gridCapacity}
                  handlers={handlers}
                  registerRef={(id, el) => { if (refs?.tankRefs?.current) refs.tankRefs.current[id] = el; }}
                  isLastTier={index === state.tiers.length - 1}
                  layoutMode={state.layoutMode}
                />
              ))}

              <div className={`flex relative border-transparent opacity-50 hover:opacity-100 transition-opacity ${state.layoutMode === 'horizontal' ? 'w-16 h-full flex-col border-l border-neutral-800/20' : 'h-16 w-full flex-row border-t border-neutral-800/20'}`}>
                <div className="flex items-center justify-center p-4">
                  {state.isExporting ? (
                    <img
                      src="/ico.svg"
                      alt="Watermark"
                      className="w-8 h-8 opacity-40 grayscale"
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        if (state.isExporting) return;
                        e.stopPropagation();
                        actions.setTiers([...state.tiers, { id: generateId(), roman: toRoman(state.tiers.length + 1), index: state.tiers.length }]);
                      }}
                      className={`
                        p-3 rounded-sm transition-all shadow-md flex items-center justify-center
                        ${state.isExporting
                          ? 'bg-transparent border-none'
                          : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-500 hover:text-green-500'
                        }
                    `}
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {state.draggingState.isDragging && leaderTank && refs?.dragOverlayRef && refs?.dragData?.current && (
              <div
                ref={refs.dragOverlayRef}
                className="fixed pointer-events-none z-[9999]"
                style={{
                  width: 0, height: 0,
                  left: (refs.dragData.current.startX ?? 0) - (refs.dragData.current.offsetX ?? 0),
                  top: (refs.dragData.current.startY ?? 0) - (refs.dragData.current.offsetY ?? 0)
                }}
              >
                {draggingTanks.map(tank => {
                  const group = state.groups.find(g => g.id === tank.groupId);

                  const tankInit = refs.dragData.current.initialPositions[tank.id];

                  if (!tankInit) return null;

                  return (
                    <div
                      key={tank.id}
                      style={{
                        position: 'absolute',
                        left: tankInit.pixelDeltaX,
                        top: tankInit.pixelDeltaY,
                        width: TANK_WIDTH
                      }}
                    >
                      <TankCard
                        tank={tank}
                        group={group}
                        isSelected={true}
                        styleOverride={{
                          position: 'static',
                          opacity: 0.9,
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                          transform: 'scale(1.02)'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}