import { generateId } from '../utils/utils';
import { processImageForStorage } from '../utils/imageUtils';

export const useTankMutations = ({
    tanks,
    setTanks,
    tiers,
    groups,
    selectedTankId,
    setSelectedTankId,
    setIsSidebarOpen,
    imageLibrary,
    setImageLibrary,
}) => {
    const updateTank = (id, field, value) =>
        setTanks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

    const toggleParent = (id, pid) =>
        setTanks((curr) =>
            curr.map((t) =>
                t.id === id
                    ? {
                        ...t,
                        parentIds: t.parentIds.includes(pid)
                            ? t.parentIds.filter((x) => x !== pid)
                            : [...t.parentIds, pid],
                    }
                    : t
            )
        );

    const toggleChild = (id, cid) =>
        setTanks((curr) =>
            curr.map((t) =>
                t.id === cid
                    ? {
                        ...t,
                        parentIds: t.parentIds.includes(id)
                            ? t.parentIds.filter((x) => x !== id)
                            : [...t.parentIds, id],
                    }
                    : t
            )
        );

    const handleAddTank = (tierId, specificColIndex = null) => {
        const tierIndex = tiers.findIndex((t) => t.id === tierId);
        let targetCol = 0;
        let parentId = null;
        let inheritedGroup = groups[0].id;

        const parent = selectedTankId ? tanks.find((t) => t.id === selectedTankId) : null;

        if (specificColIndex !== null) {
            targetCol = specificColIndex;
            if (
                parent &&
                tiers.findIndex((t) => t.id === parent.tierId) === tierIndex - 1
            ) {
                parentId = parent.id;
                inheritedGroup = parent.groupId;
            }
        } else {
            if (
                parent &&
                tiers.findIndex((t) => t.id === parent.tierId) === tierIndex - 1
            ) {
                parentId = parent.id;
                targetCol = parent.columnIndex || 0;
                inheritedGroup = parent.groupId;
            }
            while (tanks.some((t) => t.tierId === tierId && t.columnIndex === targetCol)) {
                targetCol++;
            }
        }

        const newTank = {
            id: generateId(),
            name: 'New Vehicle',
            tierId,
            image: null,
            parentIds: parentId ? [parentId] : [],
            groupId: inheritedGroup,
            roleGroupId: null,
            xpCost: 0,
            silverCost: 0,
            goldCost: 0,
            costType: 'xp',
            columnIndex: targetCol,
            url: '',
            description: '',
        };

        setTanks((prev) => [...prev, newTank]);
        setSelectedTankId(newTank.id);
        setIsSidebarOpen(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file && selectedTankId) {
            try {
                const { imageRef, imageData, isNew } = await processImageForStorage(file, imageLibrary);
                if (isNew) setImageLibrary((prev) => ({ ...prev, [imageRef]: imageData }));
                updateTank(selectedTankId, 'image', imageData || imageLibrary[imageRef]);
            } catch (err) {
                console.error('Image upload failed:', err);
                alert('Failed to process image');
            }
        }
        e.target.value = '';
    };

    const handleBgImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file && selectedTankId) {
            try {
                const { imageRef, imageData, isNew } = await processImageForStorage(file, imageLibrary);
                if (isNew) setImageLibrary((prev) => ({ ...prev, [imageRef]: imageData }));
                updateTank(selectedTankId, 'bgImage', imageData || imageLibrary[imageRef]);
            } catch (err) {
                console.error('Background image upload failed:', err);
                alert('Failed to process image');
            }
        }
        e.target.value = '';
    };

    return {
        updateTank,
        toggleParent,
        toggleChild,
        handleAddTank,
        handleImageUpload,
        handleBgImageUpload,
    };
};