import type { NetworkServiceConfig } from '~/hooks/useNetworkService';
import type { NetworkManager } from '~/network/networkManager';
import type { GameMessage } from '~/types/messages';

export interface NetworkService {
  sendMessage: (message: GameMessage, targetId?: string) => void;
  disconnect: () => void;
  leaveGame: (reason?: 'manual' | 'error' | 'network' | 'kicked') => Promise<void>;
  hostGame: () => Promise<{
    gameCode: string;
    hostId: string;
    gameUuid: string;
  }>;
  joinGame: (gameCode: string, playerName: string) => Promise<string>;
  configure: (config: NetworkServiceConfig) => void;
  updateConfig: (updates: Partial<NetworkServiceConfig>) => void;
  getNetworkManager: () => NetworkManager;
}
