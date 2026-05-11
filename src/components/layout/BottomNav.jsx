import { Map, BookOpen, BarChart2, Settings } from 'lucide-react';

const TABS = [
  { id: 'map',      label: '地図',  Icon: Map },
  { id: 'diary',    label: '日記',  Icon: BookOpen },
  { id: 'stats',    label: '統計',  Icon: BarChart2 },
  { id: 'settings', label: '設定',  Icon: Settings },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="flex border-t border-stone-100 bg-white/95 backdrop-blur-sm">
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors"
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-stone-700" />
            )}
            <Icon
              size={20}
              strokeWidth={active ? 2.2 : 1.7}
              className={active ? 'text-stone-700' : 'text-stone-400'}
            />
            <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-stone-700' : 'text-stone-400'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
