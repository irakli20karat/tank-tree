import { useState, useLayoutEffect } from 'react';
import { doSegmentsIntersect } from '../utils';

// Helper: Check if line intersects a rectangle
const intersectsRect = (p1, p2, rect, padding = 5) => {
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    const rLeft = rect.left - padding;
    const rRight = rect.right + padding;
    const rTop = rect.top - padding;
    const rBottom = rect.bottom + padding;

    if (maxX < rLeft || minX > rRight || maxY < rTop || minY > rBottom) return false;

    if (p1.x === p2.x) {
        return (p1.x >= rLeft && p1.x <= rRight) && (maxY >= rTop && minY <= rBottom);
    }
    if (p1.y === p2.y) {
        return (p1.y >= rTop && p1.y <= rBottom) && (maxX >= rLeft && minX <= rRight);
    }
    return true;
};

// --- Pathfinding Logic ---

const checkPathCollision = (points, obstacles, parentId, childId) => {
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        for (const [id, rect] of obstacles) {
            if (id === parentId || id === childId) continue;
            if (intersectsRect(p1, p2, rect)) return { id, rect };
        }
    }
    return null;
};

const calculatePath = (start, end, obstacles, parentId, childId, orientation) => {
    const candidates = [];

    if (orientation === 'vertical') {
        const midY = (start.y + end.y) / 2;
        // Standard Mid-Split Vertical
        candidates.push([{ x: start.x, y: start.y }, { x: start.x, y: midY }, { x: end.x, y: midY }, { x: end.x, y: end.y }]);
        // (Keep existing vertical candidates...)
        candidates.push([{ x: start.x, y: start.y }, { x: start.x, y: start.y + 20 }, { x: end.x, y: start.y + 20 }, { x: end.x, y: end.y }]);
    } else {
        // HORIZONTAL LOGIC
        const midX = (start.x + end.x) / 2;

        // A. Standard Mid-Split Horizontal
        candidates.push([
            { x: start.x, y: start.y },
            { x: midX, y: start.y },
            { x: midX, y: end.y },
            { x: end.x, y: end.y }
        ]);

        // B. Early Turn (close to parent)
        candidates.push([
            { x: start.x, y: start.y },
            { x: start.x + 20, y: start.y },
            { x: start.x + 20, y: end.y },
            { x: end.x, y: end.y }
        ]);

        // C. Late Turn (close to child)
        candidates.push([
            { x: start.x, y: start.y },
            { x: end.x - 20, y: start.y },
            { x: end.x - 20, y: end.y },
            { x: end.x, y: end.y }
        ]);
    }

    let firstBlocker = null;

    for (const points of candidates) {
        const blocker = checkPathCollision(points, obstacles, parentId, childId);
        if (!blocker) return { points, isBlocked: false };
        if (!firstBlocker) firstBlocker = blocker;
    }

    // Fallback: Robust Detour
    if (firstBlocker && orientation === 'vertical') {
        const bRect = firstBlocker.rect;
        const PAD = 25;

        const goLeft = Math.abs((bRect.left - PAD) - end.x) < Math.abs((bRect.right + PAD) - end.x);
        const detourX = goLeft ? bRect.left - PAD : bRect.right + PAD;

        const startInside = start.y > bRect.top - 10;

        const detourPoints = [];
        detourPoints.push({ x: start.x, y: start.y });

        if (startInside) {
            detourPoints.push({ x: detourX, y: start.y });
        } else {
            const branchY = Math.min((start.y + bRect.top) / 2, bRect.top - 20);
            detourPoints.push({ x: start.x, y: branchY });
            detourPoints.push({ x: detourX, y: branchY });
        }

        const mergeY = Math.max((end.y + bRect.bottom) / 2, bRect.bottom + 20);
        detourPoints.push({ x: detourX, y: mergeY });

        detourPoints.push({ x: end.x, y: mergeY });
        detourPoints.push({ x: end.x, y: end.y });

        if (!checkPathCollision(detourPoints, obstacles, parentId, childId)) {
            return { points: detourPoints, isBlocked: false };
        }
    }

    return { points: candidates[0], isBlocked: true };
};

