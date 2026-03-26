'use client';
import { useBotContext } from '@/context/BotContext';
import { toggleBot, deleteBot, installBot, getSchedule, saveSchedule } from '@/services/api';
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';

export default function SettingsView() {
  const { bots, refreshBots } = useBotContext();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newBotId, setNewBotId] = useState('');
  const [selectedBotForSchedule, setSelectedBotForSchedule] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState({
    intervalValue: 1,
    intervalUnit: 'hours' as 'minutes' | 'hours' | 'days',
    keywords: '',
    level: '',
    salary: '',
    location: '',
    company: ''
  });

  const activeCount = bots.filter(b => b.isActive).length;

  const handleOpenSchedule = async (botId: string) => {
    setSelectedBotForSchedule(botId);
    try {
      const data = await getSchedule(botId);
      if (data && data.id) {
        setScheduleData({
          intervalValue: data.intervalValue || 1,
          intervalUnit: (data.intervalUnit as any) || 'hours',
          keywords: data.keywords || '',
          level: data.level || '',
          salary: data.salary || '',
          location: data.location || '',
          company: data.company || ''
        });
      } else {
        setScheduleData({ intervalValue: 1, intervalUnit: 'hours', keywords: '', level: '', salary: '', location: '', company: '' });
      }
      setShowScheduleModal(true);
    } catch (err) {
      console.error('Failed to fetch schedule', err);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotForSchedule) return;
    try {
      await saveSchedule(selectedBotForSchedule, {
        ...scheduleData,
        userId: 'user-1'
      });
      setShowScheduleModal(false);
      showToast('Job Alert Schedule updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to save schedule', err);
      showToast('Failed to save schedule', 'error');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleBot(id, !currentStatus);
      await refreshBots();
    } catch (err) {
      console.error('Failed to toggle bot', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bot?')) {
      try {
        await deleteBot(id);
        await refreshBots();
      } catch (err) {
        console.error('Failed to delete bot', err);
      }
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotId) return;
    try {
      await installBot({ 
        id: newBotId, 
        name: newBotId, 
        version: '1.0.0', 
        isActive: false 
      });
      setNewBotId('');
      setShowModal(false);
      await refreshBots();
    } catch (err) {
      console.error('Failed to install bot', err);
      showToast('Failed to install plugin', 'error');
    }
  };

  return (
    <main className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-y-auto bg-background">
      {/* TopAppBar */}
      <header className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-unit-sm bg-surface border-b border-outline-variant sticky top-0 z-40">
        <div className="flex items-center gap-unit-md">
          <h1 className="font-h1 text-h1 font-black text-primary-fixed-dim tracking-tighter">BotManager</h1>
          <div className="hidden lg:flex items-center bg-surface-container-low px-unit-md py-unit-xs rounded-full border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
            <input className="bg-transparent border-none focus:outline-none focus:ring-0 text-body-sm text-on-surface w-48 font-body-sm" placeholder="Search systems..." type="text" />
          </div>
        </div>
        <div className="flex items-center gap-unit-lg">
          <button onClick={() => setShowModal(true)} className="bg-primary-container text-on-primary-container font-bold px-unit-lg py-2 rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined">add</span>
            <span className="hidden md:inline">Add New Bot</span>
          </button>
          <div className="flex items-center gap-unit-sm">
            <button className="text-on-surface-variant hover:text-primary-fixed transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary-fixed transition-colors">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <section className="p-unit-lg md:p-margin-desktop space-y-unit-lg max-w-container-max mx-auto w-full pb-24 md:pb-margin-desktop">
        {/* Page Header */}
        <div className="flex flex-col gap-unit-xs">
          <h2 className="font-h1 text-h1 text-on-surface">Bot Management</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Configure, monitor, and deploy your automated instances across global clusters.</p>
        </div>

        {/* Bento Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-unit-md">
          <div className="bg-surface-container-high p-unit-md rounded-xl border border-outline-variant">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">TOTAL BOTS</p>
            <div className="flex justify-between items-end">
              <p className="font-h1 text-h1 text-on-surface">{bots.length}</p>
              <span className="text-primary-fixed-dim text-sm font-mono-data">Total</span>
            </div>
          </div>
          <div className="bg-surface-container-high p-unit-md rounded-xl border border-outline-variant">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">ACTIVE STATUS</p>
            <div className="flex justify-between items-end">
              <p className="font-h1 text-h1 text-primary-fixed-dim">{activeCount}</p>
              <div className="h-2 w-16 bg-primary-fixed-dim/20 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary-fixed-dim" style={{ width: bots.length ? `${(activeCount/bots.length)*100}%` : '0%' }}></div>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-high p-unit-md rounded-xl border border-outline-variant">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">AVG RESPONSE</p>
            <div className="flex justify-between items-end">
              <p className="font-h1 text-h1 text-on-surface">12ms</p>
              <span className="text-primary-fixed-dim material-symbols-outlined">trending_up</span>
            </div>
          </div>
          <div className="bg-surface-container-high p-unit-md rounded-xl border border-outline-variant">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">ERROR RATE</p>
            <div className="flex justify-between items-end">
              <p className="font-h1 text-h1 text-error">0.02%</p>
              <span className="text-error material-symbols-outlined">check_circle</span>
            </div>
          </div>
        </div>

        {/* Bot Management Table Container */}
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-highest/50 border-b border-outline-variant">
                  <th className="px-unit-lg py-unit-md font-label-caps text-label-caps text-on-surface-variant">Bot ID</th>
                  <th className="px-unit-lg py-unit-md font-label-caps text-label-caps text-on-surface-variant">Name</th>
                  <th className="px-unit-lg py-unit-md font-label-caps text-label-caps text-on-surface-variant text-center">Status</th>
                  <th className="px-unit-lg py-unit-md font-label-caps text-label-caps text-on-surface-variant text-right">Performance</th>
                  <th className="px-unit-lg py-unit-md font-label-caps text-label-caps text-on-surface-variant text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {bots.map((bot) => (
                  <tr key={bot.id} className={`hover:bg-surface-container-high transition-colors group ${!bot.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-unit-lg py-unit-md">
                      <span className={`font-mono-data text-mono-data px-2 py-1 rounded ${bot.isActive ? 'text-primary-fixed-dim bg-primary-fixed-dim/10' : 'text-on-surface-variant bg-surface-container-highest'}`}>
                        #{bot.id.split('-')[0].toUpperCase()}
                      </span>
                    </td>
                    <td className="px-unit-lg py-unit-md">
                      <div className="flex flex-col">
                        <span className="font-h3 text-h3 text-on-surface">{bot.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 max-w-[200px]">{bot.description || 'System cluster'}</span>
                      </div>
                    </td>
                    <td className="px-unit-lg py-unit-md">
                      <div className="flex justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={bot.isActive}
                            onChange={() => handleToggle(bot.id, bot.isActive)}
                          />
                          <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-fixed-dim"></div>
                        </label>
                      </div>
                    </td>
                    <td className="px-unit-lg py-unit-md text-right">
                      {bot.isActive ? (
                        <div className="flex justify-end gap-1 items-end h-8">
                          <div className="w-1 h-4 bg-primary-fixed-dim/20 rounded-full animate-pulse"></div>
                          <div className="w-1 h-6 bg-primary-fixed-dim/40 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-3 bg-primary-fixed-dim/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1 h-8 bg-primary-fixed-dim rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                          <div className="w-1 h-5 bg-primary-fixed-dim/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      ) : (
                        <span className="font-label-caps text-label-caps text-on-surface-variant">OFFLINE</span>
                      )}
                    </td>
                    <td className="px-unit-lg py-unit-md text-right flex justify-end gap-2">
                      <button onClick={() => handleOpenSchedule(bot.id)} className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors p-2 hover:bg-primary-fixed-dim/10 rounded-lg" title="Configure Alerts">
                        <span className="material-symbols-outlined">schedule</span>
                      </button>
                      <button onClick={() => handleDelete(bot.id)} className="text-on-surface-variant hover:text-error transition-colors p-2 hover:bg-error/10 rounded-lg">
                        <span className="material-symbols-outlined text-error">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {bots.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-unit-lg py-unit-xl text-center text-on-surface-variant">
                      No bots configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {bots.length > 0 && (
            <div className="px-unit-lg py-unit-md bg-surface-container-high/50 flex justify-between items-center border-t border-outline-variant">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Showing 1 to {bots.length} of {bots.length} bots</span>
              <div className="flex gap-unit-xs">
                <button className="w-8 h-8 rounded border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="w-8 h-8 rounded bg-primary-fixed-dim text-on-primary-fixed font-bold text-sm">1</button>
                <button className="w-8 h-8 rounded border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* System Console / Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-unit-lg">
          <div className="lg:col-span-2 bg-black rounded-xl p-unit-md border border-outline-variant overflow-hidden">
            <div className="flex justify-between items-center mb-unit-md">
              <h4 className="font-label-caps text-label-caps text-primary-fixed-dim flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-fixed-dim rounded-full animate-pulse"></span>
                LIVE SYSTEM LOGS
              </h4>
              <span className="text-on-surface-variant text-[10px] font-mono-data">TTY/BOT_MANAGER/v2.4.0</span>
            </div>
            <div className="space-y-1 font-mono-data text-mono-data text-on-surface-variant/80 h-40 overflow-y-auto scrollbar-thin">
              <p><span className="text-primary-fixed-dim">[14:20:01]</span> BotManager System: WebSocket listener initialized on port 3001.</p>
              <p><span className="text-primary-fixed-dim">[14:20:05]</span> Discovered {bots.length} registered bot instances from microkernel.</p>
              {activeCount > 0 && <p><span className="text-primary-fixed-dim">[14:20:12]</span> <span className="text-secondary-fixed">Status:</span> {activeCount} bots online and verified.</p>}
              {bots.length - activeCount > 0 && <p><span className="text-error">[14:21:05]</span> WARNING: {bots.length - activeCount} bots offline or unresponsive.</p>}
              <p className="animate-pulse">_</p>
            </div>
          </div>
          
          <div className="bg-surface-container-high rounded-xl p-unit-md border border-outline-variant flex flex-col justify-center items-center text-center">
            <span className="material-symbols-outlined text-primary-fixed-dim text-4xl mb-unit-md">verified_user</span>
            <h4 className="font-h3 text-h3 text-on-surface mb-unit-xs">Security Protocol Active</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-unit-md">End-to-end encrypted channel for all bot communication.</p>
            <button className="font-label-caps text-label-caps text-primary-fixed-dim hover:underline transition-all">VIEW SECURITY CERTIFICATES</button>
          </div>
        </div>
      </section>

      {/* Modal: New Bot */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-surface-container p-8 rounded-xl max-w-md w-full border border-outline-variant">
            <h3 className="text-xl font-h2 text-on-surface mb-4">Install New Bot Plugin</h3>
            <form onSubmit={handleInstall} className="flex flex-col gap-4">
              <div>
                <label className="block font-body-sm text-on-surface-variant mb-1">Plugin ID</label>
                <input 
                  type="text" 
                  value={newBotId}
                  onChange={(e) => setNewBotId(e.target.value)}
                  placeholder="e.g., bot-weather-001" 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary-fixed-dim"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-on-surface hover:bg-surface-container-high transition-colors font-body-sm">
                  Cancel
                </button>
                <button type="submit" className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all text-sm">
                  Install
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Config */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-surface-container p-8 rounded-2xl max-w-lg w-full border border-outline-variant shadow-[0_0_40px_rgba(42,229,0,0.1)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-h2 text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed-dim">automation</span>
                Automation Settings
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-label-caps font-label-caps text-on-surface-variant mb-1">Interval *</label>
                    <input 
                      type="number" 
                      min="1"
                      value={scheduleData.intervalValue || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                        setScheduleData({...scheduleData, intervalValue: val});
                      }}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim/30"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-label-caps font-label-caps text-on-surface-variant mb-1">Unit *</label>
                    <select 
                      value={scheduleData.intervalUnit}
                      onChange={(e) => setScheduleData({...scheduleData, intervalUnit: e.target.value as any})}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim/30"
                    >
                      <option value="minutes">Phút (Minutes)</option>
                      <option value="hours">Giờ (Hours)</option>
                      <option value="days">Ngày (Days)</option>
                    </select>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-label-caps font-label-caps text-on-surface-variant mb-1">Job Keywords *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. NodeJS, Backend, DevOps"
                    value={scheduleData.keywords}
                    onChange={(e) => setScheduleData({...scheduleData, keywords: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-label-caps font-label-caps text-on-surface-variant mb-1">Level</label>
                  <input 
                    type="text" 
                    placeholder="Junior, Senior..."
                    value={scheduleData.level}
                    onChange={(e) => setScheduleData({...scheduleData, level: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim/30"
                  />
                </div>
                <div>
                  <label className="block text-label-caps font-label-caps text-on-surface-variant mb-1">Salary Range</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 20-30 triệu"
                    value={scheduleData.salary}
                    onChange={(e) => setScheduleData({...scheduleData, salary: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim/30"
                  />
                </div>
                <div>
                  <label className="block text-label-caps font-label-caps text-on-surface-variant mb-1">Location</label>
                  <input 
                    type="text" 
                    placeholder="Hồ Chí Minh, Hà Nội..."
                    value={scheduleData.location}
                    onChange={(e) => setScheduleData({...scheduleData, location: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim/30"
                  />
                </div>
                <div>
                  <label className="block text-label-caps font-label-caps text-on-surface-variant mb-1">Specific Company</label>
                  <input 
                    type="text" 
                    placeholder="e.g. FPT, VNG"
                    value={scheduleData.company}
                    onChange={(e) => setScheduleData({...scheduleData, company: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim/30"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-6 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors font-bold">
                  Cancel
                </button>
                <button type="submit" className="bg-primary-fixed-dim text-on-primary-fixed px-8 py-3 rounded-xl font-bold hover:brightness-110 shadow-[0_4px_16px_rgba(42,229,0,0.2)] transition-all">
                  Save Automation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
