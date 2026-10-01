import React from 'react';

export function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-xl ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all select-none ${
              isActive
                ? 'bg-white text-salon-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(Tabs);
