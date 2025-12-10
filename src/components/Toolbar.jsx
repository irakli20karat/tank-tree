import {
    Settings, Shield, GalleryVertical, GalleryHorizontal,
    RotateCcw, Upload, Save, Image as ImageIcon,
    Link2, AlertTriangle, BookOpen
} from 'lucide-react';

const Toolbar = ({ state, actions, refs }) => {
    return (
        <div className="h-12 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-950 z-20">

            <div className="flex items-center gap-4">
                {!state.isSidebarOpen && (
                    <button
                        onClick={() => actions.setIsSidebarOpen(true)}
                        className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-sm hover:bg-neutral-800"
                    >
                        <Settings size={16} />
                    </button>
                )}

                <h1 className="text-sm font-bold tracking-[0.2em] text-neutral-400 flex items-center gap-2 uppercase">
                    <Shield size={16} /> Tank Tree Architect (By Blackjader)
                </h1>

                <div className="h-6 w-px bg-neutral-800 mx-2"></div>

                <button
                    onClick={() => actions.setLayoutMode(prev => prev === 'vertical' ? 'horizontal' : 'vertical')}
                    className="flex items-center gap-2 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm text-xs font-medium text-neutral-400 transition-colors"
                >
                    {state.layoutMode === 'vertical' ? <GalleryVertical size={14} /> : <GalleryHorizontal size={14} />}
                    {state.layoutMode === 'vertical' ? 'VERTICAL' : 'HORIZONTAL'}
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 mr-4 border-r border-neutral-800 pr-4">
                    <input
                        type="file"
                        ref={refs?.fileInputRef}
                        onChange={actions?.handleFileChange}
                        accept=".json"
                        className="hidden"
                    />

                    <ActionButton onClick={actions.handleTotalReset} icon={RotateCcw} label="RESET" hoverColor="hover:text-red-400" />
                    <ActionButton onClick={actions.handleLoadClick} icon={Upload} label="LOAD" />
                    <ActionButton onClick={actions.handleSaveProject} icon={Save} label="SAVE" />
                    <ActionButton onClick={actions.handleSaveImage} icon={ImageIcon} label="IMG" />

                    <div className="w-px h-4 bg-neutral-800 mx-1"></div>

                    <ActionButton onClick={() => actions.setIsDocsOpen(true)} icon={BookOpen} label="DOCS" hoverColor="hover:text-blue-400" />
                </div>

                {state.connectionSourceId && (
                    <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold px-2 py-1 bg-neutral-900 border border-blue-900 rounded-sm animate-pulse">
                        <Link2 size={12} /> SELECT TARGET
                    </div>
                )}

                {Object.keys(state.conflicts).length > 0 && (
                    <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold px-2 py-1 bg-neutral-900 border border-red-900 rounded-sm">
                        <AlertTriangle size={12} /> {Object.keys(state.conflicts).length} ISSUES
                    </div>
                )}
            </div>
        </div>
    );
};

const ActionButton = ({ onClick, icon: Icon, label, hoverColor = "hover:text-neutral-200" }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2 py-1 text-neutral-500 ${hoverColor} text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm transition-colors`}
    >
        {Icon && <Icon size={12} />} {label}
    </button>
);

export default Toolbar;