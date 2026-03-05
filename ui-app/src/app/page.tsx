'use client';
import { BotProvider, useBotContext } from '@/context/BotContext';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import SettingsView from '@/components/SettingsView';
import ChatView from '@/components/ChatView';

function AppContent() {
  const { selectedBotId, currentView } = useBotContext();

  return (
    <div className="flex min-h-screen w-full bg-background text-on-background overflow-hidden">
      <Sidebar />
      {selectedBotId ? (
        <ChatView />
      ) : (
        currentView === 'dashboard' ? <DashboardView /> : <SettingsView />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <BotProvider>
      <AppContent />
    </BotProvider>
  );
}
