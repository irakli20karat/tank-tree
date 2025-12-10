import { Plus } from 'lucide-react';
import { generateId } from './utils/utils';
import { toRoman, TANK_WIDTH } from './utils/tankUtils';
import { useTankTree } from './hooks/useTankTree';
import TankCard from './components/TankCard';
import Sidebar from './components/Sidebar';
import TierZone from './components/TierZone';
import ConnectionLines from './components/ConnectionLines';
import Toolbar from './components/Toolbar';

export default function TankTreeArchitect() {
  const { state, refs, actions, handlers } = useTankTree();

  const draggingTank = state.draggingState.tankId ? state.tanks.find(t => t.id === state.draggingState.tankId) : null;
  const draggingGroup = draggingTank ? state.groups.find(g => g.id === draggingTank.groupId) : null;

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-300 font-sans overflow-hidden select-none">
      <Sidebar
        isOpen={state.isSidebarOpen} setIsOpen={actions.setIsSidebarOpen}
        selectedTank={state.tanks.find(t => t.id === state.selectedTankId)}
        tanks={state.tanks} tiers={state.tiers} groups={state.groups}
        updateTank={actions.updateTank} updateGroupColor={actions.updateGroupColor}
        handleDeleteTank={handlers.onDeleteTank} toggleParent={actions.toggleParent}
        toggleChild={actions.toggleChild} handleImageUpload={actions.handleImageUpload}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative">

        <Toolbar state={state} actions={actions} refs={refs} />

        <div
          ref={refs?.containerRef}
          onClick={() => { actions.setSelectedTankId(null); actions.setConnectionSourceId(null); }}
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
                  <button
                    onClick={(e) => { e.stopPropagation(); actions.setTiers([...state.tiers, { id: generateId(), roman: toRoman(state.tiers.length + 1), index: state.tiers.length }]); }}
                    className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm text-neutral-500 hover:text-green-500 transition-all shadow-md"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {state.draggingState.isDragging && draggingTank && refs?.dragOverlayRef && refs?.dragData?.current && (
              <div ref={refs?.dragOverlayRef} className="fixed pointer-events-none z-[9999]" style={{ width: TANK_WIDTH, left: (refs?.dragData?.current?.startX ?? 0) - (refs?.dragData?.current?.offsetX ?? 0), top: (refs?.dragData?.current?.startY ?? 0) - (refs?.dragData?.current?.offsetY ?? 0) }}>
                <TankCard tank={draggingTank} group={draggingGroup} isSelected={true} styleOverride={{ position: 'static' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}