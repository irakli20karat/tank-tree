import { Layout, Palette, Plus, Trash2, RotateCcw, Upload, Map, PaintBucket, X } from 'lucide-react';
import { GroupIcon } from '../GroupIcon';
import { useState, useMemo } from 'react';

export const GlobalSettingsView = ({ groups, updateGroup, handleAddGroup, handleDeleteGroup, handleGroupIconUpload, tiers, setTierRegion }) => {

    const initialRegionValues = useMemo(() => tiers.length > 0 ? { start: tiers[0].id, end: tiers[tiers.length - 1].id } : { start: '', end: '' }, [tiers]);
    const [regionStart, setRegionStart] = useState(() => initialRegionValues.start);
    const [regionEnd, setRegionEnd] = useState(() => initialRegionValues.end);
    const [regionName, setRegionName] = useState('');
    const [regionColor, setRegionColor] = useState('#3b82f6');

    return (
        <div className="space-y-6">
            <div className="text-center text-neutral-700 mt-4 mb-8">
                <Layout size={32} className="mx-auto mb-4 opacity-50" />
                <p className="text-xs">Select a node to edit, or configure groups below.</p>
            </div>

            <div className="border-t border-neutral-800 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2"><Palette size={12} /> Class Manager</label>
                    <button onClick={handleAddGroup} className="flex items-center gap-1 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-sm border border-neutral-700 transition-colors">
                        <Plus size={10} /> Add Class
                    </button>
                </div>
                <div className="space-y-3">
                    {groups.map(g => (
                        <div key={g.id} className="bg-neutral-950 border border-neutral-800 p-2 rounded-sm space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="relative cursor-pointer group/color">
                                    <div className="w-6 h-6 rounded-sm border border-white/10" style={{ backgroundColor: g.color }}></div>
                                    <input type="color" value={g.color} onChange={(e) => updateGroup(g.id, 'color', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <input type="text" value={g.name} onChange={(e) => updateGroup(g.id, 'name', e.target.value)} className="flex-1 bg-transparent border-b border-transparent focus:border-neutral-600 text-xs font-mono text-neutral-200 focus:outline-none py-1" />
                                {groups.length > 1 && <button onClick={() => handleDeleteGroup(g.id)} className="text-neutral-600 hover:text-red-500 transition-colors p-1"><Trash2 size={12} /></button>}
                            </div>
                            <div className="flex items-center gap-2 bg-neutral-900/50 p-1 rounded-sm overflow-x-auto">
                                <div className="flex-shrink-0 border-r border-neutral-800 pr-2 mr-1"><GroupIcon icon={g.icon} color={g.color} size={20} /></div>
                                {['lt', 'mt', 'ht', 'td', 'spg'].map(preset => (
                                    <button key={preset} onClick={() => updateGroup(g.id, 'icon', preset)} className={`p-1 rounded-sm hover:bg-neutral-800 ${g.icon === preset ? 'bg-neutral-800 ring-1 ring-neutral-700' : 'opacity-50 hover:opacity-100'}`}>
                                        <GroupIcon icon={preset} color={g.color} size={14} />
                                    </button>
                                ))}
                                <div className="h-4 w-[1px] bg-neutral-800 mx-1"></div>
                                <label className="cursor-pointer p-1 rounded-sm hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200">
                                    <Upload size={14} />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGroupIconUpload(e, g.id)} />
                                </label>
                                {g.icon && (g.icon.startsWith('data:') || g.icon.startsWith('http')) && <button onClick={() => updateGroup(g.id, 'icon', 'lt')} className="p-1 rounded-sm hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200"><RotateCcw size={14} /></button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-neutral-800 pt-6">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2 mb-4"><Map size={12} /> Tier Regions / Eras</label>
                <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-sm space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[9px] text-neutral-600 uppercase font-bold">From</label>
                            <select value={regionStart} onChange={(e) => setRegionStart(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-sm text-xs py-1 px-2 text-neutral-300 focus:outline-none">
                                {tiers.map(t => <option key={t.id} value={t.id}>{t.roman} (Tier {t.index + 1})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-neutral-600 uppercase font-bold">To</label>
                            <select value={regionEnd} onChange={(e) => setRegionEnd(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-sm text-xs py-1 px-2 text-neutral-300 focus:outline-none">
                                {tiers.map(t => <option key={t.id} value={t.id}>{t.roman} (Tier {t.index + 1})</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] text-neutral-600 uppercase font-bold">Region Name</label>
                        <input type="text" placeholder="e.g. Cold War" value={regionName} onChange={(e) => setRegionName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-sm text-xs py-1.5 px-2 text-neutral-200 focus:border-neutral-500 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative cursor-pointer flex-shrink-0 group/color">
                            <div className="w-8 h-8 rounded-sm border border-neutral-700 flex items-center justify-center" style={{ backgroundColor: regionColor }}>
                                <PaintBucket size={14} className="text-white mix-blend-difference opacity-50" />
                            </div>
                            <input type="color" value={regionColor} onChange={(e) => setRegionColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <button onClick={() => setTierRegion(regionStart, regionEnd, regionName, regionColor)} disabled={!regionName} className="flex-1 py-1.5 bg-neutral-800 hover:bg-blue-900/30 border border-neutral-700 hover:border-blue-800 text-xs text-neutral-300 rounded-sm transition-colors disabled:opacity-50">Apply Region</button>
                    </div>
                    <button onClick={() => { setTierRegion(regionStart, regionEnd, null, null); setRegionName(''); }} className="w-full py-1 bg-transparent hover:bg-red-950/20 text-neutral-600 hover:text-red-500 text-[10px] rounded-sm transition-colors flex items-center justify-center gap-1"><X size={10} /> Clear Range Style</button>
                </div>
            </div>
        </div>
    );
};