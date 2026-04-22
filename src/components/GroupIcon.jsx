import { Target, HelpCircle } from 'lucide-react';

export const GroupIcon = ({ icon, color, size = 16, type = 'primary' }) => {
    const props = { size, color, strokeWidth: 2 };

    if (icon && (icon.startsWith('data:') || icon.startsWith('http') || icon.startsWith('/'))) {
        return (
            <img
                src={icon}
                style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
                alt="icon"
            />
        );
    }

    const classMap = {
        'diamond': 'light_tank.png',
        'hexagon': 'medium_tank.png',
        'square': 'heavy_tank.png',
        'triangle': 'tank_destroyer.png',
        'circle': 'spg.png',
        'lt': 'light_tank.png',
        'mt': 'medium_tank.png',
        'ht': 'heavy_tank.png',
        'td': 'tank_destroyer.png',
        'spg': 'spg.png',
    };

    const roleMap = {
        'assault': 'role_assault.png',
        'breakthrough': 'role_breakthrough.png',
        'sniper': 'role_sniper.png',
        'spg': 'role_spg.png',
        'support': 'role_support.png',
        'versatile': 'role_versatile.png',
        'wheeled': 'role_wheeled.png',
    };

    if (type === 'role' && icon in roleMap) {
        return <img src={`/role_icons/${roleMap[icon]}`} width={size} height={size} alt={icon} />;
    }

    if (type === 'primary' && icon in classMap) {
        return <img src={`/class_icons/${classMap[icon]}`} width={size} height={size} alt={icon} />;
    }

    return <Target {...props} />;
};