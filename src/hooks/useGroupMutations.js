import { generateId } from '../utils/utils';
import { processImageForStorage } from '../utils/imageUtils';

export const useGroupMutations = ({
    groups,
    setGroups,
    setRoleGroups,
    setTanks,
    imageLibrary,
    setImageLibrary,
}) => {
    const updateGroup = (groupId, field, value) =>
        setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, [field]: value } : g)));

    const updateGroupColor = (gid, color) => updateGroup(gid, 'color', color);

    const updateRoleGroup = (groupId, field, value) =>
        setRoleGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, [field]: value } : g)));

    const handleAddGroup = () =>
        setGroups((prev) => [
            ...prev,
            { id: generateId(), name: 'New Class', color: '#ffffff', icon: 'lt', isCustom: true },
        ]);

    const handleDeleteGroup = (groupId) => {
        if (groups.length <= 1) {
            alert('At least one class group is required.');
            return;
        }
        const fallbackGroupId = groups.find((g) => g.id !== groupId).id;
        setTanks((prev) =>
            prev.map((t) => ({ ...t, groupId: t.groupId === groupId ? fallbackGroupId : t.groupId }))
        );
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
    };

    const handleGroupIconUpload = async (e, groupId) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const { imageRef, imageData, isNew } = await processImageForStorage(file, imageLibrary);
                if (isNew) setImageLibrary((prev) => ({ ...prev, [imageRef]: imageRef }));
                updateGroup(groupId, 'icon', imageData || imageLibrary[imageRef]);
            } catch (err) {
                console.error('Icon upload failed:', err);
                alert('Failed to process icon');
            }
        }
        e.target.value = '';
    };

    const handleAddRoleGroup = () =>
        setRoleGroups((prev) => [
            ...prev,
            { id: generateId(), name: 'New Role Class', color: '#94a3b8', icon: 'lt', isCustom: true },
        ]);

    const handleDeleteRoleGroup = (groupId) => {
        setTanks((prev) =>
            prev.map((t) => ({ ...t, roleGroupId: t.roleGroupId === groupId ? null : t.roleGroupId }))
        );
        setRoleGroups((prev) => prev.filter((g) => g.id !== groupId));
    };

    const handleRoleGroupIconUpload = async (e, groupId) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const { imageRef, imageData, isNew } = await processImageForStorage(file, imageLibrary);
                if (isNew) setImageLibrary((prev) => ({ ...prev, [imageRef]: imageRef }));
                updateRoleGroup(groupId, 'icon', imageData || imageLibrary[imageRef]);
            } catch (err) {
                console.error('Icon upload failed:', err);
                alert('Failed to process icon');
            }
        }
        e.target.value = '';
    };

    return {
        updateGroup,
        updateGroupColor,
        handleAddGroup,
        handleDeleteGroup,
        handleGroupIconUpload,
        updateRoleGroup,
        handleAddRoleGroup,
        handleDeleteRoleGroup,
        handleRoleGroupIconUpload,
    };
};