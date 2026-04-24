import { useState, useRef } from 'react';
import { TANK_WIDTH, ROW_HEIGHT, COLUMN_WIDTH } from '../utils/tankUtils';

export const useDragDrop = ({
    tanks,
    setTanks,
    tiers,
    selectedTankId,
    setSelectedTankIdRaw,   // raw setter — avoids side-effects during drag reconciliation
    setSelectedTankId,      // smart setter — used for empty-click deselect
    selectedIds,
    setSelectedIds,
    connectionSourceId,
    setConnectionSourceId,
    setIsSidebarOpen,
    setIsRightSidebarOpen,
    layoutMode,
    tankRefs,
    containerRef,
    dragOverlayRef,
}) => {
    const [draggingState, setDraggingState] = useState({
        isPressed: false,
        isDragging: false,
        leaderId: null,
        currentTierId: null,
        targetCol: 0,
        dragDelta: { col: 0, tierIndex: 0 },
    });

    const dragData = useRef({
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        leaderId: null,
        leaderStartTierIndex: 0,
        leaderStartCol: 0,
        initialPositions: {},
        hasMoved: false,
        justDropped: false,
        wasAlreadySelected: false,
    });

    const handleDragMove = (e) => {
        if (!dragData.current.hasMoved) {
            if (
                Math.hypot(
                    e.clientX - dragData.current.startX,
                    e.clientY - dragData.current.startY
                ) < 10
            )
                return;

            dragData.current.hasMoved = true;
            setDraggingState({
                isPressed: true,
                isDragging: true,
                leaderId: dragData.current.leaderId,
                currentTierId:
                    dragData.current.initialPositions[dragData.current.leaderId].tierId,
                targetCol: dragData.current.leaderStartCol,
                dragDelta: { col: 0, tierIndex: 0 },
            });
        }

        if (dragOverlayRef.current) {
            dragOverlayRef.current.style.left = `${e.clientX - dragData.current.offsetX}px`;
            dragOverlayRef.current.style.top = `${e.clientY - dragData.current.offsetY}px`;
        }

        if (dragData.current.hasMoved && containerRef.current) {
            const cardCenterX = e.clientX - dragData.current.offsetX + TANK_WIDTH / 2;
            const cardCenterY = e.clientY - dragData.current.offsetY + 120 / 2;

            const tierElements = document.querySelectorAll('[data-tier-id]');
            let hoveredTierId = null;
            let targetTierRect = null;
            let hoveredTierIndex = -1;

            for (let i = 0; i < tierElements.length; i++) {
                const el = tierElements[i];
                const rect = el.getBoundingClientRect();
                if (
                    cardCenterX >= rect.left &&
                    cardCenterX <= rect.right &&
                    cardCenterY >= rect.top &&
                    cardCenterY <= rect.bottom
                ) {
                    hoveredTierId = el.getAttribute('data-tier-id');
                    targetTierRect = rect;
                    hoveredTierIndex = i;
                    break;
                }
            }

            if (targetTierRect && hoveredTierIndex !== -1) {
                const HEADER_SIZE = 64;
                let newCol =
                    layoutMode === 'horizontal'
                        ? Math.floor((cardCenterY - targetTierRect.top - HEADER_SIZE) / ROW_HEIGHT)
                        : Math.floor((cardCenterX - targetTierRect.left - HEADER_SIZE) / COLUMN_WIDTH);
                if (newCol < 0) newCol = 0;

                const deltaCol = newCol - dragData.current.leaderStartCol;
                const deltaTier = hoveredTierIndex - dragData.current.leaderStartTierIndex;

                if (
                    dragData.current.lastDeltaCol !== deltaCol ||
                    dragData.current.lastDeltaTier !== deltaTier
                ) {
                    dragData.current.lastDeltaCol = deltaCol;
                    dragData.current.lastDeltaTier = deltaTier;
                    setDraggingState((prev) => ({
                        ...prev,
                        currentTierId: hoveredTierId,
                        targetCol: newCol,
                        dragDelta: { col: deltaCol, tierIndex: deltaTier },
                    }));
                }
            }
        }
    };

    const handleDragEnd = (e) => {
        if (dragData.current.hasMoved) {
            const { col: deltaCol, tierIndex: deltaTier } =
                dragData.current.lastDeltaCol !== undefined
                    ? { col: dragData.current.lastDeltaCol, tierIndex: dragData.current.lastDeltaTier }
                    : { col: 0, tierIndex: 0 };

            setTanks((curr) =>
                curr.map((t) => {
                    const initPos = dragData.current.initialPositions[t.id];
                    if (!initPos) return t;
                    const newTierIndex = Math.max(
                        0,
                        Math.min(tiers.length - 1, initPos.tierIndex + deltaTier)
                    );
                    const newCol = Math.max(0, initPos.col + deltaCol);
                    return { ...t, columnIndex: newCol, tierId: tiers[newTierIndex].id };
                })
            );

            dragData.current.justDropped = true;
            setTimeout(() => {
                if (dragData.current) dragData.current.justDropped = false;
            }, 50);
        } else {
            setIsSidebarOpen(true);
            setIsRightSidebarOpen(true);

            const isMultiSelect = e.ctrlKey || e.metaKey;
            const { leaderId, wasAlreadySelected } = dragData.current;

            if (isMultiSelect) {
                if (wasAlreadySelected && leaderId) {
                    const newSet = new Set(selectedIds);
                    newSet.delete(leaderId);
                    setSelectedIds(newSet);
                    if (selectedTankId === leaderId) {
                        setSelectedTankIdRaw(null);
                        setIsRightSidebarOpen(false);
                    }
                }
            } else {
                if (wasAlreadySelected && leaderId) {
                    setSelectedIds(new Set([leaderId]));
                    setSelectedTankIdRaw(leaderId);
                }
            }
        }

        setDraggingState({
            isPressed: false,
            isDragging: false,
            leaderId: null,
            currentTierId: null,
            targetCol: 0,
            dragDelta: { col: 0, tierIndex: 0 },
        });

        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
    };

    const handleDragStart = (e, tank) => {
        if (e.altKey) {
            e.preventDefault();
            e.stopPropagation();

            if (connectionSourceId === null) {
                setConnectionSourceId(tank.id);
            } else {
                if (connectionSourceId !== tank.id) {
                    const sId = connectionSourceId;
                    const tId = tank.id;
                    setTanks((prev) => {
                        const s = prev.find((t) => t.id === sId);
                        const t = prev.find((t) => t.id === tId);
                        if (!s || !t) return prev;
                        if (t.parentIds.includes(sId))
                            return prev.map((x) =>
                                x.id === tId
                                    ? { ...x, parentIds: x.parentIds.filter((id) => id !== sId) }
                                    : x
                            );
                        if (s.parentIds.includes(tId))
                            return prev.map((x) =>
                                x.id === sId
                                    ? { ...x, parentIds: x.parentIds.filter((id) => id !== tId) }
                                    : x
                            );
                        return prev.map((x) =>
                            x.id === tId ? { ...x, parentIds: [...x.parentIds, sId] } : x
                        );
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
                setSelectedTankIdRaw(tank.id);
            }
        } else {
            if (!isAlreadySelected) {
                currentSelection = new Set([tank.id]);
                setSelectedIds(currentSelection);
                setSelectedTankIdRaw(tank.id);
            }
        }

        const leaderEl = tankRefs.current[tank.id];
        const leaderRect = leaderEl.getBoundingClientRect();

        const effectiveSelection = isAlreadySelected ? selectedIds : currentSelection;
        const initialPositions = {};

        tanks.forEach((t) => {
            if (!effectiveSelection.has(t.id)) return;
            const tIndex = tiers.findIndex((tier) => tier.id === t.tierId);
            let pixelDeltaX = 0;
            let pixelDeltaY = 0;
            const followerEl = tankRefs.current[t.id];
            if (followerEl) {
                const followerRect = followerEl.getBoundingClientRect();
                pixelDeltaX = followerRect.left - leaderRect.left;
                pixelDeltaY = followerRect.top - leaderRect.top;
            }
            initialPositions[t.id] = {
                tierIndex: tIndex,
                col: t.columnIndex || 0,
                tierId: t.tierId,
                pixelDeltaX,
                pixelDeltaY,
            };
        });

        dragData.current = {
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - leaderRect.left,
            offsetY: e.clientY - leaderRect.top,
            leaderId: tank.id,
            leaderStartTierIndex: tiers.findIndex((t) => t.id === tank.tierId),
            leaderStartCol: tank.columnIndex || 0,
            initialPositions,
            hasMoved: false,
            justDropped: false,
            wasAlreadySelected: isAlreadySelected,
        };

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
    };

    const handleEmptyClick = (e) => {
        if (dragData.current.justDropped) return;
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) setSelectedTankId(null);
    };

    return {
        draggingState,
        dragData,
        handleDragStart,
        handleEmptyClick,
    };
};