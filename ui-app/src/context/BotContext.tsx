'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchBots } from '@/services/api';

export interface Bot {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  avatarUrl?: string;
}

interface BotContextType {
  bots: Bot[];
  setBots: React.Dispatch<React.SetStateAction<Bot[]>>;
  selectedBotId: string | null;
  setSelectedBotId: (id: string | null) => void;
  refreshBots: () => Promise<void>;
  currentView: 'dashboard' | 'settings';
  setCurrentView: (view: 'dashboard' | 'settings') => void;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotIdState] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');

  const setSelectedBotId = (id: string | null) => {
    setSelectedBotIdState(id);
    if (id) {
      localStorage.setItem('selectedBotId', id);
    } else {
      localStorage.removeItem('selectedBotId');
    }
  };

  const refreshBots = async () => {
    try {
      const data = await fetchBots();
      setBots(data);
    } catch (error) {
      console.error('Failed to fetch bots:', error);
    }
  };

  useEffect(() => {
    refreshBots();
    const savedBotId = localStorage.getItem('selectedBotId');
    if (savedBotId) {
      setSelectedBotIdState(savedBotId);
    }
  }, []);

  return (
    <BotContext.Provider value={{ bots, setBots, selectedBotId, setSelectedBotId, refreshBots, currentView, setCurrentView }}>
      {children}
    </BotContext.Provider>
  );
};

export const useBotContext = () => {
  const context = useContext(BotContext);
  if (!context) throw new Error('useBotContext must be used within BotProvider');
  return context;
};
