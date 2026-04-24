export const useTierMutations = ({ tiers, setTiers, tanks }) => {
    const handleDeleteTier = (id) => {
        const isLast = tiers[tiers.length - 1].id === id;
        if (!isLast || tanks.some((t) => t.tierId === id)) return;
        setTiers(tiers.filter((t) => t.id !== id));
    };

    const setTierRegion = (startTierId, endTierId, name, color) => {
        setTiers((prevTiers) => {
            const startIndex = prevTiers.findIndex((t) => t.id === startTierId);
            const endIndex = prevTiers.findIndex((t) => t.id === endTierId);
            if (startIndex === -1 || endIndex === -1) return prevTiers;

            const lower = Math.min(startIndex, endIndex);
            const upper = Math.max(startIndex, endIndex);

            return prevTiers.map((tier, index) =>
                index >= lower && index <= upper
                    ? { ...tier, regionName: name, regionColor: color }
                    : tier
            );
        });
    };

    const clearTierRegion = (startTierId, endTierId) =>
        setTierRegion(startTierId, endTierId, null, null);

    return { handleDeleteTier, setTierRegion, clearTierRegion };
};