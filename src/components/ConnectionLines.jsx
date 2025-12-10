import React, { useState, useLayoutEffect } from 'react';
import { doSegmentsIntersect } from '../utils';

const ConnectionLines = ({ tanks, groups, tankRefs, containerRef, draggingState, highlightedIds }) => {
  const [lines, setLines] = useState([]);
  const [crossingIds, setCrossingIds] = useState(new Set());
  const [retry, setRetry] = useState(0);

  useLayoutEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const rawLines = [];
      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;
      const tankMap = new Map(tanks.map(t => [t.id, t]));

      let missingRefs = false;

      // 1. Generate Raw Lines
      tanks.forEach(tank => {
        if (!tank.parentIds || tank.parentIds.length === 0) return;
        tank.parentIds.forEach(parentId => {
          if (draggingState.isDragging && (tank.id === draggingState.tankId || parentId === draggingState.tankId)) return;

          const parentEl = tankRefs.current[parentId];
          const childEl = tankRefs.current[tank.id];
          const parentTank = tankMap.get(parentId);

          if (parentEl && childEl && parentTank) {
            const parentRect = parentEl.getBoundingClientRect();
            const childRect = childEl.getBoundingClientRect();

            const startX = (parentRect.left + parentRect.width / 2) - containerRect.left + scrollLeft;
            const startY = (parentRect.bottom) - containerRect.top + scrollTop;
            const baseEndX = (childRect.left + childRect.width / 2) - containerRect.left + scrollLeft;
            const endY = (childRect.top) - containerRect.top + scrollTop;
            const midY = (startY + endY) / 2;

            rawLines.push({
              id: `${parentId}-${tank.id}`,
              parentId: parentId,
              childId: tank.id,
              startX, startY, endX: baseEndX, baseEndX, endY, midY,
              tierGapId: parentTank.tierId,
              group: groups.find(g => g.id === parentTank.groupId)
            });
          } else {
            missingRefs = true;
          }
        });
      });

      // 2. Horizontal Separation
      const gapGroups = {};
      rawLines.forEach(line => {
        if (!gapGroups[line.tierGapId]) gapGroups[line.tierGapId] = [];
        gapGroups[line.tierGapId].push(line);
      });

      const processedLines = [];
      const HORIZONTAL_GAP_OFFSET = 12;

      Object.values(gapGroups).forEach(group => {
        const parentBundles = {};
        group.forEach(line => {
          if (!parentBundles[line.parentId]) parentBundles[line.parentId] = [];
          parentBundles[line.parentId].push(line);
        });

        const bundles = Object.values(parentBundles);
        bundles.sort((a, b) => a[0].startX - b[0].startX);
        const bundleCount = bundles.length;

        bundles.forEach((bundle, index) => {
          let offset = 0;
          if (bundleCount > 1) {
            offset = (index - (bundleCount - 1) / 2) * HORIZONTAL_GAP_OFFSET;
          }
          bundle.forEach(line => {
            line.midY += offset;
            processedLines.push(line);
          });
        });
      });

      // 3. Child Input Separation
      const incomingGroups = {};
      processedLines.forEach(line => {
        if (!incomingGroups[line.childId]) incomingGroups[line.childId] = [];
        incomingGroups[line.childId].push(line);
      });

      const ENTRY_GAP_OFFSET = 20;

      Object.values(incomingGroups).forEach(incomingLines => {
        incomingLines.sort((a, b) => a.startX - b.startX);
        const count = incomingLines.length;
        if (count > 1) {
          incomingLines.forEach((line, index) => {
            const offset = (index - (count - 1) / 2) * ENTRY_GAP_OFFSET;
            line.endX = line.baseEndX + offset;
          });
        }
      });

      // 4. Generate Segments & Check Intersections
      const finalLines = [];
      const crossings = new Set();

      processedLines.forEach(line => {
        line.segments = [
          { p1: { x: line.startX, y: line.startY }, p2: { x: line.startX, y: line.midY } },
          { p1: { x: line.startX, y: line.midY }, p2: { x: line.endX, y: line.midY } },
          { p1: { x: line.endX, y: line.midY }, p2: { x: line.endX, y: line.endY } }
        ];
        finalLines.push(line);
      });

      for (let i = 0; i < finalLines.length; i++) {
        for (let j = i + 1; j < finalLines.length; j++) {
          const lineA = finalLines[i];
          const lineB = finalLines[j];
          if (lineA.parentId === lineB.parentId) continue;
          if (lineA.childId === lineB.childId) continue;

          let intersected = false;
          for (let segA of lineA.segments) {
            for (let segB of lineB.segments) {
              if (doSegmentsIntersect(segA.p1, segA.p2, segB.p1, segB.p2)) {
                intersected = true; break;
              }
            }
            if (intersected) break;
          }
          if (intersected) {
            crossings.add(lineA.id); crossings.add(lineB.id);
          }
        }
      }

      setLines(finalLines);
      setCrossingIds(crossings);
      if (missingRefs && retry < 3) setTimeout(() => setRetry(r => r + 1), 100);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [tanks, tankRefs, containerRef, draggingState.isDragging, retry, draggingState.tankId, groups]);

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
      {lines.map(line => {
        const isCrossed = crossingIds.has(line.id);
        const isHighlighted = highlightedIds && highlightedIds.has(line.parentId) && highlightedIds.has(line.childId);
        const baseColor = line.group?.color || '#525252';
        let color = isHighlighted ? baseColor : '#404040';
        let opacity = isHighlighted ? "1" : "0.4";
        let strokeWidth = isHighlighted ? "2" : "1.5";
        let strokeDash = "0";

        if (highlightedIds && !isHighlighted) opacity = "0.1";
        if (isCrossed) {
          color = "#991b1b"; strokeDash = "4,4"; opacity = "0.8";
        }

        const path = `M ${line.startX} ${line.startY} V ${line.midY} H ${line.endX} V ${line.endY}`;

        return (
          <g key={line.id}>
            <path d={path} stroke="#0a0a0a" strokeWidth="5" fill="none" />
            <path d={path} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={strokeDash} opacity={opacity} />
            <polygon points={`${line.endX},${line.endY} ${line.endX - 3},${line.endY - 6} ${line.endX + 3},${line.endY - 6}`} fill={color} opacity={opacity} />
            {lines.filter(l => l.childId === line.childId).length > 1 && (
              <circle cx={line.endX} cy={line.endY} r="1.5" fill={color} opacity={opacity} />
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default ConnectionLines;