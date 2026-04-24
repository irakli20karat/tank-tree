import { useMemo } from 'react';
import { getAllConnectedIds } from '../utils/utils';

export const useDerivedState = ({ tanks, selectedTankId, selectedIds }) => {
    const maxIndex = Math.max(...tanks.map((t) => t.columnIndex || 0), 0);
    const gridCapacity = Math.max(maxIndex + 3, 6);

    const highlightedIds = useMemo(() => {
        if (selectedIds.size > 1) return null;
        return selectedTankId ? getAllConnectedIds(selectedTankId, tanks) : null;
    }, [selectedTankId, tanks, selectedIds]);

    const conflicts = useMemo(() => {
        const conflictsMap = {};
        const posMap = new Map();

        tanks.forEach((t) => {
            const key = `${t.tierId}-${t.columnIndex}`;
            if (!posMap.has(key)) posMap.set(key, []);
            posMap.get(key).push(t.id);
        });

        posMap.forEach((ids) => {
            if (ids.length > 1) ids.forEach((id) => (conflictsMap[id] = 'overlap'));
        });

        return conflictsMap;
    }, [tanks]);

    return { gridCapacity, highlightedIds, conflicts };
};