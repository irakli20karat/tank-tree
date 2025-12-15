import { useState } from 'react';
import { AlertTriangle, X, Link2, Coins, Star } from 'lucide-react';
import { GroupIcon } from './GroupIcon';

const TankCard = ({
    tank,
    group,
    isSelected,
    isConnectionSource,
    isHighlighted,
    onEdit,
    onDelete,
    onMouseDown,
    isDragging,
    conflictType,
    setRef,
    styleOverride = {}
}) => {
    const [imageError, setImageError] = useState(false);
    const [prevImage, setPrevImage] = useState(tank.image);

    const [bgError, setBgError] = useState(false);
    const [prevBgImage, setPrevBgImage] = useState(tank.bgImage);

    if (tank.image !== prevImage) {
        setPrevImage(tank.image);
        setImageError(false);
    }

    if (tank.bgImage !== prevBgImage) {
        setPrevBgImage(tank.bgImage);
        setBgError(false);
    }

    const mainColor = group?.color || '#525252';

    let borderColor = isSelected ? '#fbbf24' : '#262626';
    let bgColor = '#0a0a0a';

    if (isSelected) {
        borderColor = '#fbbf24';
        bgColor = '#171717';
    } else if (isConnectionSource) {
        borderColor = '#3b82f6';
        bgColor = '#172554';
    } else if (isHighlighted) {
        borderColor = mainColor;
        bgColor = `${mainColor}10`;
    }

    if (conflictType === 'overlap') {
        borderColor = '#dc2626';
        bgColor = '#450a0a';
    } else if (conflictType === 'blocker') {
        borderColor = '#ea580c';
        bgColor = '#431407';
    }

    const style = {
        gridColumnStart: (tank.columnIndex || 0) + 1,
        gridRowStart: 1,
        zIndex: isSelected ? 20 : (isHighlighted ? 15 : 10),
        borderColor: borderColor,
        backgroundColor: bgColor,
        opacity: isDragging ? 0.3 : 1,
        borderStyle: isConnectionSource ? 'dashed' : 'solid',
        ...styleOverride
    };

    const isGold = (tank.goldCost > 0);
    const nameColor = isSelected ? '#fbbf24' : (isGold ? '#fbbf24' : (isHighlighted ? mainColor : '#d4d4d4'));

    return (
        <div
            ref={setRef}
            onMouseDown={(e) => onMouseDown && onMouseDown(e, tank)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
                e.stopPropagation();
                if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                onEdit && onEdit(tank);
            }}
            style={style}
            className={`
                relative group flex flex-col items-center w-36 transition-none ease-out justify-self-center select-none
                border rounded-sm overflow-hidden
                ${!isDragging && !styleOverride.position ? 'hover:scale-[1.02] cursor-grab active:cursor-grabbing' : ''}
            `}
        >
            {tank.bgImage && !bgError && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <img
                        className={`w-full h-full object-cover opacity-30 grayscale-[0.2] bg-id-${tank.id}`}
                        src={tank.bgImage}
                        alt="background"
                        loading="eager"
                        crossOrigin="anonymous"
                        onError={() => setBgError(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
                </div>
            )}

            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: `linear-gradient(335deg, ${mainColor}, transparent)`,
                    opacity: 0.15
                }}
            />

            {isConnectionSource && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-[9px] font-bold px-2 rounded-sm flex items-center gap-1 z-50 whitespace-nowrap border bg-black border-blue-500 text-blue-500">
                    <Link2 size={8} /> LINKING...
                </div>
            )}

            {conflictType && !styleOverride.position && !isConnectionSource && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 text-[9px] font-bold px-2 rounded-sm flex items-center gap-1 z-50 whitespace-nowrap border
                    ${conflictType === 'overlap' ? 'bg-black border-red-500 text-red-500' : 'bg-black border-orange-500 text-orange-500'}
                `}>
                    <AlertTriangle size={8} />
                    {conflictType === 'overlap' ? 'OVERLAP' : 'BLOCK'}
                </div>
            )}

            <div className="h-20 w-full relative border-b border-neutral-800/50 z-10">
                {tank.image && !imageError ? (
                    <div className="absolute inset-0 z-10 p-1">
                        <img
                            src={tank.image}
                            alt={tank.name}
                            onError={() => setImageError(true)}
                            crossOrigin="anonymous"
                            className="w-full h-full object-contain pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20 relative z-10">
                        <GroupIcon icon={group?.icon} color={mainColor} size={48} />
                    </div>
                )}

                <div className="absolute top-0 right-0 bg-neutral-900/90 border-l border-b border-neutral-800 p-1.5 z-20 backdrop-blur-sm">
                    <GroupIcon icon={group?.icon} color={mainColor} size={24} />
                </div>
            </div>

            <div className="p-2 text-center w-full relative z-10 bg-transparent flex flex-col justify-between min-h-[48px]">
                <h3
                    className={`text-xs truncate w-full font-mono mb-1 drop-shadow-md ${isGold ? 'font-bold uppercase tracking-wide' : 'font-medium'}`}
                    style={{ color: nameColor }}
                >
                    {tank.name || 'Unnamed'}
                </h3>

                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                    {tank.xpCost > 0 && (
                        <p className="text-[10px] text-blue-400 font-mono drop-shadow-md flex items-center gap-0.5">
                            <Star size={8} className="stroke-[2.5]" /> {tank.xpCost}
                        </p>
                    )}
                    {tank.silverCost > 0 && (
                        <p className="text-[10px] text-neutral-300 font-mono drop-shadow-md flex items-center gap-0.5">
                            <Coins size={8} className="stroke-[2.5]" /> {tank.silverCost}
                        </p>
                    )}
                    {tank.goldCost > 0 && (
                        <p className="text-[10px] text-yellow-500 font-mono drop-shadow-md flex items-center gap-0.5 font-bold">
                            <Coins size={8} className="stroke-[2.5]" /> {tank.goldCost}
                        </p>
                    )}
                </div>
            </div>

            {!isDragging && !styleOverride.position && onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(tank.id); }}
                    className="absolute -top-2 -right-2 p-1 bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-500 hover:border-red-900 opacity-0 group-hover:opacity-100 transition-all rounded-sm z-30"
                >
                    <X size={10} />
                </button>
            )}
        </div>
    );
};

export default TankCard;