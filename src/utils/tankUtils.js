export { COLUMN_WIDTH, TANK_WIDTH } from "./utils";

export const ROW_HEIGHT = 180;

export const INITIAL_TANKS = [
    { id: 't1', name: 'MS-1', tierId: 'tier-1', image: null, parentIds: [], groupId: 'g_lt', xpCost: 0, columnIndex: 2 },
    { id: 't2', name: 'BT-2', tierId: 'tier-2', image: null, parentIds: ['t1'], groupId: 'g_lt', xpCost: 270, columnIndex: 2 },
];

export const toRoman = (num) => {
    const map = [
        { val: 1000, sym: "M" }, { val: 900, sym: "CM" }, { val: 500, sym: "D" }, { val: 400, sym: "CD" },
        { val: 100, sym: "C" }, { val: 90, sym: "XC" }, { val: 50, sym: "L" }, { val: 40, sym: "XL" },
        { val: 10, sym: "X" }, { val: 9, sym: "IX" }, { val: 5, sym: "V" }, { val: 4, sym: "IV" }, { val: 1, sym: "I" },
    ];
    let result = "";
    for (let { val, sym } of map) {
        while (num >= val) { result += sym; num -= val; }
    }
    return result;
};

export const generateTiers = (count) => Array.from({ length: count }, (_, i) => ({
    id: `tier-${i + 1}`, roman: toRoman(i + 1), index: i
}));

export const compressTank = (tank) => {
    const c = { id: tank.id, name: tank.name, tierId: tank.tierId, groupId: tank.groupId };
    if (tank.columnIndex) c.columnIndex = tank.columnIndex;
    if (tank.parentIds?.length) c.parentIds = tank.parentIds;
    if (tank.xpCost) c.xpCost = tank.xpCost;
    if (tank.silverCost) c.silverCost = tank.silverCost;
    if (tank.goldCost) c.goldCost = tank.goldCost;
    if (tank.costType && tank.costType !== 'xp') c.costType = tank.costType;
    if (tank.url?.trim()) c.url = tank.url;
    if (tank.description?.trim()) c.description = tank.description;
    if (tank.customFields?.length) c.customFields = tank.customFields;
    if (tank.roleGroupId) c.roleGroupId = tank.roleGroupId;
    if (tank.imageRef) c.imageRef = tank.imageRef;
    if (tank.bgImageRef) c.bgImageRef = tank.bgImageRef;
    return c;
};