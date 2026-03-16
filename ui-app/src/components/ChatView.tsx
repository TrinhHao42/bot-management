'use client';
import { useBotContext } from '@/context/BotContext';
import { useState, useEffect, useRef, ReactNode } from 'react';
import { sendMessage, getChatHistory } from '@/services/api';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/context/ToastContext';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function ChatView() {
  const { selectedBotId, setSelectedBotId, bots } = useBotContext();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentBot = bots.find(b => b.id === selectedBotId);

  useEffect(() => {
    if (selectedBotId) {
      getChatHistory(selectedBotId)
        .then((history: any[]) => {
          if (history && history.length > 0) {
            setMessages(history.map(msg => ({
              id: msg.id || Date.now().toString() + Math.random(),
              sender: msg.sender,
              text: msg.message,
              timestamp: new Date(msg.createdAt)
            })));
          }
        })
        .catch(err => console.error("Failed to load chat history:", err));
    }

    // Basic websocket setup if the backend uses a gateway on standard port
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);
    
    newSocket.on('chat_reply', (data: { botId: string, message: string }) => {
      if (data.botId === selectedBotId) {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: data.message, timestamp: new Date() }]);
      }
    });

    newSocket.on('typing_status', (data: { botId: string, isTyping: boolean }) => {
      if (data.botId === selectedBotId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [selectedBotId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!currentBot) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentBot.isActive) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      await sendMessage(currentBot.id, 'user-1', userMsg);
      // We don't set setIsTyping(false) here anymore. 
      // The bot will send a 'typing_status' event via WebSocket to control the indicator.
    } catch (err) {
      setIsTyping(false);
      showToast('Failed to send message. Please check your connection.', 'error');
      console.error('Failed to send message', err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderText = (text: string) => {
    // 1. First, replace legacy HTML tags <a href="URL">TEXT</a> with Markdown [TEXT](URL)
    // to unify the processing logic
    let unifiedText = text.replace(/<a\s+href="([^"]+)">([^<]+)<\/a>/g, '[$2]($1)');

    // 2. Regex for Markdown [text](url) and plain URLs
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const plainUrlRegex = /(?<!\()https?:\/\/[^\s)]+/g;

    let parts: ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // 3. Process the unified text
    while ((match = markdownLinkRegex.exec(unifiedText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(unifiedText.substring(lastIndex, match.index));
      }

      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a 
          key={`link-${match.index}`} 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary-fixed-dim font-bold underline hover:text-primary-fixed transition-colors"
        >
          {linkText}
        </a>
      );
      lastIndex = markdownLinkRegex.lastIndex;
    }

    if (lastIndex < unifiedText.length) {
      const remainingText = unifiedText.substring(lastIndex);
      const plainParts = remainingText.split(plainUrlRegex);
      const urls = remainingText.match(plainUrlRegex) || [];
      
      plainParts.forEach((part, i) => {
        parts.push(part);
        if (i < urls.length) {
          parts.push(
            <a 
              key={`plain-${i}`} 
              href={urls[i]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary-fixed-dim underline hover:text-primary-fixed transition-colors break-all"
            >
              {urls[i]}
            </a>
          );
        }
      });
    }

    return parts;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden text-body-lg relative bg-background">
      {/* Top Header */}
      <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-unit-sm fixed top-0 z-50 h-16">
        <div className="flex items-center gap-unit-md">
          <button onClick={() => setSelectedBotId(null)} className="flex items-center gap-unit-xs text-on-surface hover:text-primary-fixed-dim transition-colors group px-unit-sm py-1.5 rounded-lg hover:bg-surface-container-high">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-h3 text-h3 hidden md:inline">Back</span>
          </button>
          <div className="h-8 w-[1px] bg-outline-variant mx-unit-sm"></div>
          
          <div className="flex items-center gap-unit-sm">
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant/30 text-xl font-bold">
              {currentBot.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-h3 text-h3 leading-none">{currentBot.name}</span>
              <div className="flex items-center gap-unit-xs">
                <span className={`w-2 h-2 rounded-full ${currentBot.isActive ? 'bg-primary-fixed-dim shadow-[0_0_8px_#2ae500]' : 'bg-error'}`}></span>
                <span className={`text-label-caps font-label-caps ${currentBot.isActive ? 'text-primary-fixed-dim' : 'text-error'}`}>
                  {currentBot.isActive ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-unit-md">
          <div className="hidden md:flex bg-surface-container border border-outline-variant rounded-lg px-unit-sm py-1 items-center gap-unit-xs">
            <span className="material-symbols-outlined text-on-surface-variant scale-75">memory</span>
            <span className="font-mono-data text-mono-data text-on-surface-variant">Active</span>
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary-fixed-dim transition-colors hidden md:block">settings</button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 pt-16 pb-24 w-full flex flex-col px-margin-mobile md:px-margin-desktop h-full overflow-hidden">
        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-unit-lg flex flex-col gap-unit-lg" ref={scrollRef}>
          {/* Date Divider */}
          <div className="flex justify-center my-unit-sm">
            <span className="bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps px-unit-md py-1 rounded-full uppercase tracking-widest">Today</span>
          </div>

          {messages.length === 0 && (
            <div className="m-auto flex flex-col items-center justify-center text-on-surface-variant p-8 bg-surface-container-high border border-outline-variant rounded-2xl max-w-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center font-bold text-3xl mb-4 border border-outline-variant/50">
                {currentBot.name.charAt(0)}
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-2">System Initialized</h3>
              <p className="font-body-sm text-body-sm">Start a conversation with {currentBot.name}. Connection secure.</p>
            </div>
          )}

          {messages.map((msg) => (
            msg.sender === 'bot' ? (
              // Bot Message
              <div key={msg.id} className="flex flex-col items-start max-w-[85%] md:max-w-[70%]">
                <div className="flex items-end gap-unit-sm">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex-shrink-0 flex items-center justify-center overflow-hidden text-sm font-bold border border-outline-variant/30">
                    {currentBot.name.charAt(0)}
                  </div>
                  <div className="bg-surface-container-high text-on-surface p-unit-md rounded-xl rounded-bl-none border border-outline-variant">
                    <p className="font-body-lg text-body-lg whitespace-pre-wrap">{renderText(msg.text)}</p>
                  </div>
                </div>
                <span className="font-mono-data text-[10px] text-on-surface-variant ml-10 mt-1 uppercase">{formatTime(msg.timestamp)}</span>
              </div>
            ) : (
              // User Message
              <div key={msg.id} className="flex flex-col items-end self-end max-w-[85%] md:max-w-[70%]">
                <div className="bg-primary-container text-on-primary-container p-unit-md rounded-xl rounded-br-none shadow-[0_4px_12px_rgba(57,255,20,0.1)] border border-primary-fixed-dim/30">
                  <p className="font-body-lg text-body-lg font-medium whitespace-pre-wrap">{renderText(msg.text)}</p>
                </div>
                <span className="font-mono-data text-[10px] text-on-surface-variant mr-2 mt-1 uppercase">{formatTime(msg.timestamp)}</span>
              </div>
            )
          ))}

          {/* Bot Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-unit-sm ml-10 text-on-surface-variant italic">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
              <span className="font-body-sm text-body-sm">{currentBot.name} is searching for jobs...</span>
            </div>
          )}
        </div>
      </main>

      {/* Sleek Bottom Input Bar */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-surface-dim px-margin-mobile md:px-margin-desktop py-unit-md border-t border-outline-variant">
        <form onSubmit={handleSend} className="w-full flex items-end gap-unit-sm">
          {/* Attachment Actions */}
          <div className="hidden sm:flex gap-unit-xs mb-1">
            <button type="button" className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest hover:text-primary-fixed-dim transition-all" title="Attach File">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
          </div>
          
          {/* Input Container */}
          <div className="flex-grow relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-unit-md py-[12px] pr-12 focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim/30 focus:border-primary-fixed-dim placeholder:text-on-surface-variant/50 resize-none transition-all custom-scrollbar leading-relaxed font-body-lg text-body-lg" 
              placeholder={`Message ${currentBot.name}...`} 
              rows={1}
              disabled={!currentBot.isActive}
            />
            <button type="button" className="absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary-fixed-dim" title="Terminal Mode">
              <span className="material-symbols-outlined scale-90">terminal</span>
            </button>
          </div>
          
          {/* Send Button */}
          <button type="submit" disabled={!currentBot.isActive || !input.trim()} className="bg-primary-fixed-dim text-on-primary-fixed px-unit-lg py-[12px] rounded-xl font-bold flex items-center gap-unit-xs hover:brightness-110 active:scale-95 transition-all mb-[1px] shadow-[0_4px_16px_rgba(42,229,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="hidden md:inline">Send</span>
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
