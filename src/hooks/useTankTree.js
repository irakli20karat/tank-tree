import { useState, useRef, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { generateId, DEFAULT_GROUPS, getAllConnectedIds } from '../utils/utils';
import { INITIAL_TANKS, generateTiers, TANK_WIDTH, ROW_HEIGHT, COLUMN_WIDTH } from '../utils/tankUtils';

export const useTankTree = () => {
  const [layoutMode, setLayoutMode] = useState('vertical');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [tiers, setTiers] = useState(generateTiers(5));
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [tanks, setTanks] = useState(INITIAL_TANKS);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [connectionSourceId, setConnectionSourceId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [draggingState, setDraggingState] = useState({ isPressed: false, isDragging: false, tankId: null, currentTierId: null, targetCol: 0 });

  const tankRefs = useRef({});
  const containerRef = useRef(null);
  const exportRef = useRef(null);
  const dragOverlayRef = useRef(null);
  const dragData = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, tankId: null, currentTierId: null, targetCol: 0, hasMoved: false });
  const fileInputRef = useRef(null);

  const maxIndex = Math.max(...tanks.map(t => t.columnIndex || 0), 0);
  const gridCapacity = Math.max(maxIndex + 3, 6);
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
  }, [tanks]);

  const handleTotalReset = () => {
    if (window.confirm("Are you sure you want to completely reset the project? All data will be lost.")) {
      setTiers(generateTiers(5));
      setGroups(DEFAULT_GROUPS);
      setTanks(INITIAL_TANKS);
      setSelectedTankId(null);
      setConnectionSourceId(null);
      setLayoutMode('vertical');
    }
  };

  const handleSaveProject = () => {
    const projectData = { version: "1.0", timestamp: new Date().toISOString(), tiers, groups, tanks };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `tank-tree.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleLoadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.tanks && data.tiers && data.groups) {
          setTiers(data.tiers); setGroups(data.groups); setTanks(data.tanks);
          setSelectedTankId(null); setConnectionSourceId(null);
        }
      } catch (err) { console.error(err); alert("Failed to parse."); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleSaveImage = async () => {
    if (exportRef.current === null) return;

    const prevSelection = selectedTankId;
    const prevConnection = connectionSourceId;

    setSelectedTankId(null);
    setConnectionSourceId(null);

    try {
      const contentWrapper = exportRef.current.querySelector('.z-10');

      const PADDING = 60;
      let exportWidth, exportHeight;

      if (layoutMode === 'horizontal') {
        exportWidth = (contentWrapper?.scrollWidth || exportRef.current.scrollWidth) + PADDING;
        exportHeight = (gridCapacity * ROW_HEIGHT) + PADDING;
      } else {
        exportWidth = (gridCapacity * COLUMN_WIDTH) + PADDING;
        exportHeight = (contentWrapper?.scrollHeight || exportRef.current.scrollHeight) + PADDING;
      }

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        backgroundColor: '#0a0a0a',
        width: exportWidth,
        height: exportHeight,
        pixelRatio: 3,
        style: {
          transform: 'none',
          overflow: 'visible',
          minWidth: '0',
          minHeight: '0',
          width: 'auto',
          height: 'auto'
        }
      });

      const link = document.createElement('a');
      link.download = `tech-tree-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save image:', err);
      alert("Failed to generate image.");
    } finally {
      if (prevSelection) setSelectedTankId(prevSelection);
      if (prevConnection) setConnectionSourceId(prevConnection);
    }
  };

  const updateTank = (id, field, value) => setTanks(tanks.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateGroupColor = (gid, color) => setGroups(groups.map(g => g.id === gid ? { ...g, color } : g));
  const toggleParent = (id, pid) => setTanks(curr => curr.map(t => t.id === id ? { ...t, parentIds: t.parentIds.includes(pid) ? t.parentIds.filter(x => x !== pid) : [...t.parentIds, pid] } : t));
  const toggleChild = (id, cid) => setTanks(curr => curr.map(t => t.id === cid ? { ...t, parentIds: t.parentIds.includes(id) ? t.parentIds.filter(x => x !== id) : [...t.parentIds, id] } : t));

  const handleAddTank = (tierId, specificColIndex = null) => {
    const tierIndex = tiers.findIndex(t => t.id === tierId);
    let targetCol = 0, parentId = null, inheritedGroup = groups[0].id;
    const parent = selectedTankId ? tanks.find(t => t.id === selectedTankId) : null;

    if (specificColIndex !== null) {
      targetCol = specificColIndex;
      if (parent && tiers.findIndex(t => t.id === parent.tierId) === tierIndex - 1) {
        parentId = parent.id; inheritedGroup = parent.groupId;
      }
    } else {
      if (parent && tiers.findIndex(t => t.id === parent.tierId) === tierIndex - 1) {
        parentId = parent.id; targetCol = parent.columnIndex || 0; inheritedGroup = parent.groupId;
      }
      while (tanks.some(t => t.tierId === tierId && t.columnIndex === targetCol)) targetCol++;
    }
    const newTank = { id: generateId(), name: 'New Vehicle', tierId, image: null, parentIds: parentId ? [parentId] : [], groupId: inheritedGroup, xpCost: 0, columnIndex: targetCol };
    setTanks([...tanks, newTank]); setSelectedTankId(newTank.id); setIsSidebarOpen(true);
  };

  const handleDeleteTier = (id) => {
    const isLast = tiers[tiers.length - 1].id === id;
    if (!isLast || tanks.some(t => t.tierId === id)) return;
    setTiers(tiers.filter(t => t.id !== id));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedTankId) {
      const reader = new FileReader();
      reader.onloadend = () => updateTank(selectedTankId, 'image', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDragStart = (e, tank) => {
    if (e.altKey) {
      e.preventDefault(); e.stopPropagation();
      if (connectionSourceId === null) setConnectionSourceId(tank.id);
      else {
        if (connectionSourceId !== tank.id) {
          const sId = connectionSourceId; const tId = tank.id;
          setTanks(prev => {
            const s = prev.find(t => t.id === sId); const t = prev.find(t => t.id === tId);
            if (!s || !t) return prev;
            if (t.parentIds.includes(sId)) return prev.map(x => x.id === tId ? { ...x, parentIds: x.parentIds.filter(id => id !== sId) } : x);
            if (s.parentIds.includes(tId)) return prev.map(x => x.id === sId ? { ...x, parentIds: x.parentIds.filter(id => id !== tId) } : x);
            return prev.map(x => x.id === tId ? { ...x, parentIds: [...x.parentIds, sId] } : x);
          });
        }
        setConnectionSourceId(null);
      }
      return;
    }
    e.stopPropagation();
    if (connectionSourceId) setConnectionSourceId(null);
    const el = tankRefs.current[tank.id];
    const rect = el.getBoundingClientRect();
    dragData.current = {
      startX: e.clientX, startY: e.clientY,
      offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
      tankId: tank.id, currentTierId: tank.tierId, targetCol: tank.columnIndex, hasMoved: false
    };
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragData.current.hasMoved) {
      if (Math.hypot(e.clientX - dragData.current.startX, e.clientY - dragData.current.startY) < 5) return;
      dragData.current.hasMoved = true;
      setDraggingState({ isPressed: true, isDragging: true, tankId: dragData.current.tankId, currentTierId: dragData.current.currentTierId, targetCol: dragData.current.targetCol });
    }
    if (dragOverlayRef.current) {
      dragOverlayRef.current.style.left = `${e.clientX - dragData.current.offsetX}px`;
      dragOverlayRef.current.style.top = `${e.clientY - dragData.current.offsetY}px`;
    }
    if (dragData.current.hasMoved && containerRef.current) {
      const cardCenterX = (e.clientX - dragData.current.offsetX) + (TANK_WIDTH / 2);
      const cardCenterY = (e.clientY - dragData.current.offsetY) + (120 / 2);

      const tierElements = document.querySelectorAll('[data-tier-id]');
      let newTierId = dragData.current.currentTierId;
      let targetTierRect = null;
      for (const el of tierElements) {
        const rect = el.getBoundingClientRect();
        if (cardCenterX >= rect.left && cardCenterX <= rect.right && cardCenterY >= rect.top && cardCenterY <= rect.bottom) {
          newTierId = el.getAttribute('data-tier-id'); targetTierRect = rect; break;
        }
      }
      if (targetTierRect) {
        let newIndex = 0; const HEADER_SIZE = 64;
        if (layoutMode === 'horizontal') newIndex = Math.floor((cardCenterY - targetTierRect.top - HEADER_SIZE) / ROW_HEIGHT);
        else newIndex = Math.floor((cardCenterX - targetTierRect.left - HEADER_SIZE) / COLUMN_WIDTH);
        if (newIndex < 0) newIndex = 0;
        if (newTierId !== dragData.current.currentTierId || newIndex !== dragData.current.targetCol) {
          dragData.current.currentTierId = newTierId; dragData.current.targetCol = newIndex;
          setDraggingState(prev => ({ ...prev, currentTierId: newTierId, targetCol: newIndex }));
        }
      }
    }
  };

  const handleDragEnd = () => {
    if (dragData.current.hasMoved) {
      setTanks(curr => curr.map(t => t.id === dragData.current.tankId ? { ...t, columnIndex: dragData.current.targetCol, tierId: dragData.current.currentTierId } : t));
    } else {
      setSelectedTankId(dragData.current.tankId); setIsSidebarOpen(true);
    }
    setDraggingState({ isPressed: false, isDragging: false, tankId: null, currentTierId: null, targetCol: 0 });
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

  return {
    state: { layoutMode, tiers, groups, tanks, selectedTankId, connectionSourceId, isSidebarOpen, draggingState, conflicts, gridCapacity, highlightedIds, isDocsOpen },
    refs: { tankRefs, containerRef, exportRef, dragOverlayRef, fileInputRef, dragData },
    actions: {
      setLayoutMode, setTiers, setSelectedTankId, setConnectionSourceId, setIsSidebarOpen,
      setIsDocsOpen,
      handleTotalReset, handleSaveProject, handleLoadClick, handleFileChange, handleSaveImage,
      handleAddTank, handleDeleteTier, updateTank, updateGroupColor, toggleParent, toggleChild, handleImageUpload
    },
    handlers: {
      onEditTank: (t) => { setSelectedTankId(t.id); setIsSidebarOpen(true); },
      onDeleteTank: (id) => { setTanks(tanks.filter(t => t.id !== id)); if (selectedTankId === id) setSelectedTankId(null); },
      onDragStart: handleDragStart,
      onAddTank: handleAddTank,
      onDeleteTier: handleDeleteTier
    }
  };
};