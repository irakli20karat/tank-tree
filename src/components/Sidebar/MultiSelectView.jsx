import { Layers, ChevronDown, Trash2 } from 'lucide-react';
import { GroupIcon } from '../GroupIcon';
import { CostInput } from '../UI/CostInput';
import { ImageUploader } from '../UI/ImageUploader';
import { useState } from 'react';

export const MultiSelectView = ({ selectedTanks, groups, updateTank, handleDeleteTank }) => {
    const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);

    const handleMultiUpdate = (field, value) => {
        selectedTanks.forEach(tank => updateTank(tank.id, field, value));
    };

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => handleMultiUpdate(field, ev.target.result);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    return (
        <div className="space-y-6">
            <div className="p-3 bg-blue-900/20 border border-blue-900/50 rounded-sm flex items-center gap-3">
                <Layers className="text-blue-400" size={20} />
                <div>
                    <h3 className="text-xs font-bold text-blue-200">Batch Editing</h3>
                    <p className="text-[10px] text-blue-400">Applying to {selectedTanks.length} tanks.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Class Group</label>
                <div className="relative">
                    <button onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)} className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 flex items-center justify-between">
                        <span className="text-neutral-400 italic">Select to overwrite...</span>
                        <ChevronDown size={12} />
                    </button>
                    {isGroupMenuOpen && (
                        <div className="absolute top-full left-0 w-full bg-neutral-900 border border-neutral-700 z-50 mt-1 shadow-xl">
                            {groups.map(g => (
                                <button key={g.id} onClick={() => { handleMultiUpdate('groupId', g.id); setIsGroupMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-800">
                                    <GroupIcon icon={g.icon} color={g.color} size={24} /> {g.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-800">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Costs (Batch Overwrite)</label>
                <div className="grid grid-cols-3 gap-2">
                    <CostInput type="xp" placeholder="-" onChange={(v) => handleMultiUpdate('xpCost', v)} />
                    <CostInput type="silver" placeholder="-" onChange={(v) => handleMultiUpdate('silverCost', v)} />
                    <CostInput type="gold" placeholder="-" onChange={(v) => handleMultiUpdate('goldCost', v)} />
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-neutral-800">
                <ImageUploader
                    label="Batch Vehicle Image"
                    onUpload={(e) => handleFileUpload(e, 'image')}
                    onUrlChange={(v) => handleMultiUpdate('image', v)}
                    onClear={() => handleMultiUpdate('image', null)}
                />

                <div className="pt-2">
                    <ImageUploader
                        label="Batch Background"
                        isBg={true}
                        onUpload={(e) => handleFileUpload(e, 'bgImage')}
                        onUrlChange={(v) => handleMultiUpdate('bgImage', v)}
                        onClear={() => handleMultiUpdate('bgImage', null)}
                    />
                </div>
            </div>

            <div className="pt-6 mt-auto">
                <button
                    onClick={() => window.confirm(`Delete ${selectedTanks.length} tanks?`) && selectedTanks.forEach(t => handleDeleteTank(t.id))}
                    className="w-full py-2 bg-transparent hover:bg-red-950/30 text-neutral-600 hover:text-red-500 rounded-sm border border-neutral-800 hover:border-red-900 transition-colors text-xs flex items-center justify-center gap-2"
                >
                    <Trash2 size={12} /> Delete {selectedTanks.length} Tanks
                </button>
            </div>
        </div>
    );
};