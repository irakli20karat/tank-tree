import { useState } from 'react';

export const useSelection = ({ setIsRightSidebarOpen }) => {
    const [selectedTankId, setSelectedTankIdRaw] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const setSelectedTankId = (id) => {
        setSelectedTankIdRaw(id);
        if (id === null) {
            setSelectedIds(new Set());
            setIsRightSidebarOpen(false);
        } else {
            setSelectedIds((prev) => (prev.has(id) ? prev : new Set([id])));
            setIsRightSidebarOpen(true);
        }
    };

    return {
        selectedTankId, 
        selectedIds,
        setSelectedIds,
        setSelectedTankId,
        setSelectedTankIdRaw,
    };
};