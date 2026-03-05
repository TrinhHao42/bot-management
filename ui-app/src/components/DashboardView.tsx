'use client';
import { useBotContext } from '@/context/BotContext';

export default function DashboardView() {
  const { bots, setSelectedBotId, setCurrentView } = useBotContext();

  const activeBots = bots.filter(b => b.isActive).length;
  const offlineBots = bots.filter(b => !b.isActive).length;

  return (
    <main className="md:ml-64 h-screen flex flex-col w-full relative">
      <header className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-unit-lg bg-surface border-b border-outline-variant/30 sticky top-0 z-30">
        <div className="flex items-center gap-unit-lg flex-1">
          <h1 className="font-h1 text-h1 font-black text-primary-fixed-dim tracking-tighter hidden md:block">Dashboard</h1>
          <div className="relative max-w-md w-full">
            <span className="material-symbols-outlined absolute left-unit-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-unit-sm pl-11 pr-unit-md focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim transition-all text-body-lg" placeholder="Search bots..." type="text"/>
          </div>
        </div>
        <div className="flex items-center gap-unit-md">
          <button className="flex items-center gap-unit-xs px-unit-md py-unit-sm rounded-lg bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-primary-fixed transition-colors font-body-lg">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span className="hidden md:inline">Filter</span>
          </button>
          <div className="h-8 w-[1px] bg-outline-variant mx-unit-xs"></div>
          <button className="p-unit-sm rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-unit-sm rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto custom-scrollbar p-margin-mobile md:p-margin-desktop bg-background pb-24 md:pb-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="flex items-end justify-between mb-unit-lg">
            <div>
              <p className="font-label-caps text-primary-fixed-dim mb-1 uppercase tracking-widest text-[10px]">System Overview</p>
              <h3 className="font-h1 text-h1 text-on-surface">Active Deployments</h3>
            </div>
            <div className="hidden md:flex items-center gap-unit-lg text-on-surface-variant font-mono-data text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-fixed-dim status-glow"></span>
                <span>{activeBots} Online</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <span>{offlineBots} Issues</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
            {bots.map((bot) => (
              <div key={bot.id} className={`group bg-surface-container-high border border-outline-variant/30 rounded-xl p-unit-md hover:bg-surface-container-highest transition-all duration-300 relative overflow-hidden ${!bot.isActive ? 'opacity-70 bg-surface-container-low' : ''}`}>
                <div className="flex justify-between items-start mb-unit-lg">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center font-bold text-2xl border border-outline-variant/50">
                      {bot.name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background flex items-center justify-center">
                      <span className={`w-2.5 h-2.5 rounded-full ${bot.isActive ? 'bg-primary-fixed-dim status-glow' : 'bg-error'}`}></span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`block font-mono-data text-xs ${bot.isActive ? 'text-primary-fixed-dim' : 'text-error'}`}>ID: {bot.id.split('-')[0].toUpperCase()}</span>
                    <span className="block font-label-caps text-[10px] text-on-surface-variant mt-1">{bot.isActive ? '100% UP' : 'OFFLINE'}</span>
                  </div>
                </div>

                <h4 className="font-h3 text-h3 text-on-surface mb-unit-xs truncate">{bot.name}</h4>
                <p className="font-body-sm text-on-surface-variant mb-unit-lg line-clamp-2 h-10">
                  {bot.description || 'System deployment. Processing logic.'}
                </p>

                <div className="flex items-center gap-unit-sm">
                  {bot.isActive ? (
                    <button onClick={() => setSelectedBotId(bot.id)} className="flex-1 bg-primary-fixed-dim text-on-primary-fixed py-unit-sm rounded-lg font-h3 text-sm hover:scale-[1.02] active:scale-95 transition-all">Chat</button>
                  ) : (
                    <button className="flex-1 bg-surface-container-highest text-on-surface-variant py-unit-sm rounded-lg font-h3 text-sm cursor-not-allowed">Offline</button>
                  )}
                  <button className="p-unit-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {bots.length === 0 && (
            <div className="col-span-full p-10 text-center text-on-surface-variant bg-surface-container-high border border-outline-variant rounded-xl mt-4">
              No bots installed yet. Go to Settings to add one.
            </div>
          )}
        </div>
      </section>

      {/* Mobile Footer */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center py-unit-sm bg-surface-container-high shadow-xl border-t border-outline-variant/50">
        <button onClick={() => setCurrentView('dashboard')} className="flex flex-col items-center justify-center text-primary-fixed-dim bg-surface-container-highest rounded-xl px-4 py-2 transition-transform active:scale-90">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          <span className="font-label-caps text-label-caps mt-1">All Bots</span>
        </button>
        <button onClick={() => setCurrentView('settings')} className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-2 transition-transform active:scale-90 hover:text-primary-fixed">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-caps text-label-caps mt-1">Settings</span>
        </button>
      </footer>
      
      <div className="fixed bottom-margin-desktop right-margin-desktop md:flex hidden z-40">
        <button className="w-14 h-14 bg-primary-fixed-dim text-on-primary-fixed rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center group">
          <span className="material-symbols-outlined text-[28px] group-hover:rotate-90 transition-transform">add</span>
        </button>
      </div>
    </main>
  );
}
