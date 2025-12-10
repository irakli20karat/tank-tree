import { useState, useRef, useMemo } from 'react';
import { Plus, Trash2, Settings, Shield, AlertTriangle, Link2, Download, Upload, Save } from 'lucide-react'; 
import { generateId, DEFAULT_GROUPS, COLUMN_WIDTH, TANK_WIDTH, getAllConnectedIds } from './utils';
import TankCard from './components/TankCard';
import Sidebar from './components/Sidebar';
import ConnectionLines from './components/ConnectionLines';

// Helper component for tiers
const TierRow = ({ tier, tanks, groups, selectedTankId, connectionSourceId, highlightedIds, draggingState, conflicts, gridColumns, handlers, registerRef, isLastTier }) => {
  const isTargetTier = draggingState.currentTierId === tier.id;
  return (
    <div
      id={`tier-${tier.id}`}
      data-tier-id={tier.id}
      className={`flex relative min-h-[160px] border-b border-neutral-800/50 last:border-0 group/tier transition-colors duration-200
        ${isTargetTier && draggingState.isDragging ? 'bg-neutral-900/30' : 'hover:bg-neutral-900/10'}
      `}
    >
      {/* Left Column (Tier Label) */}
      <div className="w-16 flex-shrink-0 bg-neutral-950 border-r border-neutral-800/50 flex flex-col items-center pt-6 z-10 sticky left-0 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.5)]">
        <span className="text-xl font-bold text-neutral-700 font-serif mb-3 select-none">{tier.roman}</span>
        <div className="flex flex-col gap-1 opacity-0 group-hover/tier:opacity-100 transition-opacity">
          {/* Only show Delete if it is the last tier */}
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

      {/* Right Content (Grid) */}
      <div className="relative flex-1">
        <div className="grid items-center p-4 h-full relative" style={{ gridTemplateColumns: `repeat(${gridColumns}, ${COLUMN_WIDTH}px)`, width: 'max-content', gap: '0' }}>
          {draggingState.isDragging && isTargetTier && (
            <div
              className="absolute border border-dashed border-neutral-600 rounded-sm w-36 h-32 flex items-center justify-center text-neutral-600 font-mono text-[10px] uppercase"
              style={{ left: `${(draggingState.targetCol * COLUMN_WIDTH) + 16 + (COLUMN_WIDTH - TANK_WIDTH) / 2}px`, top: '16px' }}
            >Move Here</div>
          )}
          {tanks.map(tank => (
            <TankCard
              key={tank.id}
              tank={tank}
              group={groups.find(g => g.id === tank.groupId) || groups[0]}
              isSelected={selectedTankId === tank.id}
              isConnectionSource={connectionSourceId === tank.id} 
              isHighlighted={highlightedIds && highlightedIds.has(tank.id)}
              onEdit={handlers.onEditTank}
              onDelete={handlers.onDeleteTank}
              onMouseDown={handlers.onDragStart}
              setRef={(el) => registerRef(tank.id, el)}
              isDragging={draggingState.isDragging && draggingState.tankId === tank.id}
              conflictType={conflicts[tank.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function TankTreeArchitect() {
  const [tiers, setTiers] = useState([{ id: 'tier-1', roman: 'I', index: 0 }, { id: 'tier-2', roman: 'II', index: 1 }, { id: 'tier-3', roman: 'III', index: 2 }]);
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [tanks, setTanks] = useState([
    { id: 't1', name: 'MS-1', tierId: 'tier-1', image: null, parentIds: [], groupId: 'g_lt', xpCost: 0, columnIndex: 2 },
    { id: 't2', name: 'BT-2', tierId: 'tier-2', image: null, parentIds: ['t1'], groupId: 'g_lt', xpCost: 270, columnIndex: 2 },
  ]);

  const [selectedTankId, setSelectedTankId] = useState(null);
  const [connectionSourceId, setConnectionSourceId] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [draggingState, setDraggingState] = useState({ isPressed: false, isDragging: false, tankId: null, currentTierId: null, targetCol: 0 });

  const tankRefs = useRef({});
  const containerRef = useRef(null);
  const dragOverlayRef = useRef(null);
  const dragData = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, tankId: null, currentTierId: null, targetCol: 0, hasMoved: false });
  const fileInputRef = useRef(null);

  const maxColumnIndex = Math.max(...tanks.map(t => t.columnIndex || 0), 0);
  const gridColumns = Math.max(maxColumnIndex + 6, 8);

  const highlightedIds = useMemo(() => selectedTankId ? getAllConnectedIds(selectedTankId, tanks) : null, [selectedTankId, tanks]);

  const conflicts = useMemo(() => {
    const conflictsMap = {};
    const posMap = new Map();
    tanks.forEach(t => {
      const key = `${t.tierId}-${t.columnIndex}`;
      if (!posMap.has(key)) posMap.set(key, []);
      posMap.get(key).push(t.id);
    });
    posMap.forEach(ids => { if (ids.length > 1) ids.forEach(id => conflictsMap[id] = 'overlap'); });
    return conflictsMap;
  }, [tanks, tiers]);

  // --- Handlers ---

  const handleSaveProject = () => {
    const projectData = { version: "1.0", timestamp: new Date().toISOString(), tiers, groups, tanks };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tank-tree-project-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.tanks && data.tiers && data.groups) {
           setTiers(data.tiers);
           setGroups(data.groups);
           setTanks(data.tanks);
           setSelectedTankId(null);
           setConnectionSourceId(null);
        } else {
           alert("Invalid project file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse project file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBackgroundClick = () => {
    setSelectedTankId(null);
    setConnectionSourceId(null);
  };

  const connectTanks = (sourceId, targetId) => {
    if (sourceId === targetId) return; 
    const sourceTank = tanks.find(t => t.id === sourceId);
    const targetTank = tanks.find(t => t.id === targetId);
    if(!sourceTank || !targetTank) return;
    if (targetTank.parentIds.includes(sourceId)) {
        alert("These tanks are already connected.");
        return;
    }
    setTanks(prev => prev.map(t => {
        if (t.id === targetId) return { ...t, parentIds: [...t.parentIds, sourceId] };
        return t;
    }));
  };

  const handleDragStart = (e, tank) => {
    if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        if (connectionSourceId === null) {
            setConnectionSourceId(tank.id);
        } else {
            if (connectionSourceId !== tank.id) connectTanks(connectionSourceId, tank.id);
            setConnectionSourceId(null);
        }
        return;
    }
    e.stopPropagation();
    if (connectionSourceId) setConnectionSourceId(null);
    const el = tankRefs.current[tank.id];
    const rect = el.getBoundingClientRect();
    dragData.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      tankId: tank.id,
      currentTierId: tank.tierId,
      targetCol: tank.columnIndex,
      hasMoved: false
    };
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragData.current.hasMoved) {
      const dist = Math.hypot(e.clientX - dragData.current.startX, e.clientY - dragData.current.startY);
      if (dist < 5) return;
      dragData.current.hasMoved = true;
      setDraggingState({ isPressed: true, isDragging: true, tankId: dragData.current.tankId, currentTierId: dragData.current.currentTierId, targetCol: dragData.current.targetCol });
    }
    if (dragOverlayRef.current) {
      dragOverlayRef.current.style.left = `${e.clientX - dragData.current.offsetX}px`;
      dragOverlayRef.current.style.top = `${e.clientY - dragData.current.offsetY}px`;
    }
    if (dragData.current.hasMoved && containerRef.current) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const tierEl = elements.find(el => el.getAttribute && el.getAttribute('data-tier-id'));
        let newTierId = tierEl ? tierEl.getAttribute('data-tier-id') : dragData.current.currentTierId;
        const rect = containerRef.current.getBoundingClientRect();
        let newCol = Math.floor(((e.clientX - dragData.current.offsetX + TANK_WIDTH / 2) - rect.left + containerRef.current.scrollLeft) / COLUMN_WIDTH);
        if (newCol < 0) newCol = 0;
        if (newTierId !== dragData.current.currentTierId || newCol !== dragData.current.targetCol) {
          dragData.current.currentTierId = newTierId;
          dragData.current.targetCol = newCol;
          setDraggingState(prev => ({ ...prev, currentTierId: newTierId, targetCol: newCol }));
        }
    }
  };

  const handleDragEnd = () => {
    if (dragData.current.hasMoved) {
      setTanks(curr => curr.map(t => t.id === dragData.current.tankId ? { ...t, columnIndex: dragData.current.targetCol, tierId: dragData.current.currentTierId } : t));
    } else {
      setSelectedTankId(dragData.current.tankId);
      setIsSidebarOpen(true);
    }
    setDraggingState({ isPressed: false, isDragging: false, tankId: null, currentTierId: null, targetCol: 0 });
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

  const handleAddTank = (tierId) => {
    const tierIndex = tiers.findIndex(t => t.id === tierId);
    let targetCol = 0, parentId = null, inheritedGroup = groups[0].id;
    const parent = selectedTankId ? tanks.find(t => t.id === selectedTankId) : null;
    if (parent && tiers.findIndex(t => t.id === parent.tierId) === tierIndex - 1) {
      parentId = parent.id;
      targetCol = parent.columnIndex || 0;
      inheritedGroup = parent.groupId;
      while (tanks.some(t => t.tierId === tierId && t.columnIndex === targetCol)) targetCol++;
    } else {
      while (tanks.some(t => t.tierId === tierId && t.columnIndex === targetCol)) targetCol++;
    }
    const newTank = { id: generateId(), name: 'New Vehicle', tierId, image: null, parentIds: parentId ? [parentId] : [], groupId: inheritedGroup, xpCost: 0, columnIndex: targetCol };
    setTanks([...tanks, newTank]);
    setSelectedTankId(newTank.id);
    setIsSidebarOpen(true);
  };

  const updateTank = (id, field, value) => setTanks(tanks.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateGroupColor = (gid, color) => setGroups(groups.map(g => g.id === gid ? { ...g, color } : g));
  const toggleParent = (id, pid) => setTanks(curr => curr.map(t => t.id === id ? { ...t, parentIds: t.parentIds.includes(pid) ? t.parentIds.filter(x => x !== pid) : [...t.parentIds, pid] } : t));
  const toggleChild = (id, cid) => setTanks(curr => curr.map(t => t.id === cid ? { ...t, parentIds: t.parentIds.includes(id) ? t.parentIds.filter(x => x !== id) : [...t.parentIds, id] } : t));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedTankId) {
      const reader = new FileReader();
      reader.onloadend = () => updateTank(selectedTankId, 'image', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteTier = (id) => {
    // 1. Check if it's the last tier
    const isLast = tiers[tiers.length - 1].id === id;
    if (!isLast) {
      alert("You can only delete the last tier.");
      return;
    }
    // 2. Check if it has tanks
    if (tanks.some(t => t.tierId === id)) {
      alert("Cannot delete a tier that contains tanks.");
      return;
    }
    setTiers(tiers.filter(t => t.id !== id));
  };

  const combinedHandlers = { 
    onEditTank: (t) => { setSelectedTankId(t.id); setIsSidebarOpen(true); }, 
    onDeleteTank: (id) => { setTanks(tanks.filter(t => t.id !== id)); if (selectedTankId === id) setSelectedTankId(null); }, 
    onDragStart: handleDragStart, 
    onAddTank: handleAddTank, 
    onDeleteTier: handleDeleteTier 
  };
  
  const draggingTank = draggingState.tankId ? tanks.find(t => t.id === draggingState.tankId) : null;
  const draggingGroup = draggingTank ? groups.find(g => g.id === draggingTank.groupId) : null;

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-300 font-sans overflow-hidden select-none">
      <Sidebar
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
        selectedTank={tanks.find(t => t.id === selectedTankId)}
        tanks={tanks} tiers={tiers} groups={groups}
        updateTank={updateTank} updateGroupColor={updateGroupColor} handleDeleteTank={combinedHandlers.onDeleteTank}
        toggleParent={toggleParent} toggleChild={toggleChild} handleImageUpload={handleImageUpload}
      />
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative">
        {/* Header */}
        <div className="h-12 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-950 z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-sm hover:bg-neutral-800"><Settings size={16} /></button>}
            <h1 className="text-sm font-bold tracking-[0.2em] text-neutral-400 flex items-center gap-2 uppercase"><Shield size={16} /> Tank Tree Architect</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4 border-r border-neutral-800 pr-4">
               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
               <button onClick={handleLoadClick} className="flex items-center gap-1.5 px-2 py-1 text-neutral-500 hover:text-neutral-200 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm transition-colors">
                 <Upload size={12} /> LOAD
               </button>
               <button onClick={handleSaveProject} className="flex items-center gap-1.5 px-2 py-1 text-neutral-500 hover:text-neutral-200 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm transition-colors">
                 <Save size={12} /> SAVE
               </button>
            </div>
            {connectionSourceId && (
                <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold px-2 py-1 bg-neutral-900 border border-blue-900 rounded-sm animate-pulse">
                    <Link2 size={12} /> SELECT TARGET
                </div>
            )}
            {Object.keys(conflicts).length > 0 && <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold px-2 py-1 bg-neutral-900 border border-red-900 rounded-sm"><AlertTriangle size={12} /> {Object.keys(conflicts).length} ISSUES</div>}
          </div>
        </div>
        
        <div 
            ref={containerRef} 
            onClick={handleBackgroundClick}
            className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-neutral-950"
        >
          <div className="min-w-full inline-block pb-20 relative">
            <ConnectionLines tanks={tanks} groups={groups} tankRefs={tankRefs} containerRef={containerRef} draggingState={draggingState} highlightedIds={highlightedIds} />
            <div className="flex flex-col relative z-10 pt-4">
              {tiers.map((tier, index) => (
                <TierRow
                  key={tier.id} 
                  tier={tier} 
                  tanks={tanks.filter(t => t.tierId === tier.id)} 
                  groups={groups}
                  selectedTankId={selectedTankId} 
                  connectionSourceId={connectionSourceId}
                  highlightedIds={highlightedIds} 
                  draggingState={draggingState} 
                  conflicts={conflicts}
                  gridColumns={gridColumns} 
                  handlers={combinedHandlers} 
                  registerRef={(id, el) => { tankRefs.current[id] = el; }}
                  isLastTier={index === tiers.length - 1} // Check if last tier
                />
              ))}
              
              {/* Add Tier Button Row */}
              <div className="flex relative min-h-[40px] border-b border-transparent">
                  {/* Left Column for Button */}
                  <div className="w-16 flex-shrink-0 bg-neutral-950/50 border-r border-neutral-800/20 flex flex-col items-center justify-start pt-4 z-10 sticky left-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setTiers([...tiers, { id: generateId(), roman: `T${tiers.length + 1}`, index: tiers.length }]); }} 
                        className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm text-neutral-500 hover:text-green-500 transition-all shadow-md group/add"
                        title="Add New Tier"
                    >
                        <Plus size={16} />
                    </button>
                  </div>
                  {/* Empty Right Side */}
                  <div className="flex-1"></div>
              </div>

            </div>

            {draggingState.isDragging && draggingTank && (
              <div 
                  ref={dragOverlayRef}
                  className="fixed pointer-events-none z-[9999]"
                  style={{ width: TANK_WIDTH, left: dragData.current.startX - dragData.current.offsetX, top: dragData.current.startY - dragData.current.offsetY }}
              >
                  <TankCard tank={draggingTank} group={draggingGroup} isSelected={true} styleOverride={{ position: 'static' }} />
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}