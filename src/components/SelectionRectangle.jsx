import { useEffect, useRef } from 'react';

export default function SelectionRectangle({
    isActive,
    startPoint,
    currentPoint,
    containerRef
}) {
    const rectRef = useRef(null);

    useEffect(() => {
        if (!isActive || !startPoint || !currentPoint || !rectRef.current) return;

        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const x1 = Math.min(startPoint.x, currentPoint.x);
        const y1 = Math.min(startPoint.y, currentPoint.y);
        const x2 = Math.max(startPoint.x, currentPoint.x);
        const y2 = Math.max(startPoint.y, currentPoint.y);

        const width = x2 - x1;
        const height = y2 - y1;

        rectRef.current.style.left = `${x1 - containerRect.left}px`;
        rectRef.current.style.top = `${y1 - containerRect.top}px`;
        rectRef.current.style.width = `${width}px`;
        rectRef.current.style.height = `${height}px`;
    }, [isActive, startPoint, currentPoint, containerRef]);

    if (!isActive) return null;

    return (
        <div
            ref={rectRef}
            className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-50"
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 0,
                height: 0,
            }}
        />
    );
}