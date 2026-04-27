import { ChevronDown, ChevronLeft, ChevronRight, MoveHorizontal, Network, Link as LinkIcon, Unlink, Trash2, ArrowDownCircle, ExternalLink, FileText } from 'lucide-react';
import { GroupIcon } from '../GroupIcon';
import { CostInput } from '../UI/CostInput';
import { ImageUploader } from '../UI/ImageUploader';
import { useState } from 'react';

const RelationshipManager = ({ label, icon: Icon, items, linkedIds, onLink, onUnlink, allTiers }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="space-y-2 pt-4 border-t border-neutral-800">
            <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2">
                {Icon && <Icon size={12} />} {label}
            </label>
            <div className="space-y-1 mb-3">
                {linkedIds.length > 0 ? items.filter(i => linkedIds.includes(i.id)).map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-neutral-800/50 p-2 rounded-sm border border-neutral-800 text-xs">
                        <span className="text-neutral-300">{item.name}</span>
                        <button onClick={() => onUnlink(item.id)} className="text-neutral-600 hover:text-neutral-300"><Unlink size={12} /></button>
                    </div>
                )) : <div className="text-xs text-neutral-600 italic">No {label.toLowerCase()} linked.</div>}
            </div>
            <div className="relative">
                <button onClick={() => setIsOpen(!isOpen)} className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-sm border border-neutral-700 text-xs flex items-center justify-center gap-2"><LinkIcon size={12} /> Link {label}</button>
                {isOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-700 shadow-xl z-50">
                        {items.filter(i => !linkedIds.includes(i.id)).map(item => (
                            <button key={item.id} onClick={() => { onLink(item.id); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-800">
                                <span>{item.name} <span className="text-neutral-500">- T{allTiers.find(t => t.id === item.tierId)?.roman}</span></span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const SingleSelectView = ({
    tank, tanks, tiers,
    groups = [],
    roleGroups = [],
    updateTank, toggleParent, toggleChild, handleDeleteTank,
    handleImageUpload, handleBgImageUpload
}) => {
    const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
    const [isRoleGroupMenuOpen, setIsRoleGroupMenuOpen] = useState(false);

    const availableParents = tanks.filter(t => {
        const tTier = tiers.find(tier => tier.id === t.tierId);
        const sTier = tiers.find(tier => tier.id === tank.tierId);
        return tTier && sTier && tTier.index < sTier.index;
    });

    const availableChildren = tanks.filter(t => {
        const tTier = tiers.find(tier => tier.id === t.tierId);
        const sTier = tiers.find(tier => tier.id === tank.tierId);
        return tTier && sTier && tTier.index > sTier.index;
    });

    const roleGroup = roleGroups.find(g => g.id === tank.roleGroupId) || null;

    return (
        <div className="space-y-4">
            <ImageUploader
                label="Vehicle Image"
                value={tank.image}
                onUpload={handleImageUpload}
                onUrlChange={(v) => updateTank(tank.id, 'image', v)}
                onClear={() => updateTank(tank.id, 'image', null)}
            />

            <ImageUploader
                label="Background / Flag"
                value={tank.bgImage}
                onUpload={handleBgImageUpload}
                onUrlChange={(v) => updateTank(tank.id, 'bgImage', v)}
                onClear={() => updateTank(tank.id, 'bgImage', null)}
            />

            <div className="space-y-3 border-t border-neutral-800 pt-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Name</label>
                    <input type="text" value={tank.name} onChange={(e) => updateTank(tank.id, 'name', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none" />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                        <FileText size={12} /> Description
                        <span className="text-[9px] text-neutral-600 normal-case font-normal">(shows on hover after 1.5s)</span>
                    </label>
                    <textarea
                        value={tank.description || ''}
                        onChange={(e) => updateTank(tank.id, 'description', e.target.value)}
                        placeholder="Add a description..."
                        rows={3}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none resize-none font-mono text-xs"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                        Tag
                        <span className="text-[9px] text-neutral-600 normal-case font-normal">(shown on card)</span>
                    </label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={tank.tag || ''}
                            onChange={(e) => updateTank(tank.id, 'tag', e.target.value)}
                            placeholder="e.g. Premium, Event..."
                            className="flex-1 bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none font-mono text-xs"
                        />
                        <div className="relative cursor-pointer flex-shrink-0">
                            <div
                                className="w-8 h-8 rounded-sm border border-neutral-700"
                                style={{ backgroundColor: tank.tagColor || '#f59e0b' }}
                            />
                            <input
                                type="color"
                                value={(tank.tagColor || '#f59e0b').slice(0, 7)}
                                onChange={(e) => updateTank(tank.id, 'tagColor', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                        <ExternalLink size={12} /> Link URL
                    </label>
                    <input
                        type="url"
                        value={tank.url || ''}
                        onChange={(e) => updateTank(tank.id, 'url', e.target.value)}
                        placeholder="https://example.com"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none font-mono text-xs"
                    />
                    {tank.url && tank.url.trim() && (
                        <a href={tank.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1">
                            <ExternalLink size={10} /> Test link
                        </a>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Primary Class</label>
                    <div className="relative">
                        <button onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)} className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                {(() => { const g = groups.find(g => g.id === tank.groupId); return g ? <><GroupIcon icon={g.icon} color={g.color} size={16} /><span className="text-neutral-300">{g.name}</span></> : null; })()}
                            </span>
                            <ChevronDown size={12} />
                        </button>
                        {isGroupMenuOpen && (
                            <div className="absolute top-full left-0 w-full bg-neutral-900 border border-neutral-700 z-50 mt-1 shadow-xl">
                                {groups.map(g => (
                                    <button key={g.id} onClick={() => { updateTank(tank.id, 'groupId', g.id); setIsGroupMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-800">
                                        <GroupIcon icon={g.icon} color={g.color} size={20} /> {g.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
                        Role Class
                    </label>
                    {roleGroups.length === 0 ? (
                        <p className="text-[10px] text-neutral-600 italic px-1">
                            No role classes defined yet — create some in the Global Settings panel.
                        </p>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setIsRoleGroupMenuOpen(!isRoleGroupMenuOpen)}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 flex items-center justify-between"
                            >
                                {roleGroup ? (
                                    <span className="flex items-center gap-2">
                                        <GroupIcon icon={roleGroup.icon} color={roleGroup.color} type="role" size={16} />
                                        <span className="text-neutral-300">{roleGroup.name.split(' ')[0]}</span>
                                    </span>
                                ) : (
                                    <span className="text-neutral-600 italic">None</span>
                                )}
                                <ChevronDown size={12} />
                            </button>
                            {isRoleGroupMenuOpen && (
                                <div className="absolute top-full left-0 w-full bg-neutral-900 border border-neutral-700 z-50 mt-1 shadow-xl">
                                    <button
                                        onClick={() => { updateTank(tank.id, 'roleGroupId', null); setIsRoleGroupMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-800 text-neutral-500 italic border-b border-neutral-800"
                                    >
                                        None
                                    </button>
                                    {roleGroups.map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => { updateTank(tank.id, 'roleGroupId', g.id); setIsRoleGroupMenuOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-800"
                                        >
                                            <GroupIcon icon={g.icon} color={g.color} size={20} type="role" /> {g.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <CostInput type="xp" value={tank.xpCost} onChange={(v) => updateTank(tank.id, 'xpCost', v)} />
                    <CostInput type="silver" value={tank.silverCost} onChange={(v) => updateTank(tank.id, 'silverCost', v)} />
                    <CostInput type="gold" value={tank.goldCost} onChange={(v) => updateTank(tank.id, 'goldCost', v)} />
                </div>
            </div>

            <div className="p-3 bg-neutral-800/30 rounded-sm border border-neutral-800">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2 mb-2">
                    <MoveHorizontal size={12} /> Grid Position
                </label>
                <div className="flex items-center gap-2">
                    <button onClick={() => updateTank(tank.id, 'columnIndex', Math.max(0, (tank.columnIndex || 0) - 1))} className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-sm text-xs flex items-center justify-center gap-1"><ChevronLeft size={14} /></button>
                    <span className="text-sm font-mono text-neutral-400 w-8 text-center">{tank.columnIndex || 0}</span>
                    <button onClick={() => updateTank(tank.id, 'columnIndex', (tank.columnIndex || 0) + 1)} className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-sm text-xs flex items-center justify-center gap-1"><ChevronRight size={14} /></button>
                </div>
            </div>

            <RelationshipManager
                label="Parents" icon={Network}
                items={availableParents} linkedIds={tank.parentIds || []}
                onLink={(pid) => toggleParent(tank.id, pid)} onUnlink={(pid) => toggleParent(tank.id, pid)}
                allTiers={tiers}
            />

            <RelationshipManager
                label="Children" icon={ArrowDownCircle}
                items={availableChildren}
                linkedIds={tanks.filter(t => t.parentIds && t.parentIds.includes(tank.id)).map(t => t.id)}
                onLink={(cid) => toggleChild(tank.id, cid)} onUnlink={(cid) => toggleChild(tank.id, cid)}
                allTiers={tiers}
            />

            <div className="pt-6 mt-auto">
                <button onClick={() => handleDeleteTank(tank.id)} className="w-full py-2 bg-transparent hover:bg-red-950/30 text-neutral-600 hover:text-red-500 rounded-sm border border-neutral-800 hover:border-red-900 transition-colors text-xs flex items-center justify-center gap-2">
                    <Trash2 size={12} /> Delete Tank
                </button>
            </div>
        </div>
    );
};