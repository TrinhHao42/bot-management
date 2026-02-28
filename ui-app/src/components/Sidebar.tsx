'use client';
import { useBotContext } from '@/context/BotContext';

export default function Sidebar() {
  const { currentView, setCurrentView, selectedBotId } = useBotContext();

  // Hide sidebar in chat view
  if (selectedBotId) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 hidden md:flex flex-col bg-surface-container transition-all duration-200 ease-in-out border-r border-outline-variant/30 z-40">
      <div className="px-unit-lg py-unit-xl flex flex-col gap-unit-xs">
        <div className="flex items-center gap-unit-sm mb-unit-lg">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed-dim flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
          <div>
            <h2 className="font-h2 text-h2 font-bold text-primary-fixed-dim tracking-tighter">BotManager</h2>
            <span className="font-label-caps text-[10px] text-on-surface-variant opacity-70">v2.4.0</span>
          </div>
        </div>

        <nav className="flex flex-col gap-unit-xs">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-unit-md px-unit-md py-unit-md rounded-lg transition-all duration-200 ease-in-out font-h3 text-h3 ${currentView === 'dashboard'
                ? 'text-primary-fixed-dim border-r-4 border-primary-fixed-dim bg-surface-container-high'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary-fixed'
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'dashboard' ? "'FILL' 1" : "" }}>smart_toy</span>
            <span>All Bots</span>
          </button>

          <button
            onClick={() => setCurrentView('settings')}
            className={`flex items-center gap-unit-md px-unit-md py-unit-md rounded-lg transition-all duration-200 ease-in-out font-h3 text-h3 ${currentView === 'settings'
                ? 'text-primary-fixed-dim border-r-4 border-primary-fixed-dim bg-surface-container-high'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary-fixed'
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'settings' ? "'FILL' 1" : "" }}>settings</span>
            <span>Settings</span>
          </button>
        </nav>
      </div>

      <div className="mt-auto p-unit-lg border-t border-outline-variant/30">
        <div className="p-unit-md bg-surface-container-low rounded-xl flex items-center gap-unit-sm">
          <img alt="User Avatar" className="w-8 h-8 rounded-full bg-surface-container-highest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDT67Xw9Qx0L2EZ6FVw88wp-vFDRmyrME2cV9m7rJlzDm6Xb8lUWSDodAKfNLuiKjUkRyolagYY4Yhfa6d1-P0p-IfQ1g9U52kx1bwPK3hnWPhBGj1TLE9Z6k3q6TENXdQqplX2HiWx7a4itVkU6PxywIM0AYFwl_XT1Yq1zpMLuH-d-Q8D06xay8CBBwzwad6XarSceYMdXqvFMV7BhrHBHRQG4X0YztGlb-i8w99IJYlMz1BytfbCxinLB76N2jW64fmrK_fVA-_5" />
          <div className="flex-1 overflow-hidden">
            <p className="font-label-caps text-on-surface truncate text-xs">Admin Console</p>
            <p className="font-mono-data text-[10px] text-primary-fixed-dim">Active Session</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
