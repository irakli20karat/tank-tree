import { Settings, ChevronDown } from 'lucide-react';
import { MultiSelectView } from './Sidebar/MultiSelectView';
import { SingleSelectView } from './Sidebar/SingleSelectView';
import { GlobalSettingsView } from './Sidebar/GlobalSettingsView';

const Sidebar = ({
    isOpen, setIsOpen,
    selectedTank, selectedIds, tanks, tiers, groups,
    updateTank, updateGroup, handleDeleteTank,
    setTierRegion, toggleParent, toggleChild,
    handleImageUpload, handleBgImageUpload,
    handleAddGroup, handleDeleteGroup, handleGroupIconUpload
}) => {

    const selectedTanks = selectedIds && selectedIds.size > 0
        ? tanks.filter(t => selectedIds.has(t.id))
        : (selectedTank ? [selectedTank] : []);

    const isMultiSelect = selectedTanks.length > 1;

    return (
        <div className={`flex-shrink-0 bg-neutral-900 border-r border-neutral-800 transition-all duration-300 flex flex-col ${isOpen ? 'w-80' : 'w-0'}`}>
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Settings size={16} /> {isMultiSelect ? `${selectedTanks.length} Selected` : 'Properties'}
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-neutral-200">
                    <ChevronDown className="transform rotate-90" size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {isMultiSelect ? (
                    <MultiSelectView
                        selectedTanks={selectedTanks}
                        groups={groups}
                        updateTank={updateTank}
                        handleDeleteTank={handleDeleteTank}
                    />
                ) : selectedTank ? (
                    <SingleSelectView
                        tank={selectedTank}
                        tanks={tanks}
                        tiers={tiers}
                        groups={groups}
                        updateTank={updateTank}
                        handleDeleteTank={handleDeleteTank}
                        toggleParent={toggleParent}
                        toggleChild={toggleChild}
                        handleImageUpload={handleImageUpload}
                        handleBgImageUpload={handleBgImageUpload}
                    />
                ) : (
                    <GlobalSettingsView
                        groups={groups}
                        updateGroup={updateGroup}
                        handleAddGroup={handleAddGroup}
                        handleDeleteGroup={handleDeleteGroup}
                        handleGroupIconUpload={handleGroupIconUpload}
                        tiers={tiers}
                        setTierRegion={setTierRegion}
                    />
                )}
            </div>
        </div>
    );
};

export default Sidebar;