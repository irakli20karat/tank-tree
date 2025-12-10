import { Target, Diamond, Hexagon, Square, Triangle, Circle } from 'lucide-react';

export const GroupIcon = ({ icon, color, size = 16 }) => {
    const props = { size, color, strokeWidth: 2 };
    switch (icon) {
        case 'diamond': return <Diamond {...props} />;
        case 'hexagon': return <Hexagon {...props} />;
        case 'square': return <Square {...props} />;
        case 'triangle': return <Triangle {...props} />;
        case 'circle': return <Circle {...props} />;
        default: return <Target {...props} />;
    }
};
