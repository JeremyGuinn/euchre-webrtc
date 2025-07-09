import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useIsClient } from '~/hooks/useClientOnly';
import { createScopedLogger } from '~/services/loggingService';

const logger = createScopedLogger('SessionContext');

export interface SessionData {
  playerId: string;
  gameId: string;
  gameCode?: string;
  isHost: boolean;
  playerName?: string;
  lastConnectionTime: number;
}

export interface SessionContextType {
  // Session state
  sessionData: SessionData | null;
  playerName: string | null;
  hasValidSession: boolean;
  isSessionExpired: boolean;

  // Session actions
  saveSession: (data: Omit<SessionData, 'lastConnectionTime'>) => void;
  updateSession: (updates: Partial<Omit<SessionData, 'lastConnectionTime'>>) => void;
  clearSession: () => void;
  savePlayerName: (name: string) => void;
  updateLastConnectionTime: () => void;

  // Session validation
  validateSession: () => boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
}

const SESSION_KEYS = {
  SESSION_DATA: 'euchre-session-data',
  PLAYER_NAME: 'euchre-player-name',
} as const;

// Session expires after 1 hour of inactivity
const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};

const storageStrategy: Storage =
  typeof window !== 'undefined' ? window.sessionStorage : noopStorage;

export function SessionProvider({ children }: SessionProviderProps) {
  const isClient = useIsClient();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Load session data from storage on mount
  useEffect(() => {
    if (!isClient) return;

    logger.debug('Loading session data from storage');

    try {
      // Load player name
      const storedPlayerName = storageStrategy.getItem(SESSION_KEYS.PLAYER_NAME);
      if (storedPlayerName) {
        setPlayerName(storedPlayerName);
        logger.debug('Loaded player name from storage', {
          playerName: storedPlayerName,
        });
      }

      // Load session data
      const storedSessionData = storageStrategy.getItem(SESSION_KEYS.SESSION_DATA);

      if (storedSessionData) {
        const parsedSessionData: SessionData = JSON.parse(storedSessionData);

        // Check if session has expired
        const now = Date.now();
        const timeSinceLastConnection = now - parsedSessionData.lastConnectionTime;

        if (timeSinceLastConnection > SESSION_TIMEOUT_MS) {
          logger.warn('Session expired, clearing stored data', {
            timeSinceLastConnection,
            timeout: SESSION_TIMEOUT_MS,
          });
          setIsSessionExpired(true);
          storageStrategy.removeItem(SESSION_KEYS.SESSION_DATA);
        } else {
          setSessionData(parsedSessionData);
          logger.info('Loaded valid session from storage', {
            playerId: parsedSessionData.playerId,
            gameId: parsedSessionData.gameId,
            isHost: parsedSessionData.isHost,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to load session data from storage', { error });
      storageStrategy.removeItem(SESSION_KEYS.SESSION_DATA);
    }
  }, [isClient]);

  const saveSession = useCallback(
    (data: Omit<SessionData, 'lastConnectionTime'>) => {
      if (!isClient) return;

      const newSessionData: SessionData = {
        ...data,
        lastConnectionTime: Date.now(),
      };

      try {
        storageStrategy.setItem(SESSION_KEYS.SESSION_DATA, JSON.stringify(newSessionData));
        setSessionData(newSessionData);
        setIsSessionExpired(false);

        logger.info('Session saved', {
          playerId: newSessionData.playerId,
          gameId: newSessionData.gameId,
          isHost: newSessionData.isHost,
        });
      } catch (error) {
        logger.error('Failed to save session data', {
          error,
          sessionData: newSessionData,
        });
      }
    },
    [isClient]
  );

  const updateSession = useCallback(
    (updates: Partial<Omit<SessionData, 'lastConnectionTime'>>) => {
      if (!isClient || !sessionData) return;

      const updatedSessionData: SessionData = {
        ...sessionData,
        ...updates,
        lastConnectionTime: Date.now(),
      };

      try {
        storageStrategy.setItem(SESSION_KEYS.SESSION_DATA, JSON.stringify(updatedSessionData));
        setSessionData(updatedSessionData);

        logger.debug('Session updated', { updates });
      } catch (error) {
        logger.error('Failed to update session data', { error, updates });
      }
    },
    [isClient, sessionData]
  );

  const clearSession = useCallback(() => {
    if (!isClient) return;

    try {
      storageStrategy.removeItem(SESSION_KEYS.SESSION_DATA);
      setSessionData(null);
      setIsSessionExpired(false);

      logger.info('Session cleared');
    } catch (error) {
      logger.error('Failed to clear session data', { error });
    }
  }, [isClient]);

  const savePlayerName = useCallback(
    (name: string) => {
      if (!isClient) return;

      try {
        storageStrategy.setItem(SESSION_KEYS.PLAYER_NAME, name);
        setPlayerName(name);

        logger.debug('Player name saved', { playerName: name });
      } catch (error) {
        logger.error('Failed to save player name', { error, playerName: name });
      }
    },
    [isClient]
  );

  const updateLastConnectionTime = useCallback(() => {
    if (!isClient || !sessionData) return;

    const updatedSessionData = {
      ...sessionData,
      lastConnectionTime: Date.now(),
    };

    try {
      storageStrategy.setItem(SESSION_KEYS.SESSION_DATA, JSON.stringify(updatedSessionData));
      setSessionData(updatedSessionData);

      logger.trace('Last connection time updated');
    } catch (error) {
      logger.error('Failed to update last connection time', { error });
    }
  }, [isClient, sessionData]);

  const validateSession = useCallback(() => {
    if (!sessionData) return false;

    const isValid = !!(sessionData.playerId && sessionData.gameId);

    logger.debug('Session validation', {
      isValid,
      hasPlayerId: !!sessionData.playerId,
      hasGameId: !!sessionData.gameId,
    });

    return isValid;
  }, [sessionData]);

  const hasValidSession = validateSession();

  const contextValue: SessionContextType = {
    // State
    sessionData,
    playerName,
    hasValidSession,
    isSessionExpired,

    // Actions
    saveSession,
    updateSession,
    clearSession,
    savePlayerName,
    updateLastConnectionTime,

    // Validation
    validateSession,
  };

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}
