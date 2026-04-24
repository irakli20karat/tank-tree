import { useState, useRef } from 'react';
import { useSelection } from './useSelection';
import { useDerivedState } from './useDerivedState';
import { useDragDrop } from './useDragDrop';
import { useTankMutations } from './useTankMutations';
import { useGroupMutations } from './useGroupMutations';
import { useTierMutations } from './useTierMutations';
import { useProjectIO } from './useProjectIO';
import { useStorage } from './useStorage';

import { DEFAULT_GROUPS, DEFAULT_ROLES } from '../utils/utils';
import { INITIAL_TANKS, generateTiers, TANK_WIDTH, ROW_HEIGHT, COLUMN_WIDTH } from '../utils/tankUtils';
import { getImageByRef } from '../utils/imageUtils';

export const AppHooks = () => {
  const [layoutMode, setLayoutMode] = useState('vertical');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [tiers, setTiers] = useState(generateTiers(5));
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [roleGroups, setRoleGroups] = useState(DEFAULT_ROLES);
  const [tanks, setTanks] = useState(INITIAL_TANKS);
  const [imageLibrary, setImageLibrary] = useState({});
  const [connectionSourceId, setConnectionSourceId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const tankRefs = useRef({});
  const containerRef = useRef(null);
  const exportRef = useRef(null);
  const dragOverlayRef = useRef(null);
  const fileInputRef = useRef(null);

  const { selectedTankId, selectedIds, setSelectedIds, setSelectedTankId, setSelectedTankIdRaw } =
    useSelection({ setIsRightSidebarOpen });

  const { gridCapacity, highlightedIds, conflicts } =
    useDerivedState({ tanks, selectedTankId, selectedIds });

  const { updateTank, toggleParent, toggleChild, handleAddTank, handleImageUpload, handleBgImageUpload } =
    useTankMutations({ tanks, setTanks, tiers, groups, selectedTankId, setSelectedTankId, setIsSidebarOpen, imageLibrary, setImageLibrary });

  const { updateGroup, updateGroupColor, handleAddGroup, handleDeleteGroup, handleGroupIconUpload,
    updateRoleGroup, handleAddRoleGroup, handleDeleteRoleGroup, handleRoleGroupIconUpload } =
    useGroupMutations({ groups, setGroups, setRoleGroups, setTanks, imageLibrary, setImageLibrary });

  const { handleDeleteTier, setTierRegion, clearTierRegion } =
    useTierMutations({ tiers, setTiers, tanks });

  const { draggingState, dragData, handleDragStart, handleEmptyClick } =
    useDragDrop({
      tanks, setTanks, tiers, selectedTankId, setSelectedTankIdRaw, setSelectedTankId,
      selectedIds, setSelectedIds, connectionSourceId, setConnectionSourceId,
      setIsSidebarOpen, setIsRightSidebarOpen, layoutMode, tankRefs, containerRef, dragOverlayRef
    });

  const { showRestoreModal, storageWarning, setStorageWarning, handleRestoreAutosave,
    handleDiscardAutosave, handleDismissStorageWarning } =
    useStorage({
      tanks, tiers, groups, roleGroups, setTanks, setTiers, setGroups, setRoleGroups,
      setSelectedTankId, setSelectedIds, setConnectionSourceId, setImageLibrary
    });

  const { isExporting, handleTotalReset, handleSaveProject, handleLoadClick, handleFileChange, handleSaveImage } =
    useProjectIO({
      tanks, tiers, groups, roleGroups, setTanks, setTiers, setGroups, setRoleGroups,
      setSelectedTankId, setSelectedIds, setConnectionSourceId, setImageLibrary,
      setStorageWarning, layoutMode, gridCapacity, exportRef, fileInputRef, selectedTankId, selectedIds
    });

  return {
    state: {
      layoutMode, tiers, groups, roleGroups, tanks, selectedTankId, selectedIds,
      connectionSourceId, isSidebarOpen, isRightSidebarOpen, draggingState, conflicts,
      gridCapacity, highlightedIds, isDocsOpen, isExporting, showRestoreModal, imageLibrary, storageWarning
    },
    refs: { tankRefs, containerRef, exportRef, dragOverlayRef, fileInputRef, dragData },
    actions: {
      setLayoutMode, setTiers, setSelectedTankId, setConnectionSourceId, setIsSidebarOpen,
      setIsRightSidebarOpen, setIsDocsOpen, handleTotalReset, handleSaveProject, handleLoadClick,
      handleFileChange, handleSaveImage, handleAddTank, handleDeleteTier, updateTank, updateGroupColor,
      toggleParent, toggleChild, handleImageUpload, handleBgImageUpload, handleEmptyClick,
      handleRestoreAutosave, handleDiscardAutosave, handleAddGroup, handleDeleteGroup, updateGroup,
      handleGroupIconUpload, updateRoleGroup, handleAddRoleGroup, handleDeleteRoleGroup,
      handleRoleGroupIconUpload, setTierRegion, clearTierRegion, handleDismissStorageWarning
    },
    handlers: {
      onEditTank: (t) => { setSelectedTankId(t.id); setIsSidebarOpen(true); },
      onDeleteTank: (id) => { setTanks(tanks.filter(t => t.id !== id && !selectedIds.has(t.id))); setSelectedTankId(null); },
      onDragStart: handleDragStart, onAddTank: handleAddTank, onDeleteTier: handleDeleteTier
    },
    utils: { getImageByRef: (ref) => getImageByRef(ref, imageLibrary) }
  };
};