const ConnectionLines = ({ tanks, groups, tankRefs, containerRef, draggingState, highlightedIds, layoutMode }) => {
    const [lines, setLines] = useState([]);
    const [crossingIds, setCrossingIds] = useState(new Set());
    const isHorizontal = layoutMode === 'horizontal';

    useLayoutEffect(() => {
        const animationFrameId = requestAnimationFrame(() => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const scrollLeft = containerRef.current.scrollLeft;
            const scrollTop = containerRef.current.scrollTop;

            const obstacleMap = new Map();
            const rectMap = new Map();

            // 1. Build Maps
            tanks.forEach(t => {
                const el = tankRefs.current[t.id];
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const relativeRect = {
                        top: rect.top - containerRect.top + scrollTop,
                        bottom: rect.bottom - containerRect.top + scrollTop,
                        left: rect.left - containerRect.left + scrollLeft,
                        right: rect.right - containerRect.left + scrollLeft,
                        width: rect.width, height: rect.height,
                        centerX: (rect.left - containerRect.left + scrollLeft) + rect.width / 2,
                        centerY: (rect.top - containerRect.top + scrollTop) + rect.height / 2
                    };
                    obstacleMap.set(t.id, relativeRect);
                    rectMap.set(t.id, relativeRect);
                }
            });

            const allConnections = [];
            const parentPorts = {};
            const childPorts = {};

            tanks.forEach(tank => {
                if (!tank.parentIds) return;
                tank.parentIds.forEach(parentId => {
                    if (draggingState.isDragging && (tank.id === draggingState.tankId || parentId === draggingState.tankId)) return;
                    if (!rectMap.has(parentId) || !rectMap.has(tank.id)) return;

                    const pRect = rectMap.get(parentId);
                    const cRect = rectMap.get(tank.id);
                    let startSide, endSide, orientation;

                    if (isHorizontal) {
                        // Horizontal Logic: Parent is usually to the Left, Child to the Right
                        // Check if child is significantly to the right
                        const isChildRight = cRect.left > pRect.right + 20;
                        const isChildLeft = pRect.left > cRect.right + 20;

                        if (isChildRight) {
                            startSide = 'right'; endSide = 'left'; orientation = 'horizontal';
                        } else if (isChildLeft) {
                            startSide = 'left'; endSide = 'right'; orientation = 'horizontal';
                        } else {
                            // Stacked vertically in horizontal mode (fallback)
                            startSide = 'bottom'; endSide = 'top'; orientation = 'vertical';
                        }
                    } else {
                        // Vertical Logic (Original)
                        const verticalGap = cRect.top - pRect.bottom;
                        const isChildBelow = verticalGap > 20;
                        const isChildAbove = pRect.top - cRect.bottom > 20;

                        if (isChildBelow) {
                            startSide = 'bottom'; endSide = 'top'; orientation = 'vertical';
                        } else if (isChildAbove) {
                            startSide = 'top'; endSide = 'bottom'; orientation = 'vertical';
                        } else {
                            startSide = cRect.left > pRect.right ? 'right' : 'left';
                            endSide = cRect.left > pRect.right ? 'left' : 'right';
                            orientation = 'horizontal';
                        }
                    }

                    const connData = { parentId, childId: tank.id, startSide, endSide, orientation, pRect, cRect };
                    allConnections.push(connData);

                    const pKey = `${parentId}-${startSide}`;
                    if (!parentPorts[pKey]) parentPorts[pKey] = [];
                    parentPorts[pKey].push(connData);

                    const cKey = `${tank.id}-${endSide}`;
                    if (!childPorts[cKey]) childPorts[cKey] = [];
                    childPorts[cKey].push(connData);
                });
            });

            const generatedLines = [];
            const OFFSET_STEP = 10;

            // 3. Generate Lines with offsets calculated only within specific ports
            allConnections.forEach(conn => {
                // ... (Keep existing sorting and offset logic)
                const parentTank = tanks.find(t => t.id === conn.parentId);
                const pKey = `${conn.parentId}-${conn.startSide}`;
                const siblingsAtParent = parentPorts[pKey];

                // IMPORTANT: Sort order changes based on orientation
                siblingsAtParent.sort((a, b) => {
                    if (conn.orientation === 'vertical') return a.cRect.centerX - b.cRect.centerX;
                    return a.cRect.centerY - b.cRect.centerY; // Sort by Y for horizontal lines
                });

                const pIndex = siblingsAtParent.indexOf(conn);
                const pOffset = (pIndex - (siblingsAtParent.length - 1) / 2) * OFFSET_STEP;

                const cKey = `${conn.childId}-${conn.endSide}`;
                const siblingsAtChild = childPorts[cKey];
                siblingsAtChild.sort((a, b) => {
                    if (conn.orientation === 'vertical') return a.pRect.centerX - b.pRect.centerX;
                    return a.pRect.centerY - b.pRect.centerY;
                });
                const cIndex = siblingsAtChild.indexOf(conn);
                const cOffset = (cIndex - (siblingsAtChild.length - 1) / 2) * OFFSET_STEP;

                // --- Define Start/End Points ---
                let start = { x: 0, y: 0 };
                let end = { x: 0, y: 0 };
                const pRect = conn.pRect;
                const cRect = conn.cRect;

                // Map sides to coords
                if (conn.startSide === 'bottom') start = { x: pRect.centerX + pOffset, y: pRect.bottom };
                else if (conn.startSide === 'top') start = { x: pRect.centerX + pOffset, y: pRect.top };
                else if (conn.startSide === 'right') start = { x: pRect.right, y: pRect.centerY + pOffset };
                else if (conn.startSide === 'left') start = { x: pRect.left, y: pRect.centerY + pOffset };

                if (conn.endSide === 'top') end = { x: cRect.centerX + cOffset, y: cRect.top };
                else if (conn.endSide === 'bottom') end = { x: cRect.centerX + cOffset, y: cRect.bottom };
                else if (conn.endSide === 'left') end = { x: cRect.left, y: cRect.centerY + cOffset };
                else if (conn.endSide === 'right') end = { x: cRect.right, y: cRect.centerY + cOffset };

                const pathResult = calculatePath(start, end, obstacleMap, conn.parentId, conn.childId, conn.orientation);
                generatedLines.push({
                    id: `${conn.parentId}-${conn.childId}`,
                    parentId: conn.parentId,
                    childId: conn.childId,
                    points: pathResult.points,
                    isBlocked: pathResult.isBlocked,
                    group: groups.find(g => g.id === parentTank.groupId)
                });
            });

            // 4. Intersection Check
            const crossings = new Set();
            for (let i = 0; i < generatedLines.length; i++) {
                for (let j = i + 1; j < generatedLines.length; j++) {
                    const lA = generatedLines[i];
                    const lB = generatedLines[j];
                    if (lA.parentId === lB.parentId || lA.childId === lB.childId) continue;

                    let intersected = false;
                    for (let sA = 0; sA < lA.points.length - 1; sA++) {
                        for (let sB = 0; sB < lB.points.length - 1; sB++) {
                            if (doSegmentsIntersect(lA.points[sA], lA.points[sA + 1], lB.points[sB], lB.points[sB + 1])) {
                                intersected = true;
                                break;
                            }
                        }
                        if (intersected) break;
                    }
                    if (intersected) {
                        crossings.add(lA.id);
                        crossings.add(lB.id);
                    }
                }
            }

            setLines(generatedLines);
            setCrossingIds(crossings);
        });

        return () => cancelAnimationFrame(animationFrameId);
    }, [tanks, tankRefs, containerRef, draggingState, groups, isHorizontal]);

    const toPathString = (points) => {
        if (!points.length) return "";
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        return d;
    };

    const getArrowAngle = (p1, p2) => {
        if (!p1 || !p2) return 0;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return (Math.atan2(dy, dx) * 180) / Math.PI;
    };

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
            {lines.map(line => {
                const isCrossed = crossingIds.has(line.id);
                const isHighlighted = highlightedIds && highlightedIds.has(line.parentId) && highlightedIds.has(line.childId);
                const baseColor = line.group?.color || '#525252';
                let color = isHighlighted ? baseColor : '#404040';
                let opacity = isHighlighted ? "1" : "0.8";
                let strokeWidth = isHighlighted ? "2" : "1.5";
                let strokeDash = "0";

                if (highlightedIds && !isHighlighted) opacity = "0.1";
                if (line.isBlocked) {
                    color = "#ef4444"; strokeWidth = "2"; opacity = "1";
                } else if (isCrossed) {
                    color = "#991b1b"; strokeDash = "4,4"; opacity = "0.8";
                }

                const len = line.points.length;
                const lastPoint = line.points[len - 1];
                const prevPoint = line.points[len - 2];
                const arrowRotation = getArrowAngle(prevPoint, lastPoint);
                const arrowPoints = "-6,-3 0,0 -6,3";

                return (
                    <g key={line.id}>
                        <path d={toPathString(line.points)} stroke="#0a0a0a" strokeWidth="5" fill="none" />
                        <path
                            d={toPathString(line.points)}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={strokeDash}
                            opacity={opacity}
                            strokeLinejoin="round"
                            className="transition-colors duration-300"
                        />
                        {lastPoint && prevPoint && (
                            <polygon
                                points={arrowPoints}
                                fill={color}
                                opacity={opacity}
                                transform={`translate(${lastPoint.x}, ${lastPoint.y}) rotate(${arrowRotation})`}
                            />
                        )}
                        {line.isBlocked && <circle cx={(line.points[0].x + lastPoint.x) / 2} cy={(line.points[0].y + lastPoint.y) / 2} r={4} fill="red" />}
                    </g>
                );
            })}
        </svg>
    );
};

export default ConnectionLines;