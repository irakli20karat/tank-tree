import { useState } from 'react';
import { Settings, ChevronDown, ChevronLeft, ChevronRight, Upload, Trash2, Network, Unlink, Link as LinkIcon, ArrowDownCircle, Layout, Palette, MoveHorizontal, Globe } from 'lucide-react';
import { GroupIcon } from './GroupIcon';

const Sidebar = ({
    isOpen,
    setIsOpen,
    selectedTank,
    tanks,
    tiers,
    groups,
    updateTank,
    updateGroupColor,
    handleDeleteTank,
    toggleParent,
    toggleChild,
    handleImageUpload
}) => {
    const [isParentMenuOpen, setIsParentMenuOpen] = useState(false);
    const [isChildMenuOpen, setIsChildMenuOpen] = useState(false);
    const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);

    const availableParents = selectedTank ? tanks.filter(t => tiers.find(tier => tier.id === t.tierId)?.index < tiers.find(tier => tier.id === selectedTank.tierId)?.index) : [];
    const currentChildren = selectedTank ? tanks.filter(t => t.parentIds && t.parentIds.includes(selectedTank.id)) : [];
    const availableChildren = selectedTank ? tanks.filter(t => tiers.find(tier => tier.id === t.tierId)?.index > tiers.find(tier => tier.id === selectedTank.tierId)?.index) : [];

    return (
        <div className={`flex-shrink-0 bg-neutral-900 border-r border-neutral-800 transition-all duration-300 flex flex-col ${isOpen ? 'w-80' : 'w-0'}`}>
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Settings size={16} /> Properties
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-neutral-200">
                    <ChevronDown className="transform rotate-90" size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {selectedTank ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Preview & Image</label>

                            <div className="h-32 w-full border border-dashed border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 rounded-sm flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group" onClick={() => document.getElementById('tank-image-upload').click()}>
                                {selectedTank.image ? <img src={selectedTank.image} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-neutral-600"><Upload size={20} className="mb-2" /><span className="text-xs">Click to Upload File</span></div>}
                                <input id="tank-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                {selectedTank.image && <button onClick={(e) => { e.stopPropagation(); updateTank(selectedTank.id, 'image', null); }} className="absolute top-2 right-2 p-1 bg-neutral-900 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-sm"><Trash2 size={12} /></button>}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                    <Globe size={12} className="text-neutral-600" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Or paste image URL..."
                                    value={selectedTank.image && !selectedTank.image.startsWith('data:') ? selectedTank.image : ''}
                                    onChange={(e) => updateTank(selectedTank.id, 'image', e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-700 rounded-sm pl-7 pr-2 py-2 text-xs text-neutral-200 focus:border-neutral-500 focus:outline-none placeholder-neutral-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">Name</label>
                                <input type="text" value={selectedTank.name} onChange={(e) => updateTank(selectedTank.id, 'name', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Class Group</label>
                                    <div className="relative">
                                        <button onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)} className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: groups.find(g => g.id === selectedTank.groupId)?.color }}></div>
                                                {groups.find(g => g.id === selectedTank.groupId)?.name.split(' ')[0]}
                                            </span>
                                            <ChevronDown size={12} />
                                        </button>
                                        {isGroupMenuOpen && (
                                            <div className="absolute top-full left-0 w-full bg-neutral-900 border border-neutral-700 z-50 mt-1 shadow-xl">
                                                {groups.map(g => (
                                                    <button key={g.id} onClick={() => { updateTank(selectedTank.id, 'groupId', g.id); setIsGroupMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-800">
                                                        <GroupIcon icon={g.icon} color={g.color} size={12} />
                                                        {g.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase">XP Cost</label>
                                    <input type="number" value={selectedTank.xpCost} onChange={(e) => updateTank(selectedTank.id, 'xpCost', parseInt(e.target.value) || 0)} className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-neutral-800/30 rounded-sm border border-neutral-800">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2 mb-2">
                                <MoveHorizontal size={12} /> Grid Position
                            </label>
                            <div className="flex items-center gap-2">
                                <button onClick={() => updateTank(selectedTank.id, 'columnIndex', Math.max(0, (selectedTank.columnIndex || 0) - 1))} className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-sm text-xs flex items-center justify-center gap-1"><ChevronLeft size={14} /></button>
                                <span className="text-sm font-mono text-neutral-400 w-8 text-center">{selectedTank.columnIndex || 0}</span>
                                <button onClick={() => updateTank(selectedTank.id, 'columnIndex', (selectedTank.columnIndex || 0) + 1)} className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-sm text-xs flex items-center justify-center gap-1"><ChevronRight size={14} /></button>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-neutral-800">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2"><Network size={12} /> Parents</label>
                            <div className="space-y-1 mb-3">
                                {selectedTank.parentIds?.length > 0 ? selectedTank.parentIds.map(pid => (
                                    <div key={pid} className="flex items-center justify-between bg-neutral-800/50 p-2 rounded-sm border border-neutral-800 text-xs">
                                        <span className="text-neutral-300">{tanks.find(t => t.id === pid)?.name}</span>
                                        <button onClick={() => toggleParent(selectedTank.id, pid)} className="text-neutral-600 hover:text-neutral-300"><Unlink size={12} /></button>
                                    </div>
                                )) : <div className="text-xs text-neutral-600 italic">No parents linked.</div>}
                            </div>
                            <div className="relative">
                                <button onClick={() => { setIsParentMenuOpen(!isParentMenuOpen); setIsChildMenuOpen(false); }} className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-sm border border-neutral-700 text-xs flex items-center justify-center gap-2"><LinkIcon size={12} /> Link Parent</button>
                                {isParentMenuOpen && (
                                    <div className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-700 shadow-xl z-50">
                                        {availableParents.map(p => (
                                            <button key={p.id} onClick={() => toggleParent(selectedTank.id, p.id)} className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-800 ${selectedTank.parentIds.includes(p.id) ? 'bg-neutral-800' : ''}`}>
                                                <span>{p.name} <span className="text-neutral-500">- T{tiers.find(tr => tr.id === p.tierId)?.roman}</span></span>
                                                {selectedTank.parentIds.includes(p.id) && <span className="text-neutral-500 text-[10px]">LINKED</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-neutral-800">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2"><ArrowDownCircle size={12} /> Children</label>
                            <div className="space-y-1 mb-3">
                                {currentChildren.length > 0 ? currentChildren.map(child => (
                                    <div key={child.id} className="flex items-center justify-between bg-neutral-800/50 p-2 rounded-sm border border-neutral-800 text-xs">
                                        <span className="text-neutral-300">{child.name}</span>
                                        <button onClick={() => toggleChild(selectedTank.id, child.id)} className="text-neutral-600 hover:text-neutral-300"><Unlink size={12} /></button>
                                    </div>
                                )) : <div className="text-xs text-neutral-600 italic">No children linked.</div>}
                            </div>
                            <div className="relative">
                                <button onClick={() => { setIsChildMenuOpen(!isChildMenuOpen); setIsParentMenuOpen(false); }} className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-sm border border-neutral-700 text-xs flex items-center justify-center gap-2"><LinkIcon size={12} /> Link Child</button>
                                {isChildMenuOpen && (
                                    <div className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-700 shadow-xl z-50">
                                        {availableChildren.map(c => (
                                            <button key={c.id} onClick={() => toggleChild(selectedTank.id, c.id)} className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-800 ${c.parentIds.includes(selectedTank.id) ? 'bg-neutral-800' : ''}`}>
                                                <span>{c.name} <span className="text-neutral-500">- T{tiers.find(tr => tr.id === c.tierId)?.roman}</span></span>
                                                {c.parentIds.includes(selectedTank.id) && <span className="text-neutral-500 text-[10px]">LINKED</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 mt-auto">
                            <button onClick={() => handleDeleteTank(selectedTank.id)} className="w-full py-2 bg-transparent hover:bg-red-950/30 text-neutral-600 hover:text-red-500 rounded-sm border border-neutral-800 hover:border-red-900 transition-colors text-xs flex items-center justify-center gap-2">
                                <Trash2 size={12} /> Delete Tank
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center text-neutral-700 mt-4 mb-8">
                            <Layout size={32} className="mx-auto mb-4 opacity-50" />
                            <p className="text-xs">Select a node to edit, or configure groups below.</p>
                        </div>
                        <div className="border-t border-neutral-800 pt-6">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2 mb-4"><Palette size={12} /> Class Manager</label>
                            <div className="space-y-2">
                                {groups.map(g => (
                                    <div key={g.id} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 p-2 rounded-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="relative group/color cursor-pointer">
                                                <div className="w-4 h-4 rounded-sm border border-white/10" style={{ backgroundColor: g.color }}></div>
                                                <input type="color" value={g.color} onChange={(e) => updateGroupColor(g.id, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <GroupIcon icon={g.icon} color={g.color} size={14} />
                                                <span className="text-xs font-mono text-neutral-400">{g.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;