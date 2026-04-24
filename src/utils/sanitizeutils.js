export const sanitizeTankData = (tanks) =>
    tanks.map((t) => ({
        ...t,
        silverCost: typeof t.silverCost === 'number' ? t.silverCost : 0,
        xpCost: typeof t.xpCost === 'number' ? t.xpCost : 0,
        goldCost: typeof t.goldCost === 'number' ? t.goldCost : 0,
        costType: t.costType || 'xp',
        columnIndex: t.columnIndex || 0,
        parentIds: t.parentIds || [],
        url: typeof t.url === 'string' ? t.url : '',
        description: typeof t.description === 'string' ? t.description : '',
        customFields: Array.isArray(t.customFields) ? t.customFields : [],
        roleGroupId: t.roleGroupId || null,
    }));