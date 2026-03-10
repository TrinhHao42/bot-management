export interface ChatContext {
  userId: string;
  message: string;
  botId: string;
}

export interface IBotPlugin {
  metadata: {
    id: string;
    name: string;
    version: string;
    description: string;
  };

  lifecycle: {
    onInstall(): Promise<void>;
    onUninstall(): Promise<void>;
    onEnable(): Promise<void>;
    onDisable(): Promise<void>;
  };

  messaging: {
    handleMessage(context: ChatContext): Promise<void>;
  };
}
