import { useState, useEffect, useCallback } from 'react';
import { extractImageLibrary, convertTanksToRefs, resolveTankImages } from '../utils/imageUtils';
import { compressTank } from '../utils/tankUtils';
import { sanitizeTankData } from '../utils/sanitizeUtils';

export const AUTOSAVE_KEY = 'tank-tree-autosave-v1';

const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const WARNING_THRESHOLD = 0.8;

export const useStorage = ({
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
}) => {
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [isReadyToSave, setIsReadyToSave] = useState(false);
    const [storageWarning, setStorageWarning] = useState(null);

    const getStorageSize = (data) => new Blob([JSON.stringify(data)]).size;

    const checkStorageCapacity = useCallback((dataToSave) => {
        const dataSize = getStorageSize(dataToSave);
        const percentage = dataSize / MAX_STORAGE_SIZE;

        if (dataSize >= MAX_STORAGE_SIZE) {
            setStorageWarning({ type: 'error', message: `...`, size: dataSize, percentage });
            return false;
        }
        if (percentage >= WARNING_THRESHOLD) {
            setStorageWarning({ type: 'warning', message: `...`, size: dataSize, percentage });
            return true;
        }
        setStorageWarning(null);
        return true;
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
        const savedData = localStorage.getItem(AUTOSAVE_KEY);
        if (savedData) setShowRestoreModal(true);
        else setIsReadyToSave(true);
    }, []);

    useEffect(() => {
        if (!isReadyToSave || showRestoreModal) return;
        const timer = setTimeout(() => {
            const library = extractImageLibrary(tanks);
            const tanksWithRefs = convertTanksToRefs(tanks, library);
            const dataToSave = {
                timestamp: Date.now(),
                tanks: tanksWithRefs.map(compressTank),
                tiers,
                groups,
                roleGroups,
                imageLibrary: library,
            };

            if (!checkStorageCapacity(dataToSave)) return;

            try {
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
            } catch (error) {
                if (error.name === 'QuotaExceededError' || error.code === 22) {
                    setStorageWarning({
                        type: 'error',
                        message:
                            'Storage quota exceeded! Autosave failed. Please save your project as a file and reduce image sizes.',
                        size: getStorageSize(dataToSave),
                        percentage: 1,
                    });
                } else {
                    console.error('Failed to save to localStorage:', error);
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [tanks, tiers, groups, roleGroups, isReadyToSave, showRestoreModal, checkStorageCapacity]);

    const handleRestoreAutosave = () => {
        try {
            const savedRaw = localStorage.getItem(AUTOSAVE_KEY);
            if (savedRaw) {
                const data = JSON.parse(savedRaw);
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
            }
        } catch (err) {
            console.error('Failed to restore autosave:', err);
        } finally {
            setShowRestoreModal(false);
            setIsReadyToSave(true);
        }
    };

    const handleDiscardAutosave = () => {
        localStorage.removeItem(AUTOSAVE_KEY);
        setShowRestoreModal(false);
        setIsReadyToSave(true);
    };

    const handleDismissStorageWarning = () => setStorageWarning(null);

    return {
        showRestoreModal,
        isReadyToSave,
        storageWarning,
        setStorageWarning,
        handleRestoreAutosave,
        handleDiscardAutosave,
        handleDismissStorageWarning,
    };
};