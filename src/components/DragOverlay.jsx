import TankCard from './TankCard';
import { TANK_WIDTH } from '../utils/tankUtils';

const DragOverlay = ({ draggingState, tanks, groups, selectedIds, dragOverlayRef, dragData }) => {
  if (!draggingState.isDragging || !draggingState.leaderId || !dragData) return null;

  const draggingTanks = tanks.filter(t => selectedIds.has(t.id));

  return (
    <div
      ref={dragOverlayRef}
      className="fixed pointer-events-none z-[9999]"
      style={{
        width: 0, height: 0,
        left: (dragData.startX ?? 0) - (dragData.offsetX ?? 0),
        top: (dragData.startY ?? 0) - (dragData.offsetY ?? 0)
      }}
    >
      {draggingTanks.map(tank => {
        const group = groups.find(g => g.id === tank.groupId);
        const tankInit = dragData.initialPositions[tank.id];

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
  );
};

export default DragOverlay;