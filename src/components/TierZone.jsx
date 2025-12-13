import { useState, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import TankCard from './TankCard';
import { ROW_HEIGHT, COLUMN_WIDTH, TANK_WIDTH } from '../utils/tankUtils';

const TierZone = ({
    tier, tanks, groups, selectedTankId, selectedIds, connectionSourceId,
    highlightedIds, draggingState, conflicts, gridCapacity,
    handlers, registerRef, isLastTier, layoutMode
}) => {
    const isTargetTier = draggingState.currentTierId === tier.id;
    
    const [hoverIndex, setHoverIndex] = useState(null);
    const zoneRef = useRef(null);
    const isHorizontal = layoutMode === 'horizontal';

    const handleMouseMove = (e) => {
        if (draggingState.isDragging) return;
        if (zoneRef.current) {
            const rect = zoneRef.current.getBoundingClientRect();
            let index;
            if (isHorizontal) {
                const y = e.clientY - rect.top;
                index = Math.floor(y / ROW_HEIGHT);
            } else {
                const x = e.clientX - rect.left;
                index = Math.floor(x / COLUMN_WIDTH);
            }
            if (index >= 0 && index < gridCapacity) {
                setHoverIndex(index);
            } else {
                setHoverIndex(null);
            }
        }
    };

    const handleMouseLeave = () => setHoverIndex(null);

    const isOccupied = tanks.some(t => t.columnIndex === hoverIndex);

    const containerClass = isHorizontal
        ? "flex-col h-full min-w-[220px] border-r border-neutral-800/50 last:border-0"
        : "flex-row w-full min-h-[160px] border-b border-neutral-800/50 last:border-0";

    const headerClass = isHorizontal
        ? "h-16 w-full border-b border-neutral-800/50 flex-row px-4"
        : "w-16 h-full border-r border-neutral-800/50 flex-col pt-6";

    const gridStyle = isHorizontal
        ? { gridTemplateRows: `repeat(${gridCapacity}, ${ROW_HEIGHT}px)`, height: 'max-content', width: '100%' }
        : { gridTemplateColumns: `repeat(${gridCapacity}, ${COLUMN_WIDTH}px)`, width: 'max-content', height: '100%' };

    const TANK_HEIGHT = 120;

    return (
        <div
            id={`tier-${tier.id}`}
            data-tier-id={tier.id}
            className={`flex relative group/tier transition-colors duration-200 ${containerClass}
        ${isTargetTier && draggingState.isDragging ? 'bg-neutral-900/30' : 'hover:bg-neutral-900/10'}
      `}
        >
            <div className={`flex-shrink-0 bg-neutral-950 flex items-center justify-center z-10 sticky top-0 left-0 shadow-sm ${headerClass}`}>
                <span className="text-xl font-bold text-neutral-700 font-serif select-none">{tier.roman}</span>
                <div className={`flex gap-1 opacity-0 group-hover/tier:opacity-100 transition-opacity ${isHorizontal ? 'ml-auto' : 'mt-3 flex-col'}`}>
                    {isLastTier && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handlers.onDeleteTier(tier.id); }}
                            className="p-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-900 rounded-sm transition-colors"
                            title="Delete Tier"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="relative flex-1">
                <div
                    ref={zoneRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="grid items-center p-4 relative"
                    style={{ ...gridStyle, gap: '0' }}
                >
                    {draggingState.isDragging && isTargetTier && (
                        <div
                            className="absolute border border-dashed border-neutral-600 rounded-sm flex items-center justify-center text-neutral-600 font-mono text-[10px] uppercase pointer-events-none"
                            style={{
                                width: TANK_WIDTH,
                                height: TANK_HEIGHT,
                                left: isHorizontal
                                    ? '50%'
                                    : `${(draggingState.targetCol * COLUMN_WIDTH) + 16 + (COLUMN_WIDTH - TANK_WIDTH) / 2}px`,
                                top: isHorizontal
                                    ? `${(draggingState.targetCol * ROW_HEIGHT) + 16 + (ROW_HEIGHT - TANK_HEIGHT) / 2}px`
                                    : '16px',
                                transform: isHorizontal ? 'translateX(-50%)' : 'none'
                            }}
                        >Move Here</div>
                    )}

                    {tanks.map(tank => (
                        <TankCard
                            key={tank.id}
                            tank={tank}
                            group={groups.find(g => g.id === tank.groupId) || groups[0]}
                            
                            isSelected={selectedIds ? selectedIds.has(tank.id) : (selectedTankId === tank.id)}
                            
                            isConnectionSource={connectionSourceId === tank.id}
                            isHighlighted={highlightedIds && highlightedIds.has(tank.id)}
                            onEdit={handlers.onEditTank}
                            onDelete={handlers.onDeleteTank}
                            onMouseDown={handlers.onDragStart}
                            setRef={(el) => registerRef(tank.id, el)}
                            
                            isDragging={draggingState.isDragging && selectedIds?.has(tank.id)}
                            
                            conflictType={conflicts[tank.id]}
                            styleOverride={isHorizontal ? {
                                gridRowStart: (tank.columnIndex || 0) + 1,
                                gridColumnStart: 1,
                                justifySelf: 'center'
                            } : {}}
                        />
                    ))}

                    {!draggingState.isDragging && hoverIndex !== null && !isOccupied && (
                        <div
                            onClick={(e) => { e.stopPropagation(); handlers.onAddTank(tier.id, hoverIndex); }}
                            className="group flex flex-col items-center justify-center border border-dashed border-neutral-800 bg-neutral-950/50 hover:border-neutral-500 hover:bg-neutral-900 rounded-sm cursor-pointer transition-all z-0"
                            style={{
                                width: '144px', height: '128px',
                                gridColumnStart: isHorizontal ? 1 : hoverIndex + 1,
                                gridRowStart: isHorizontal ? hoverIndex + 1 : 1,
                                justifySelf: isHorizontal ? 'center' : 'start',
                                marginLeft: isHorizontal ? '0' : '16px',
                                marginRight: isHorizontal ? '0' : '0',
                                marginTop: isHorizontal ? '16px' : '0'
                            }}
                        >
                            <Plus className="text-neutral-700 group-hover:text-neutral-400 transition-colors" size={24} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TierZone;