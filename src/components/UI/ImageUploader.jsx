import { Upload, Globe, Trash2 } from 'lucide-react';

export const ImageUploader = ({
    label,
    value,
    onUpload,
    onUrlChange,
    onClear
}) => {
    const inputId = `file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const hasImage = value && typeof value === 'string' && value.length > 0;

    const handleUrlInput = (url) => {
        if (!url || url.trim() === '') {
            onUrlChange('');
            return;
        }

        onUrlChange(url.trim());
    };

    const handlePasteFromClipboard = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        const file = new File([blob], 'pasted-image.png', { type });
                        
                        const syntheticEvent = {
                            target: {
                                files: [file],
                                value: ''
                            }
                        };
                        onUpload(syntheticEvent);
                        return;
                    }
                }
            }
            
            const text = await navigator.clipboard.readText();
            const trimmed = text.trim();
            if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
                handleUrlInput(trimmed);
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    const handlePaste = async (e) => {
        e.preventDefault();
        
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    const syntheticEvent = {
                        target: {
                            files: [file],
                            value: ''
                        }
                    };
                    onUpload(syntheticEvent);
                }
                return;
            }
            
            if (item.type === 'text/plain') {
                item.getAsString((text) => {
                    const trimmed = text.trim();
                    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
                        handleUrlInput(trimmed);
                    }
                });
                return;
            }
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        handlePasteFromClipboard();
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    {label}
                </label>
            )}

            <div
                className="h-32 w-full border border-dashed border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 rounded-sm flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group"
                onClick={() => document.getElementById(inputId).click()}
                onContextMenu={handleContextMenu}
                onPaste={handlePaste}
                tabIndex={0}
                role="button"
                aria-label={`Upload ${label}`}
            >
                {hasImage ? (
                    <>
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.querySelector('.error-msg')?.classList.remove('hidden');
                            }}
                        />
                        <div className="hidden error-msg text-xs text-red-400 text-center px-2">
                            Failed to load image
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onClear(); }}
                            className="absolute top-2 right-2 p-1.5 bg-neutral-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-sm hover:text-red-400"
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-neutral-600">
                        <Upload size={24} className="mb-2" />
                        <span className="text-xs font-medium">Click to Upload</span>
                        <span className="text-[10px] mt-1 text-neutral-700">Right-click or Ctrl+V to paste</span>
                    </div>
                )}

                <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onUpload}
                />
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <Globe size={12} className="text-neutral-600" />
                </div>
                <input
                    type="text"
                    placeholder="Or paste Image URL..."
                    value={hasImage && !value.startsWith('data:') ? value : ''}
                    onChange={(e) => handleUrlInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-sm pl-7 pr-2 py-1.5 text-xs text-neutral-200 focus:border-neutral-500 focus:outline-none placeholder-neutral-600"
                />
            </div>
        </div>
    );
};