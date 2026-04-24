import { useState } from 'react';
import domtoimage from 'dom-to-image';
import { extractImageLibrary, convertTanksToRefs, resolveTankImages } from '../utils/imageUtils';
import { compressTank, generateTiers, INITIAL_TANKS, ROW_HEIGHT, COLUMN_WIDTH } from '../utils/tankUtils';
import { DEFAULT_GROUPS } from '../utils/utils';
import { sanitizeTankData } from '../utils/sanitizeUtils';
import { AUTOSAVE_KEY } from './useStorage';

export const useProjectIO = ({
  tanks,
  tiers,
  groups,
  roleGroups,
  setTanks,
  setTiers,
  setGroups,
  setRoleGroups,
  setSelectedTankId,
  setSelectedIds,
  setConnectionSourceId,
  setImageLibrary,
  setStorageWarning,
  layoutMode,
  gridCapacity,
  exportRef,
  fileInputRef,
  selectedTankId,
  selectedIds,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleTotalReset = () => {
    if (!window.confirm('Are you sure you want to completely reset the project?')) return;
    setTiers(generateTiers(5));
    setGroups(DEFAULT_GROUPS);
    setRoleGroups([]);
    setTanks(INITIAL_TANKS);
    setImageLibrary({});
    setSelectedTankId(null);
    setSelectedIds(new Set());
    setConnectionSourceId(null);
    setStorageWarning(null);
    localStorage.removeItem(AUTOSAVE_KEY);
  };

  const handleSaveProject = () => {
    const library = extractImageLibrary(tanks);
    const tanksWithRefs = convertTanksToRefs(tanks, library);
    const projectData = {
      version: '1.2',
      timestamp: new Date().toISOString(),
      tiers,
      groups,
      roleGroups,
      tanks: tanksWithRefs.map(compressTank),
      imageLibrary: library,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tank-tree.json';
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
          setRoleGroups(data.roleGroups || []);
          const library = data.imageLibrary || extractImageLibrary(data.tanks);
          setImageLibrary(library);
          setTanks(sanitizeTankData(resolveTankImages(data.tanks, library)));
          setSelectedTankId(null);
          setSelectedIds(new Set());
          setConnectionSourceId(null);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveImage = async () => {
    if (!exportRef.current) return;

    const previousSelectedId = selectedTankId;
    const previousSelectedIds = new Set(selectedIds);
    setIsExporting(true);
    setSelectedTankId(null);
    setSelectedIds(new Set());

    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const node = exportRef.current;
      const contentWrapper = node.querySelector('.z-10');
      const PADDING = 60;
      const SCALE = 2;

      let exportWidth, exportHeight;
      if (layoutMode === 'horizontal') {
        exportWidth = (contentWrapper?.scrollWidth || node.scrollWidth) + PADDING;
        exportHeight = gridCapacity * ROW_HEIGHT + PADDING;
      } else {
        exportWidth = gridCapacity * COLUMN_WIDTH + PADDING;
        exportHeight = (contentWrapper?.scrollHeight || node.scrollHeight) + PADDING;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const dataUrl = await domtoimage.toPng(node, {
        width: exportWidth * SCALE,
        height: exportHeight * SCALE,
        bgcolor: '#0a0a0a',
        style: {
          transform: `scale(${SCALE})`,
          'transform-origin': 'top left',
          width: `${exportWidth}px`,
          height: `${exportHeight}px`,
          'background-color': '#0a0a0a',
        },
      });

      const link = document.createElement('a');
      link.download = `tech-tree-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setSelectedTankId(previousSelectedId);
      setSelectedIds(previousSelectedIds);
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    handleTotalReset,
    handleSaveProject,
    handleLoadClick,
    handleFileChange,
    handleSaveImage,
  };
};