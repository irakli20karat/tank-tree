import { Upload, Globe, Trash2, Copy, ClipboardPaste } from 'lucide-react';

export const ImageUploader = ({ label, value, onUpload, onUrlChange, onClear }) => {
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
                            target: { files: [file], value: '' }
                        };
                        onUpload(syntheticEvent);
                        return;
                    }
                }
            }

            const text = await navigator.clipboard.readText();
            const trimmed = text.trim();
            if (trimmed.startsWith('data:')) {
                handleUrlInput(trimmed);
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    const handleCopyImage = async () => {
        if (!hasImage) return;

        try {
            // If it's a data URL, convert to blob and copy
            if (value.startsWith('data:')) {
                const response = await fetch(value);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
            } else {
                // If it's a URL, copy the URL text
                await navigator.clipboard.writeText(value);
            }
        } catch (err) {
            console.error('Failed to copy image:', err);
        }
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-neutral-300">
                    {label}
                </label>
            )}

            <div
                className="relative border-2 border-dashed border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors cursor-pointer group bg-neutral-900/50"
                onClick={() => document.getElementById(inputId).click()}
                tabIndex={0}
                role="button"
                aria-label={`Upload ${label}`}
            >
                {hasImage ? (
                    <>
                        <img
                            src={value}
                            alt={label}
                            className="w-full h-48 object-contain rounded-lg"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.querySelector('.error-msg')?.classList.remove('hidden');
                            }}
                        />
                        <div className="hidden error-msg absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">
                            Failed to load image
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyImage();
                                }}
                                className="p-1.5 bg-neutral-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-sm hover:text-blue-400"
                                title="Copy image"
                            >
                                <Copy size={16} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePasteFromClipboard();
                                }}
                                className="p-1.5 bg-neutral-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-sm hover:text-green-400"
                                title="Paste from clipboard"
                            >
                                <ClipboardPaste size={16} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClear();
                                }}
                                className="p-1.5 bg-neutral-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-sm hover:text-red-400"
                                title="Clear image"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <Upload className="w-10 h-10 text-neutral-600 mb-3" />
                        <p className="text-sm text-neutral-400 font-medium mb-1">Click to Upload</p>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePasteFromClipboard();
                            }}
                            className="mt-3 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-sm hover:bg-neutral-750 transition-colors text-neutral-300 text-xs flex items-center gap-1.5"
                            title="Paste from clipboard"
                        >
                            <ClipboardPaste size={14} />
                            Paste from Clipboard
                        </button>
                    </div>
                )}

                <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    onChange={onUpload}
                    className="hidden"
                />
            </div>

            <div className="relative">
                <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                <input
                    type="text"
                    placeholder="Or paste image URL"
                    value={value || ''}
                    onChange={(e) => handleUrlInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-sm pl-7 pr-2 py-1.5 text-xs text-neutral-200 focus:border-neutral-500 focus:outline-none placeholder-neutral-600"
                />
            </div>
        </div>
    );
};