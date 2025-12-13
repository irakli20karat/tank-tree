import { Target } from 'lucide-react';

export const GroupIcon = ({ icon, color, size = 16 }) => {
    const props = { size, color, strokeWidth: 2 };
    switch (icon) {
        // old icons for backward compatibility
        case 'diamond': return <img src="/class_icons/light_tank.png" width={size} height={size} alt="light tank" />;
        case 'hexagon': return <img src="/class_icons/medium_tank.png" width={size} height={size} alt="medium tank" />;
        case 'square': return <img src="/class_icons/heavy_tank.png" width={size} height={size} alt="heavy tank" />;
        case 'triangle': return <img src="/class_icons/tank_destroyer.png" width={size} height={size} alt="tank destroyer" />;
        case 'circle': return <img src="/class_icons/spg.png" width={size} height={size} alt="spg" />;

        // new icons
        case 'lt': return <img src="/class_icons/light_tank.png" width={size} height={size} alt="light tank" />;
        case 'mt': return <img src="/class_icons/medium_tank.png" width={size} height={size} alt="medium tank" />;
        case 'ht': return <img src="/class_icons/heavy_tank.png" width={size} height={size} alt="heavy tank" />;
        case 'td': return <img src="/class_icons/tank_destroyer.png" width={size} height={size} alt="tank destroyer" />;
        case 'spg': return <img src="/class_icons/spg.png" width={size} height={size} alt="spg" />;
        default: return <Target {...props} />;
    }
};
