import { Star, Coins } from 'lucide-react';

export const CostInput = ({ type, value, onChange, placeholder = "0" }) => {
    const config = {
        xp: { icon: Star, color: 'text-blue-400', border: 'border-neutral-700' },
        silver: { icon: Coins, color: 'text-neutral-300', border: 'border-neutral-700' },
        gold: { icon: Coins, color: 'text-yellow-500', border: 'border-yellow-900/50' }
    }[type];

    const Icon = config.icon;

    return (
        <div className="space-y-1">
            <label className={`text-[9px] ${config.color} font-bold flex items-center gap-1 justify-center`}>
                <Icon size={8} /> {type.toUpperCase()}
            </label>
            <input
                type="number"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className={`w-full bg-neutral-950 border ${config.border} text-center rounded-sm text-xs py-1.5 ${config.color} focus:outline-none focus:border-neutral-500`}
            />
        </div>
    );
};