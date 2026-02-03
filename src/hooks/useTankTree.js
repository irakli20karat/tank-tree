import { useState, useRef, useMemo, useEffect } from 'react';
import domtoimage from 'dom-to-image';
import { generateId, DEFAULT_GROUPS, getAllConnectedIds } from '../utils/utils';
import { INITIAL_TANKS, generateTiers, TANK_WIDTH, ROW_HEIGHT, COLUMN_WIDTH } from '../utils/tankUtils';
import {
  processImageForStorage,
  extractImageLibrary,
  convertTanksToRefs,
  resolveTankImages,
  getImageByRef
} from '../utils/imageUtils';

const AUTOSAVE_KEY = 'tank-tree-autosave-v1';

export const useTankTree = () => {

  const [layoutMode, setLayoutMode] = useState('vertical');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isReadyToSave, setIsReadyToSave] = useState(false);
  const [tiers, setTiers] = useState(generateTiers(5));
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [tanks, setTanks] = useState(INITIAL_TANKS);
  const [imageLibrary, setImageLibrary] = useState({});
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [connectionSourceId, setConnectionSourceId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [draggingState, setDraggingState] = useState({
    isPressed: false,
    isDragging: false,
    leaderId: null,
    currentTierId: null,
    targetCol: 0,
    dragDelta: { col: 0, tierIndex: 0 }
  });

  const tankRefs = useRef({});
  const containerRef = useRef(null);
  const exportRef = useRef(null);
  const dragOverlayRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragData = useRef({
    startX: 0, startY: 0, offsetX: 0, offsetY: 0,
    leaderId: null,
    leaderStartTierIndex: 0,
    leaderStartCol: 0,
    initialPositions: {},
    hasMoved: false,
    justDropped: false,
    wasAlreadySelected: false
  });


  useEffect(() => {
    const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const checkSave = () => {
      const savedData = localStorage.getItem(AUTOSAVE_KEY);
      if (savedData) setShowRestoreModal(true);
      else setIsReadyToSave(true);
    };
    checkSave();
  }, []);

  useEffect(() => {
    if (!isReadyToSave || showRestoreModal) return;
    const timer = setTimeout(() => {
      const library = extractImageLibrary(tanks);
      const tanksWithRefs = convertTanksToRefs(tanks, library);

      const dataToSave = {
        timestamp: Date.now(),
        tanks: tanksWithRefs,
        tiers,
        groups,
        imageLibrary: library
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
    }, 500);
    return () => clearTimeout(timer);
  }, [tanks, tiers, groups, isReadyToSave, showRestoreModal]);


  const sanitizeTankData = (tanks) => {
    return tanks.map(t => ({
      ...t,
      silverCost: typeof t.silverCost === 'number' ? t.silverCost : 0,
      xpCost: typeof t.xpCost === 'number' ? t.xpCost : 0,
      goldCost: typeof t.goldCost === 'number' ? t.goldCost : 0
    }));
  };

  const handleRestoreAutosave = () => {
    try {
      const savedRaw = localStorage.getItem(AUTOSAVE_KEY);
      if (savedRaw) {
        const data = JSON.parse(savedRaw);
        if (data.tanks && data.tiers && data.groups) {
          setTiers(data.tiers);
          setGroups(data.groups);

          const library = data.imageLibrary || extractImageLibrary(data.tanks);
          setImageLibrary(library);

          const resolvedTanks = resolveTankImages(data.tanks, library);
          setTanks(sanitizeTankData(resolvedTanks));

          setSelectedTankId(null);
          setSelectedIds(new Set());
          setConnectionSourceId(null);
        }
      }
    } catch (err) { console.error("Failed to restore", err); } finally { setShowRestoreModal(false); setIsReadyToSave(true); }
  };

  const handleDiscardAutosave = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setShowRestoreModal(false);
    setIsReadyToSave(true);
  };

  const maxIndex = Math.max(...tanks.map(t => t.columnIndex || 0), 0);
  const gridCapacity = Math.max(maxIndex + 3, 6);

  const highlightedIds = useMemo(() => {
    if (selectedIds.size > 1) return null;
    return selectedTankId ? getAllConnectedIds(selectedTankId, tanks) : null;
  }, [selectedTankId, tanks, selectedIds]);

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

  const handleSetSelectedTankId = (id) => {
    setSelectedTankId(id);
    if (id === null) setSelectedIds(new Set());
    else if (!selectedIds.has(id)) setSelectedIds(new Set([id]));
  };

  const handleTotalReset = () => {
    if (window.confirm("Are you sure you want to completely reset the project?")) {
      setTiers(generateTiers(5));
      setGroups(DEFAULT_GROUPS);
      setTanks(INITIAL_TANKS);
      setImageLibrary({});
      setSelectedTankId(null);
      setSelectedIds(new Set());
      setConnectionSourceId(null);
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  };

  const handleSaveProject = () => {
    const library = extractImageLibrary(tanks);
    const tanksWithRefs = convertTanksToRefs(tanks, library);

    const projectData = {
      version: "1.1",
      timestamp: new Date().toISOString(),
      tiers,
      groups,
      tanks: tanksWithRefs,
      imageLibrary: library
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tank-tree.json`;
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
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.tanks && data.tiers && data.groups) {
          setTiers(data.tiers);
          setGroups(data.groups);

          const library = data.imageLibrary || extractImageLibrary(data.tanks);
          setImageLibrary(library);

          const resolvedTanks = resolveTankImages(data.tanks, library);
          setTanks(sanitizeTankData(resolvedTanks));

          setSelectedTankId(null);
          setSelectedIds(new Set());
          setConnectionSourceId(null);
        }
      } catch (err) { console.error(err); alert("Failed to parse."); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleSaveImage = async () => {
    if (!exportRef.current) return;

    const previousSelectedId = selectedTankId;
    const previousSelectedIds = new Set(selectedIds);

    setIsExporting(true);
    setSelectedTankId(null);
    setSelectedIds(new Set());

    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      const node = exportRef.current;
      const contentWrapper = node.querySelector('.z-10');
      const PADDING = 60;
      const SCALE = 2;

      let exportWidth, exportHeight;
      if (layoutMode === 'horizontal') {
        exportWidth = (contentWrapper?.scrollWidth || node.scrollWidth) + PADDING;
        exportHeight = (gridCapacity * ROW_HEIGHT) + PADDING;
      } else {
        exportWidth = (gridCapacity * COLUMN_WIDTH) + PADDING;
        exportHeight = (contentWrapper?.scrollHeight || node.scrollHeight) + PADDING;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await domtoimage.toPng(node, {
        width: exportWidth * SCALE,
        height: exportHeight * SCALE,
        bgcolor: '#0a0a0a',
        style: {
          'transform': `scale(${SCALE})`,
          'transform-origin': 'top left',
          'width': `${exportWidth}px`,
          'height': `${exportHeight}px`,
          'background-color': '#0a0a0a'
        }
      });

      const link = document.createElement('a');
      link.download = `tech-tree-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.error('Export failed:', err);
      alert("Export failed. Please try again.");
    } finally {
      setSelectedTankId(previousSelectedId);
      setSelectedIds(previousSelectedIds);
      setIsExporting(false);
    }
  };

  const updateTank = (id, field, value) => {
    setTanks(prevTanks => prevTanks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const updateGroup = (groupId, field, value) => {
    setGroups(prevGroups => prevGroups.map(g => g.id === groupId ? { ...g, [field]: value } : g));
  };

  const updateGroupColor = (gid, color) => updateGroup(gid, 'color', color);
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

    const newTank = {
      id: generateId(),
      name: 'New Vehicle',
      tierId,
      image: null,
      parentIds: parentId ? [parentId] : [],
      groupId: inheritedGroup,
      xpCost: 0, silverCost: 0, goldCost: 0, costType: 'xp', columnIndex: targetCol
    };

    setTanks(prev => [...prev, newTank]);
    handleSetSelectedTankId(newTank.id);
    setIsSidebarOpen(true);
  };

  const setTierRegion = (startTierId, endTierId, name, color) => {
    setTiers(prevTiers => {
      const startIndex = prevTiers.findIndex(t => t.id === startTierId);
      const endIndex = prevTiers.findIndex(t => t.id === endTierId);
      if (startIndex === -1 || endIndex === -1) return prevTiers;
      const lower = Math.min(startIndex, endIndex);
      const upper = Math.max(startIndex, endIndex);
      return prevTiers.map((tier, index) => {
        if (index >= lower && index <= upper) return { ...tier, regionName: name, regionColor: color };
        return tier;
      });
    });
  };

  const clearTierRegion = (startTierId, endTierId) => setTierRegion(startTierId, endTierId, null, null);

  const handleDeleteTier = (id) => {
    const isLast = tiers[tiers.length - 1].id === id;
    if (!isLast || tanks.some(t => t.tierId === id)) return;
    setTiers(tiers.filter(t => t.id !== id));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && selectedTankId) {
      try {
        const { imageRef, imageData, isNew } = await processImageForStorage(file, imageLibrary);

        if (isNew) {
          setImageLibrary(prev => ({ ...prev, [imageRef]: imageData }));
        }

        updateTank(selectedTankId, 'image', imageData || imageLibrary[imageRef]);
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('Failed to process image');
      }
    }
    e.target.value = '';
  };

  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && selectedTankId) {
      try {
        const { imageRef, imageData, isNew } = await processImageForStorage(file, imageLibrary);

        if (isNew) {
          setImageLibrary(prev => ({ ...prev, [imageRef]: imageData }));
        }

        updateTank(selectedTankId, 'bgImage', imageData || imageLibrary[imageRef]);
      } catch (err) {
        console.error('Background image upload failed:', err);
        alert('Failed to process image');
      }
    }
    e.target.value = '';
  };

  const handleAddGroup = () => setGroups(prev => [...prev, { id: generateId(), name: 'New Class', color: '#ffffff', icon: 'lt', isCustom: true }]);

  const handleDeleteGroup = (groupId) => {
    if (groups.length <= 1) { alert("At least one class group is required."); return; }
    const fallbackGroupId = groups.find(g => g.id !== groupId).id;
    setTanks(prev => prev.map(t => t.groupId === groupId ? { ...t, groupId: fallbackGroupId } : t));
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleGroupIconUpload = async (e, groupId) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const { imageRef, imageData, isNew } = await processImageForStorage(file, imageLibrary);

        if (isNew) {
          setImageLibrary(prev => ({ ...prev, [imageRef]: imageData }));
        }

        updateGroup(groupId, 'icon', imageData || imageLibrary[imageRef]);
      } catch (err) {
        console.error('Icon upload failed:', err);
        alert('Failed to process icon');
      }
    }
    e.target.value = '';
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

    const isMultiSelect = e.ctrlKey || e.metaKey;
    const isAlreadySelected = selectedIds.has(tank.id);
    let currentSelection = new Set(selectedIds);

    if (isMultiSelect) {
      if (!isAlreadySelected) {
        currentSelection.add(tank.id);
        setSelectedIds(currentSelection);
        setSelectedTankId(tank.id);
      }
    } else {
      if (!isAlreadySelected) {
        currentSelection = new Set([tank.id]);
        setSelectedIds(currentSelection);
        setSelectedTankId(tank.id);
      }
    }

    const leaderEl = tankRefs.current[tank.id];
    const leaderRect = leaderEl.getBoundingClientRect();

    const initialPositions = {};
    tanks.forEach(t => {
      const effectiveSelection = isAlreadySelected ? selectedIds : currentSelection;
      if (effectiveSelection.has(t.id)) {
        const tIndex = tiers.findIndex(tier => tier.id === t.tierId);
        let pixelDeltaX = 0;
        let pixelDeltaY = 0;
        const followerEl = tankRefs.current[t.id];
        if (followerEl) {
          const followerRect = followerEl.getBoundingClientRect();
          pixelDeltaX = followerRect.left - leaderRect.left;
          pixelDeltaY = followerRect.top - leaderRect.top;
        }
        initialPositions[t.id] = { tierIndex: tIndex, col: t.columnIndex || 0, tierId: t.tierId, pixelDeltaX, pixelDeltaY };
      }
    });

    dragData.current = {
      startX: e.clientX, startY: e.clientY, offsetX: e.clientX - leaderRect.left, offsetY: e.clientY - leaderRect.top,
      leaderId: tank.id, leaderStartTierIndex: tiers.findIndex(t => t.id === tank.tierId), leaderStartCol: tank.columnIndex || 0,
      initialPositions, hasMoved: false, justDropped: false, wasAlreadySelected: isAlreadySelected
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragData.current.hasMoved) {
      if (Math.hypot(e.clientX - dragData.current.startX, e.clientY - dragData.current.startY) < 10) return;
      dragData.current.hasMoved = true;
      setDraggingState({ isPressed: true, isDragging: true, leaderId: dragData.current.leaderId, currentTierId: dragData.current.initialPositions[dragData.current.leaderId].tierId, targetCol: dragData.current.leaderStartCol, dragDelta: { col: 0, tierIndex: 0 } });
    }
    if (dragOverlayRef.current) {
      dragOverlayRef.current.style.left = `${e.clientX - dragData.current.offsetX}px`;
      dragOverlayRef.current.style.top = `${e.clientY - dragData.current.offsetY}px`;
    }
    if (dragData.current.hasMoved && containerRef.current) {
      const cardCenterX = (e.clientX - dragData.current.offsetX) + (TANK_WIDTH / 2);
      const cardCenterY = (e.clientY - dragData.current.offsetY) + (120 / 2);
      const tierElements = document.querySelectorAll('[data-tier-id]');
      let hoveredTierId = null; let targetTierRect = null; let hoveredTierIndex = -1;
      for (let i = 0; i < tierElements.length; i++) {
        const el = tierElements[i]; const rect = el.getBoundingClientRect();
        if (cardCenterX >= rect.left && cardCenterX <= rect.right && cardCenterY >= rect.top && cardCenterY <= rect.bottom) {
          hoveredTierId = el.getAttribute('data-tier-id'); targetTierRect = rect; hoveredTierIndex = i; break;
        }
      }
      if (targetTierRect && hoveredTierIndex !== -1) {
        let newCol = 0; const HEADER_SIZE = 64;
        if (layoutMode === 'horizontal') newCol = Math.floor((cardCenterY - targetTierRect.top - HEADER_SIZE) / ROW_HEIGHT);
        else newCol = Math.floor((cardCenterX - targetTierRect.left - HEADER_SIZE) / COLUMN_WIDTH);
        if (newCol < 0) newCol = 0;
        const deltaCol = newCol - dragData.current.leaderStartCol;
        const deltaTier = hoveredTierIndex - dragData.current.leaderStartTierIndex;
        if (dragData.current.lastDeltaCol !== deltaCol || dragData.current.lastDeltaTier !== deltaTier) {
          dragData.current.lastDeltaCol = deltaCol; dragData.current.lastDeltaTier = deltaTier;
          setDraggingState(prev => ({ ...prev, currentTierId: hoveredTierId, targetCol: newCol, dragDelta: { col: deltaCol, tierIndex: deltaTier } }));
        }
      }
    }
  };

  const handleDragEnd = (e) => {
    if (dragData.current.hasMoved) {
      const { col: deltaCol, tierIndex: deltaTier } = dragData.current.lastDeltaCol !== undefined ? { col: dragData.current.lastDeltaCol, tierIndex: dragData.current.lastDeltaTier } : { col: 0, tierIndex: 0 };
      setTanks(curr => curr.map(t => {
        const initPos = dragData.current.initialPositions[t.id];
        if (!initPos) return t;
        const newTierIndex = Math.max(0, Math.min(tiers.length - 1, initPos.tierIndex + deltaTier));
        const newCol = Math.max(0, initPos.col + deltaCol);
        return { ...t, columnIndex: newCol, tierId: tiers[newTierIndex].id };
      }));
      dragData.current.justDropped = true;
      setTimeout(() => { if (dragData.current) dragData.current.justDropped = false; }, 50);
    } else {
      setIsSidebarOpen(true);
      const isMultiSelect = e.ctrlKey || e.metaKey;
      const leaderId = dragData.current.leaderId;
      const wasAlreadySelected = dragData.current.wasAlreadySelected;
      if (isMultiSelect) {
        if (wasAlreadySelected && leaderId) {
          const newSet = new Set(selectedIds);
          newSet.delete(leaderId);
          setSelectedIds(newSet);
          if (selectedTankId === leaderId) setSelectedTankId(null);
        }
      } else {
        if (wasAlreadySelected && leaderId) { setSelectedIds(new Set([leaderId])); setSelectedTankId(leaderId); }
      }
    }
    setDraggingState({ isPressed: false, isDragging: false, leaderId: null, currentTierId: null, targetCol: 0, dragDelta: { col: 0, tierIndex: 0 } });
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

  const handleEmptyClick = (e) => {
    if (dragData.current.justDropped) return;
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) handleSetSelectedTankId(null);
  };

  return {
    state: {
      layoutMode, tiers, groups, tanks, selectedTankId, selectedIds, connectionSourceId, isSidebarOpen, draggingState, conflicts, gridCapacity, highlightedIds, isDocsOpen, isExporting, showRestoreModal, imageLibrary
    },
    refs: { tankRefs, containerRef, exportRef, dragOverlayRef, fileInputRef, dragData },
    actions: {
      setLayoutMode, setTiers, setSelectedTankId: handleSetSelectedTankId, setConnectionSourceId, setIsSidebarOpen, setIsDocsOpen, handleTotalReset, handleSaveProject, handleLoadClick, handleFileChange, handleSaveImage, handleAddTank, handleDeleteTier, updateTank, updateGroupColor, toggleParent, toggleChild, handleImageUpload, handleBgImageUpload, handleEmptyClick, handleRestoreAutosave, handleDiscardAutosave, handleAddGroup, handleDeleteGroup, updateGroup, handleGroupIconUpload, setTierRegion, clearTierRegion
    },
    handlers: {
      onEditTank: (t) => { handleSetSelectedTankId(t.id); setIsSidebarOpen(true); },
      onDeleteTank: (id) => { setTanks(tanks.filter(t => t.id !== id && !selectedIds.has(t.id))); handleSetSelectedTankId(null); },
      onDragStart: handleDragStart, onAddTank: handleAddTank, onDeleteTier: handleDeleteTier
    },
    utils: {
      getImageByRef: (ref) => getImageByRef(ref, imageLibrary)
    }
  };
};